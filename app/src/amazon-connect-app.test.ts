/* eslint-disable @typescript-eslint/unbound-method */
import {
  ConnectLogger,
  SubscriptionHandler,
  SubscriptionTopic,
} from "@amazon-connect/core";
import { MockedClass } from "jest-mock";

import { AmazonConnectApp } from "./amazon-connect-app";
import { AmazonConnectAppConfig } from "./amazon-connect-app-config";
import { AppStartHandler, AppStopHandler, LifecycleManager } from "./lifecycle";
import { AppProxy } from "./proxy";

jest.mock("@amazon-connect/core/lib/logging/connect-logger");
jest.mock("@amazon-connect/core/lib/utility/id-generator");
jest.mock("./lifecycle/lifecycle-manager");
jest.mock("./proxy/app-proxy");

let sut: AmazonConnectApp;
const LifecycleManagerMock = LifecycleManager as MockedClass<
  typeof LifecycleManager
>;
const ProxyMock = AppProxy as MockedClass<typeof AppProxy>;
const LoggerMock = ConnectLogger as MockedClass<typeof ConnectLogger>;

beforeEach(() => {
  jest.resetAllMocks();
  const config = {} as AmazonConnectAppConfig;
  sut = new AmazonConnectApp(config);
});

describe("onStart", () => {
  test("should call onStart", () => {
    const startHandler = {} as AppStartHandler;

    sut.onStart(startHandler);

    const lifecycleManager = LifecycleManagerMock.mock.instances[0];
    expect(lifecycleManager.onStart).toHaveBeenCalled();
  });
});

describe("onStop", () => {
  test("should call onStop", () => {
    const stopHandler = {} as AppStopHandler;

    sut.onStop(stopHandler);

    const lifecycleManager = LifecycleManagerMock.mock.instances[0];
    expect(lifecycleManager.onStop).toHaveBeenCalled();
  });
});

describe("offStart", () => {
  test("should call offStart", () => {
    const startHandler = {} as AppStartHandler;

    sut.offStart(startHandler);

    const lifecycleManager = LifecycleManagerMock.mock.instances[0];
    expect(lifecycleManager.offStart).toHaveBeenCalled();
  });
});

describe("offStop", () => {
  test("should call offStop", () => {
    const stopHandler = {} as AppStopHandler;

    sut.offStop(stopHandler);

    const lifecycleManager = LifecycleManagerMock.mock.instances[0];
    expect(lifecycleManager.offStop).toHaveBeenCalled();
  });
});

describe("sendCloseAppRequest", () => {
  test("should sendCloseAppRequest", () => {
    const message = "hello";

    sut.sendCloseAppRequest(message);

    const proxy = ProxyMock.mock.instances[0];
    expect(proxy.tryCloseApp).toHaveBeenCalledWith(message, false);
  });
});

describe("sendError", () => {
  test("should sendError", () => {
    const message = "hello";
    const data = { foo: 1 };

    sut.sendError(message, data);

    const logger = LoggerMock.mock.instances[0];
    expect(logger.error).toHaveBeenCalledWith(message, data);
  });
});

describe("sendFatalError", () => {
  test("should sendFatalError with object data", () => {
    const message = "hello";
    const data = { foo: 1 };

    sut.sendFatalError(message, data);

    const proxy = ProxyMock.mock.instances[0];
    expect(proxy.tryCloseApp).toHaveBeenCalledWith(message, true, data);
  });
  test("should sendFatalError with error data", () => {
    const message = "hello";
    const data = new Error("error");

    sut.sendFatalError(message, data);

    const proxy = ProxyMock.mock.instances[0];
    expect(proxy.tryCloseApp).toHaveBeenCalledWith(message, true, data);
  });
});

const topic: SubscriptionTopic = {
  namespace: "test-topic",
  key: "key1",
};

describe("subscribe", () => {
  test("should call subscribe in proxy", () => {
    const handler: SubscriptionHandler = () => Promise.resolve();

    sut.subscribe(topic, handler);

    const proxy = ProxyMock.mock.instances[0];
    expect(proxy.subscribe).toHaveBeenCalledWith(topic, handler);
  });
});

describe("unsubscribe", () => {
  test("should call unsubscribe in proxy", () => {
    const handler: SubscriptionHandler = () => Promise.resolve();

    sut.unsubscribe(topic, handler);

    const proxy = ProxyMock.mock.instances[0];
    expect(proxy.unsubscribe).toHaveBeenCalledWith(topic, handler);
  });
});

describe("publish", () => {
  test("should call publish in proxy", () => {
    const data = { foo: "bar" };

    sut.publish(topic, data);

    const proxy = ProxyMock.mock.instances[0];
    expect(proxy.publish).toHaveBeenCalledWith(topic, data);
  });
});
