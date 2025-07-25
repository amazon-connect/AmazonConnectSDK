/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { ConnectLogger, LogLevel } from "@amazon-connect/core";
import {
  AppConfig,
  ContactScope,
  LifecycleMessage,
} from "@amazon-connect/workspace-types";
import { MockedClass, MockedObject } from "jest-mock";
import { mock } from "jest-mock-extended";

import { AmazonConnectServiceConfig } from "../config";
import { AppProxy } from "../proxy";
import { AmazonConnectService } from "../service";
import { ServiceCreatedEvent } from "./lifecycle-change";
import { ServiceLifecycleManager } from "./service-lifecycle-manager";

jest.mock("@amazon-connect/core/lib/logging/connect-logger");
jest.mock("@amazon-connect/core/lib/utility/id-generator");
jest.mock("../proxy/app-proxy");

const AppProxyMock = AppProxy as MockedClass<typeof AppProxy>;
const LoggerMock = ConnectLogger as MockedClass<typeof ConnectLogger>;

const instanceId = "abc123";
const appConfig: AppConfig = { _type: "iframe" } as AppConfig;
const contactScope: ContactScope = { type: "contact", contactId: "123" };

const createMsg: LifecycleMessage = {
  type: "appLifecycle",
  stage: "create",
  appInstanceId: instanceId,
  instanceId,
  appConfig,
  config: appConfig,
  contactScope: contactScope,
};

const getLifecycleManagerLogger = () => {
  const idx = LoggerMock.mock.calls.findIndex(
    ([a]) => typeof a === "object" && a.source === "app.lifecycleManager",
  );

  if (idx < 0) throw new Error("LifecycleManager logger not found");

  return LoggerMock.mock.instances[idx];
};

beforeEach(jest.resetAllMocks);

let provider: AmazonConnectService;
let proxy: MockedObject<AppProxy>;
let sut: ServiceLifecycleManager;

describe("constructor", () => {
  test("should configure logger mixin", () => {
    sut = new ServiceLifecycleManager(mock<AmazonConnectService>());

    const loggerConfig = LoggerMock.mock.calls[0][0];
    if (typeof loggerConfig === "string") throw Error("ts needs this");
    const mixin = loggerConfig.mixin!;

    const result = mixin({}, LogLevel.info);

    expect(result.state).toEqual(sut.appState);
    expect(result.isCreated).toEqual(sut["isCreated"]);
    expect(result.isDestroyed).toEqual(sut["isDestroyed"]);
  });
});

describe("when triggering the Create lifecycle event", () => {
  let createHandler: jest.Mock<Promise<void>, [ServiceCreatedEvent]>;

  beforeEach(() => {
    createHandler = jest.fn();
    provider = new AmazonConnectService({
      onCreate: createHandler,
    });
    proxy = provider.getProxy() as MockedObject<AppProxy>;
    sut = AppProxyMock.mock.calls[0][1] as ServiceLifecycleManager;
  });

  describe("when the create handler executes successfully", () => {
    test("should invoke create handler", async () => {
      await sut.handleLifecycleChangeMessage(createMsg);

      expect(createHandler).toHaveBeenCalled();
    });

    test("should send the LifecycleHandlerCompleted after handler is completed", async () => {
      proxy.sendLifecycleHandlerCompleted.mockImplementation(() => {
        expect(createHandler).toHaveBeenCalled();
      });

      await sut.handleLifecycleChangeMessage(createMsg);

      expect(proxy.sendLifecycleHandlerCompleted).toHaveBeenCalledWith(
        instanceId,
        "create",
      );
      expect.assertions(2);
    });

    test("should not call fatal error when task is successful", async () => {
      const fatalErrorSpy = jest.spyOn(provider, "sendFatalError");

      await sut.handleLifecycleChangeMessage(createMsg);

      expect(fatalErrorSpy).not.toHaveBeenCalled();
    });

    test("should not be running state", async () => {
      await sut.handleLifecycleChangeMessage(createMsg);

      const state = sut.appState;
      expect(state.isRunning).toBeFalsy();
      expect(state.appInstanceId).toEqual(instanceId);
      expect(state.appConfig).toEqual(appConfig);
    });
  });

  describe("when the onCreate errors", () => {
    test("should log error", async () => {
      const error = new Error("error in handler");
      createHandler.mockRejectedValue(error);
      const logger = getLifecycleManagerLogger();

      await sut.handleLifecycleChangeMessage(createMsg);

      expect(logger.error).toHaveBeenCalled();
      const data = logger.error.mock.calls[0][1];
      expect(data?.instanceId).toEqual(instanceId);
      expect(data?.error).toEqual(error);
    });

    test("should invoke sendFatalError", async () => {
      const error = new Error("error in handler");
      createHandler.mockRejectedValue(error);
      const fatalErrorSpy = jest.spyOn(provider, "sendFatalError");

      await sut.handleLifecycleChangeMessage(createMsg);

      expect(fatalErrorSpy).toHaveBeenCalledWith(expect.anything(), error);
    });

    test("should send the LifecycleHandlerCompleted", async () => {
      const error = new Error("error in handler");
      createHandler.mockRejectedValue(error);

      await sut.handleLifecycleChangeMessage(createMsg);

      expect(proxy.sendLifecycleHandlerCompleted).not.toHaveBeenCalled();
    });
  });

  describe("when the onCreate handler is omitted by the app", () => {
    beforeEach(() => {
      jest.resetAllMocks();
      provider = new AmazonConnectService({} as AmazonConnectServiceConfig);
      proxy = provider.getProxy() as MockedObject<AppProxy>;
      sut = AppProxyMock.mock.calls[0][1] as ServiceLifecycleManager;
    });

    test("should log error", async () => {
      const logger = getLifecycleManagerLogger();

      await sut.handleLifecycleChangeMessage(createMsg);

      expect(logger.error).toHaveBeenCalled();
      const data = logger.error.mock.calls[0][1];
      expect(data?.instanceId).toEqual(instanceId);
    });

    test("should invoke sendFatalError", async () => {
      const fatalErrorSpy = jest.spyOn(provider, "sendFatalError");

      await sut.handleLifecycleChangeMessage(createMsg);

      expect(fatalErrorSpy).toHaveBeenCalled();
    });

    test("should send the LifecycleHandlerCompleted", async () => {
      await sut.handleLifecycleChangeMessage(createMsg);

      expect(proxy.sendLifecycleHandlerCompleted).not.toHaveBeenCalled();
    });
  });

  describe("when attempting to invoke create a second time", () => {
    beforeEach(async () => {
      await sut.handleLifecycleChangeMessage(createMsg);
      createHandler.mockReset();
    });

    test("should log error", async () => {
      const logger = getLifecycleManagerLogger();

      await sut.handleLifecycleChangeMessage(createMsg);

      expect(logger.error).toHaveBeenCalled();
      const data = logger.error.mock.calls[0][1];
      expect(data?.instanceId).toEqual(instanceId);
    });

    test("not invoke handler a second time", async () => {
      await sut.handleLifecycleChangeMessage(createMsg);

      expect(createHandler).not.toHaveBeenCalled();
    });

    test("should not invoke sendFatalError", async () => {
      const error = new Error("error in handler");
      createHandler.mockRejectedValue(error);
      const fatalErrorSpy = jest.spyOn(provider, "sendFatalError");

      await sut.handleLifecycleChangeMessage(createMsg);

      expect(fatalErrorSpy).not.toHaveBeenCalled();
    });

    test("should not send multiple LifecycleHandlerCompleted", async () => {
      expect(proxy.sendLifecycleHandlerCompleted).toHaveBeenCalledTimes(1);

      await sut.handleLifecycleChangeMessage(createMsg);

      expect(proxy.sendLifecycleHandlerCompleted).toHaveBeenCalledTimes(1);
    });
  });
});

describe("when calling a lifecycle event other than create", () => {
  test("should log an error", async () => {
    const createHandler = jest.fn();
    provider = new AmazonConnectService({
      onCreate: createHandler,
    });
    proxy = provider.getProxy() as MockedObject<AppProxy>;
    sut = AppProxyMock.mock.calls[0][1] as ServiceLifecycleManager;
    const logger = getLifecycleManagerLogger();
    const invalidMessage = mock<LifecycleMessage>({
      stage: "destroy",
    });

    try {
      await sut.handleLifecycleChangeMessage(invalidMessage);
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect(createHandler).not.toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalledWith(expect.any(String), {
        stage: "destroy",
      });
    }

    expect.hasAssertions();
  });
});

test("should have not running state before any lifecycle events occur", () => {
  provider = new AmazonConnectService({
    onCreate: () => Promise.resolve(),
  });
  proxy = provider.getProxy() as MockedObject<AppProxy>;
  sut = AppProxyMock.mock.calls[0][1] as ServiceLifecycleManager;

  const state = sut.appState;

  expect(state.isRunning).toBeFalsy();
  expect(state.instanceId).toBeUndefined();
  expect(state.config).toBeUndefined();
  expect(state.appInstanceId).toBeUndefined();
  expect(state.appConfig).toBeUndefined();
});
