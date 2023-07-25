import { ConnectLogger } from "@amzn/amazon-connect-sdk-core";
import { AmazonConnectAppConfig } from "./amazon-connect-app-config";

import { MockedClass } from "jest-mock";
import { AmazonConnectAppProvider } from "./app-provider";
import { AppProxy } from "./proxy";
import { AppStartHandler, AppStopHandler, LifecycleManager } from "./lifecycle";

jest.mock("./lifecycle/lifecycle-manager");
jest.mock("@amzn/amazon-connect-sdk-core/lib/logging/connect-logger");
jest.mock("./proxy/app-proxy");

let sut: AmazonConnectAppProvider;
const LifecycleManagerMock = LifecycleManager as MockedClass<
  typeof LifecycleManager
>;
const ProxyMock = AppProxy as MockedClass<typeof AppProxy>;
const LoggerMock = ConnectLogger as MockedClass<typeof ConnectLogger>;

beforeEach(() => {
  jest.resetAllMocks();
  const config = {} as AmazonConnectAppConfig;
  sut = new AmazonConnectAppProvider(config);
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
