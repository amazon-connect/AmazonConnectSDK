/* eslint-disable @typescript-eslint/unbound-method */
import {
  ConnectLogger,
  generateUUID,
  SubscriptionHandler,
  SubscriptionTopic,
} from "@amazon-connect/core";
import {
  getGlobalProvider,
  setGlobalProvider,
} from "@amazon-connect/core/lib/provider";
import { mocked, MockedClass } from "jest-mock";
import { mock } from "jest-mock-extended";

import { AmazonConnectApp } from "./amazon-connect-app";
import { AmazonConnectAppConfig } from "./config";
import {
  AppLifecycleManager,
  AppStartHandler,
  AppStopHandler,
} from "./lifecycle";
import { AppProxy } from "./proxy";

jest.mock("@amazon-connect/core/lib/logging/connect-logger");
jest.mock("@amazon-connect/core/lib/provider/global-provider");
jest.mock("@amazon-connect/core/lib/utility/id-generator");
jest.mock("./lifecycle/app-lifecycle-manager");
jest.mock("./proxy/app-proxy");

const config = mock<AmazonConnectAppConfig>();
const testProviderId = "testProviderId";

let sut: AmazonConnectApp;
const LifecycleManagerMock = AppLifecycleManager as MockedClass<
  typeof AppLifecycleManager
>;
const ProxyMock = AppProxy as MockedClass<typeof AppProxy>;
const LoggerMock = ConnectLogger as MockedClass<typeof ConnectLogger>;

beforeEach(jest.resetAllMocks);

afterEach(() => {
  AmazonConnectApp["isInitialized"] = false;
});

describe("init", () => {
  let result: {
    provider: AmazonConnectApp;
  };

  beforeEach(() => {
    mocked(generateUUID).mockReturnValueOnce(testProviderId);
    mocked(setGlobalProvider).mockImplementation(() => {});
  });

  beforeEach(() => {
    result = AmazonConnectApp.init(config);
  });

  test("should return AmazonConnectApp as provider", () => {
    expect(result.provider).toBeInstanceOf(AmazonConnectApp);
  });

  test("should set the configuration", () => {
    const resultConfig = result.provider.config;

    expect(resultConfig).toEqual({ ...config });
  });

  test("should set random provider id", () => {
    expect(result.provider.id).toEqual(testProviderId);
  });

  test("should set as global provider", () => {
    expect(setGlobalProvider).toHaveBeenCalledWith(result.provider);
  });

  test("should create a AppProxy", () => {
    expect(AppLifecycleManager).toHaveBeenCalledTimes(1);
    expect(AppProxy).toHaveBeenCalledTimes(1);
    const proxyMock = mocked(AppProxy).mock.instances[0];
    const managerMock = mocked(AppLifecycleManager).mock.instances[0];

    expect(AppProxy).toHaveBeenCalledWith(result.provider, managerMock);
    expect(proxyMock.init).toHaveBeenCalled();
    expect(result.provider.getProxy()).toBe(proxyMock);
  });

  test("should be initialized", () => {
    expect(AmazonConnectApp["isInitialized"]).toBeTruthy();
  });
});

describe("default", () => {
  test("should return value from global provider", () => {
    const { provider } = AmazonConnectApp.init(config);
    mocked(getGlobalProvider).mockReturnValue(provider);

    const result = AmazonConnectApp.default;

    expect(result).toEqual(provider);
  });
});

describe("when active", () => {
  beforeEach(() => {
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
    test("should sendFatalError with no details", () => {
      const message = "hello";

      sut.sendFatalError(message);

      const proxy = ProxyMock.mock.instances[0];
      expect(proxy.tryCloseApp).toHaveBeenCalledWith(message, true, undefined);
    });

    test("should sendFatalError with copy of object data", () => {
      const message = "hello";
      const data = { foo: 1 };

      sut.sendFatalError(message, data);

      const proxy = ProxyMock.mock.instances[0];
      expect(proxy.tryCloseApp).toHaveBeenCalledWith(message, true, data);
      const sentData = proxy.tryCloseApp.mock.calls[0][2];
      expect(sentData).toEqual(data);
      expect(sentData).not.toBe(data);
    });

    test("should sendFatalError with copy of error data", () => {
      const message = "hello";
      const data = new Error("error");

      sut.sendFatalError(message, data);

      const proxy = ProxyMock.mock.instances[0];
      expect(proxy.tryCloseApp).toHaveBeenCalledWith(message, true, data);
      const sentData = proxy.tryCloseApp.mock.calls[0][2];
      expect(sentData).toEqual(data);
      expect(sentData).not.toBe(data);
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
    test("should call publish in proxy with copy", () => {
      const data = { foo: "bar" };

      sut.publish(topic, data);

      const proxy = ProxyMock.mock.instances[0];
      expect(proxy.publish).toHaveBeenCalledWith(topic, data);
      const publishedData = proxy.publish.mock.calls[0][1];
      expect(publishedData).toEqual(data);
      expect(publishedData).not.toBe(data);
    });
  });
});
