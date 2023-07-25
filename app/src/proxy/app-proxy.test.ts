import { MockedClass } from "jest-mock";
import { AppProxy } from "./app-proxy";
import {
  AcknowledgeMessage,
  AppConfig,
  AppPublishMessage,
  AppUpstreamMessage,
  CloseAppMessage,
  ConnectLogger,
  LifecycleHandlerCompletedMessage,
  LifecycleMessage,
  LogLevel,
  LogMessage,
  SubscriptionTopic,
} from "@amzn/amazon-connect-sdk-core";
import { AmazonConnectAppProvider } from "../app-provider";
import { AmazonConnectAppConfig } from "../amazon-connect-app-config";
import { LifecycleManager } from "../lifecycle";

jest.mock("@amzn/amazon-connect-sdk-core/lib/logging/connect-logger");

jest.mock("../lifecycle/lifecycle-manager");

const LifecycleManagerMock = LifecycleManager as MockedClass<
  typeof LifecycleManager
>;
const LoggerMock = ConnectLogger as MockedClass<typeof ConnectLogger>;

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

let provider: AmazonConnectAppProvider;
let sut: AppProxy;
let subjectPort: MessagePort;
let mockWindowPostMessage: jest.Mock<any, any, Transferable[]>;

beforeEach(() => {
  jest.resetAllMocks();
  provider = new AmazonConnectAppProvider({} as AmazonConnectAppConfig);
  mockWindowPostMessage = jest.fn();
  global.window = {
    ...global.window,
    parent: { postMessage: mockWindowPostMessage },
  } as unknown as Window & typeof globalThis;

  mockWindowPostMessage.mockImplementation((_t, _o, [port]) => {
    subjectPort = port;
  });
});

afterEach(() => {
  subjectPort?.close();
});

describe("when performing the init via the provider", () => {
  beforeEach(() => {
    sut = provider.getProxy() as AppProxy;
  });

  test("should send postMessage with messageChannel", () => {
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
    const ackMsg: AcknowledgeMessage = {
      type: "acknowledge",
      status: {
        initialized: true,
        startTime: new Date(),
      },
    };

    subjectPort.postMessage(ackMsg);

    // Sending a message through a message channel cannot be awaited.
    // For testing a loop with a quick delay is required
    await waitForMessageChannel(() => sut.connectionStatus === "initializing");

    expect(sut.connectionStatus).toEqual("ready");
  });
});

describe("when appProxy is ready", () => {
  let upstreamMessages: AppUpstreamMessage[];

  beforeEach(async () => {
    upstreamMessages = [];
    mockWindowPostMessage.mockImplementation((_t, _o, [port]) => {
      subjectPort = port;
      subjectPort.onmessage = (msg) => upstreamMessages.push(msg.data);
    });

    sut = provider.getProxy() as AppProxy;

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
