/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  AppConfig,
  AppPublishMessage,
  AppUpstreamMessage,
  CloseAppMessage,
  LifecycleHandlerCompletedMessage,
  LifecycleMessage,
} from "@amazon-connect/app-common";
import {
  AcknowledgeMessage,
  ConnectLogger,
  LogLevel,
  LogMessage,
  SubscriptionTopic,
  TimeoutTracker,
  TimeoutTrackerCancelledHandler,
} from "@amazon-connect/core";
import { ErrorService } from "@amazon-connect/core/lib/proxy/error";
import { MockedClass } from "jest-mock";

import { AmazonConnectApp } from "../amazon-connect-app";
import { AmazonConnectAppConfig } from "../amazon-connect-app-config";
import { LifecycleManager } from "../lifecycle";
import { AppProxy } from "./app-proxy";
import * as connectionTimeout from "./connection-timeout";

jest.mock("@amazon-connect/core/lib/logging/connect-logger");
jest.mock("@amazon-connect/core/lib/utility/timeout-tracker");
jest.mock("@amazon-connect/core/lib/proxy/error/error-service");

jest.mock("../lifecycle/lifecycle-manager");
jest.mock("./connection-timeout");

const LifecycleManagerMock = LifecycleManager as MockedClass<
  typeof LifecycleManager
>;
const LoggerMock = ConnectLogger as MockedClass<typeof ConnectLogger>;
const TimeoutTrackerMock = TimeoutTracker as MockedClass<typeof TimeoutTracker>;
const ErrorServiceMock = ErrorService as MockedClass<typeof ErrorService>;

// About these tests re: MessageChannel
// ====================================
// Many of the tests are use the MessageChannel established by the app proxy.
// Messages passed through a MessageChannel are outside of the direct Node
// event loop. For testing, this leads to an inherent race condition as there
// is no great way to know when the message channel is done. To account for
// this, the following waitForMessageChannel helper is added to this test file.
// It works by waiting for a condition set as a parameter. That condition
// should reflect the state after the event goes through the MessageChannel.
// If that condition is not met within a given test, the test will timeout
// based upon however jest is configured.
const waitForMessageChannel = async (condition: () => boolean) => {
  while (condition()) await new Promise((resolve) => setTimeout(resolve, 1));
};

const getAppProxyLogger = () => {
  const idx = LoggerMock.mock.calls.findIndex(
    ([a]) => typeof a === "object" && a.source === "app.appProxy"
  );

  if (idx < 0) throw new Error("app proxy logger not found");

  return LoggerMock.mock.instances[idx];
};

let provider: AmazonConnectApp;
let sut: AppProxy;
let subjectPort: MessagePort;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let mockWindowPostMessage: jest.Mock<any, any, Transferable[]>;

let mockTimeoutTrackerStart: jest.SpyInstance<
  TimeoutTracker,
  [TimeoutTrackerCancelledHandler, number]
>;

beforeEach(() => {
  jest.resetAllMocks();
  provider = new AmazonConnectApp({} as AmazonConnectAppConfig);
  mockWindowPostMessage = jest.fn();
  global.window = {
    ...global.window,
    parent: { postMessage: mockWindowPostMessage },
  } as unknown as Window & typeof globalThis;

  mockWindowPostMessage.mockImplementation((_t, _o, [port]) => {
    subjectPort = port;
  });
  mockTimeoutTrackerStart = jest
    .spyOn(TimeoutTracker, "start")
    .mockImplementation(
      (onCancelled, ms) => new TimeoutTracker(onCancelled, ms)
    );
});

afterEach(() => {
  subjectPort?.close();
});

describe("when performing the init via the provider", () => {
  test("should set the timeout from config", () => {
    const timeout = 4000;
    const configSpy = jest
      .spyOn(connectionTimeout, "getConnectionTimeout")
      .mockReturnValue(timeout);

    sut = provider.getProxy() as AppProxy;

    expect(mockTimeoutTrackerStart).toHaveBeenCalledWith(
      expect.anything(),
      timeout
    );
    expect(configSpy).toHaveBeenCalledWith(provider.config);
  });

  test("should send postMessage with messageChannel", () => {
    sut = provider.getProxy() as AppProxy;
    expect(mockWindowPostMessage).toHaveBeenCalledTimes(1);
    const [msg, targetOrigin, [transport]] =
      mockWindowPostMessage.mock.calls[0];
    expect(msg.type).toEqual("connect-app-host-init");
    expect(targetOrigin).toEqual("*");
    expect(transport).toEqual(subjectPort);
  });

  test("should be status initializing", () => {
    expect(sut.connectionStatus).toEqual("initializing");
  });

  test("should be ready after acknowledge is sent via subject port", async () => {
    sut = provider.getProxy() as AppProxy;
    const [connectionTimer] = TimeoutTrackerMock.mock.instances;
    const ackMsg: AcknowledgeMessage = {
      type: "acknowledge",
      status: {
        initialized: true,
        startTime: new Date(),
      },
    };
    connectionTimer.complete.mockReturnValue(true);

    subjectPort.postMessage(ackMsg);

    // Sending a message through a message channel cannot be awaited.
    // For testing a loop with a quick delay is required
    await waitForMessageChannel(() => sut.connectionStatus === "initializing");

    expect(sut.connectionStatus).toEqual("ready");
    expect(connectionTimer.complete).toHaveBeenCalled();
  });

  describe("when the workspace connection times out", () => {
    test("should put the proxy into an error state ", () => {
      sut = provider.getProxy() as AppProxy;
      const [[errorHandler]] = TimeoutTrackerMock.mock.calls;

      errorHandler({ timeoutMs: 4000 });

      expect(sut.connectionStatus).toEqual("error");
    });

    test("should invoke an error on proxy error service", () => {
      sut = provider.getProxy() as AppProxy;
      const [errorService] = ErrorServiceMock.mock.instances;
      const [[errorHandler]] = TimeoutTrackerMock.mock.calls;

      errorHandler({ timeoutMs: 4000 });

      expect(errorService.invoke).toHaveBeenCalledTimes(1);
      const [errorBody] = errorService.invoke.mock.calls[0];
      expect(errorBody.isFatal).toBeTruthy();
      expect(errorBody.key).toEqual("workspaceConnectTimeout");
      expect(errorBody.details?.timeoutMs).toEqual(4000);
      expect(errorBody.connectionStatus).toEqual("error");
    });

    test("should not call complete on the timeout tracker when acknowledge is not sent", () => {
      sut = provider.getProxy() as AppProxy;
      const [[errorHandler]] = TimeoutTrackerMock.mock.calls;
      const [connectionTimer] = TimeoutTrackerMock.mock.instances;

      errorHandler({ timeoutMs: 4000 });

      expect(connectionTimer.complete).not.toHaveBeenCalled();
    });

    test("should not acknowledge proxy if timeout has passed and acknowledge message is received", async () => {
      sut = provider.getProxy() as AppProxy;
      const [connectionTimer] = TimeoutTrackerMock.mock.instances;
      const logger = getAppProxyLogger();
      const ackMsg: AcknowledgeMessage = {
        type: "acknowledge",
        status: {
          initialized: true,
          startTime: new Date(),
        },
      };
      connectionTimer.complete.mockReturnValue(false);

      subjectPort.postMessage(ackMsg);

      // Sending a message through a message channel cannot be awaited.
      // For testing a loop with a quick delay is required
      await waitForMessageChannel(
        () => connectionTimer.complete.mock.calls.length === 0
      );

      expect(sut.connectionStatus).not.toEqual("ready");
      expect(connectionTimer.complete).toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalledTimes(1);
    });
  });
});

describe("when appProxy is ready", () => {
  let upstreamMessages: AppUpstreamMessage[];

  beforeEach(async () => {
    upstreamMessages = [];
    mockWindowPostMessage.mockImplementation((_t, _o, [port]) => {
      subjectPort = port;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      subjectPort.onmessage = (msg) => upstreamMessages.push(msg.data);
    });

    sut = provider.getProxy() as AppProxy;
    const [connectionTimer] = TimeoutTrackerMock.mock.instances;

    connectionTimer.complete.mockReturnValueOnce(true);
    const ackMsg: AcknowledgeMessage = {
      type: "acknowledge",
      status: {
        initialized: true,
        startTime: new Date(),
      },
    };
    subjectPort.postMessage(ackMsg);

    await waitForMessageChannel(() => sut.connectionStatus === "initializing");
  });

  test("should have a proxyType AppProxy", () => {
    expect(sut.proxyType).toEqual("AppProxy");
  });

  describe("sendLifecycleHandlerCompleted", () => {
    test("should send created complete", async () => {
      const appInstanceId = "abc123";

      sut.sendLifecycleHandlerCompleted(appInstanceId, "create");
      await waitForMessageChannel(() => upstreamMessages.length === 0);

      const result = upstreamMessages[0] as LifecycleHandlerCompletedMessage;
      expect(result.type).toEqual("appLifecycleHandlerCompleted");
      expect(result.stage).toEqual("create");
      expect(result.appInstanceId).toEqual(appInstanceId);
    });

    test("should send destroy complete", async () => {
      const appInstanceId = "abc123";

      sut.sendLifecycleHandlerCompleted(appInstanceId, "destroy");
      await waitForMessageChannel(() => upstreamMessages.length === 0);

      const result = upstreamMessages[0] as LifecycleHandlerCompletedMessage;
      expect(result.type).toEqual("appLifecycleHandlerCompleted");
      expect(result.stage).toEqual("destroy");
      expect(result.appInstanceId).toEqual(appInstanceId);
    });
  });

  describe("tryCloseApp", () => {
    test("should send close request", async () => {
      const message = "test message";

      sut.tryCloseApp(message);
      await waitForMessageChannel(() => upstreamMessages.length === 0);

      const result = upstreamMessages[0] as CloseAppMessage;
      expect(result.type).toEqual("closeApp");
      expect(result.isFatalError).toBeFalsy();
      expect(result.message).toEqual(message);
    });

    test("should send fatal error close request", async () => {
      const message = "test message";
      const errorData = { foo: "test" };

      sut.tryCloseApp(message, true, errorData);
      await waitForMessageChannel(() => upstreamMessages.length === 0);

      const result = upstreamMessages[0] as CloseAppMessage;
      expect(result.type).toEqual("closeApp");
      expect(result.isFatalError).toBeTruthy();
      expect(result.message).toEqual(message);
      expect(result.data).toEqual(expect.objectContaining(errorData));
    });
  });

  describe("publish", () => {
    test("should send app publish", async () => {
      const topic: SubscriptionTopic = { namespace: "foo", key: "bar" };
      const data = { foo: "test" };

      sut.publish(topic, data);
      await waitForMessageChannel(() => upstreamMessages.length === 0);

      const result = upstreamMessages[0] as AppPublishMessage;
      expect(result.type).toEqual("appPublish");
      expect(result.topic).toEqual(expect.objectContaining(topic));
      expect(result.data).toEqual(expect.objectContaining(data));
    });
  });

  describe("log", () => {
    test("should send a log message with expected log context", async () => {
      const origin = "http://test.com";
      const pathname = "/test-app";
      global.document = {
        ...global.document,
        location: { ...global?.document?.location, origin, pathname },
      };
      const level = LogLevel.error;
      const source = "test";
      const message = "test message";
      const loggerId = "1234";
      const data = { foo: "test" };
      const lifecycleMock = LifecycleManagerMock.mock.instances[0];
      Object.defineProperty(lifecycleMock, "appState", {
        get: jest.fn(() => ({ isRunning: true })),
      });

      sut.log({ level, source, message, loggerId, data });
      await waitForMessageChannel(() => upstreamMessages.length === 0);

      const result = upstreamMessages[0] as LogMessage;
      expect(result.type).toEqual("log");
      expect(result.level).toEqual(level);
      expect(result.time).toBeDefined();
      expect(result.source).toEqual(source);
      expect(result.loggerId).toEqual(loggerId);
      expect(result.data).toEqual(expect.objectContaining(data));
      expect(result.context.appIsRunning).toBeTruthy();

      const appLoggingInfo = result.context.app as Record<string, string>;
      expect(appLoggingInfo.origin).toEqual(origin);
      expect(appLoggingInfo.path).toEqual(pathname);
    });
  });

  describe("downstream appLifecycle message", () => {
    test("should route appLifecycle message to LifecycleManager", async () => {
      const msg: LifecycleMessage = {
        type: "appLifecycle",
        appInstanceId: "abc123",
        stage: "create",
        appConfig: {} as AppConfig,
      };
      const lifecycleMock = LifecycleManagerMock.mock.instances[0];
      lifecycleMock.handleLifecycleChangeMessage.mockResolvedValue();

      subjectPort.postMessage(msg);
      await waitForMessageChannel(
        () => lifecycleMock.handleLifecycleChangeMessage.mock.calls.length === 0
      );

      expect(lifecycleMock.handleLifecycleChangeMessage).toHaveBeenCalledWith(
        msg
      );
    });
  });
});
