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

import { AmazonConnectServiceConfig } from "../config";
import { ServiceLifecycleManager } from "../lifecycle";
import { AppProxy } from "../proxy";
import { AmazonConnectService } from "./amazon-connect-service";

jest.mock("@amazon-connect/core/lib/logging/connect-logger");
jest.mock("@amazon-connect/core/lib/provider/global-provider");
jest.mock("@amazon-connect/core/lib/utility/id-generator");
jest.mock("../lifecycle/service-lifecycle-manager");
jest.mock("../proxy/app-proxy");

const config = mock<AmazonConnectServiceConfig>();
const testProviderId = "testProviderId";

let sut: AmazonConnectService;
const LifecycleManagerMock = ServiceLifecycleManager as MockedClass<
  typeof ServiceLifecycleManager
>;
const ProxyMock = AppProxy as MockedClass<typeof AppProxy>;
const LoggerMock = ConnectLogger as MockedClass<typeof ConnectLogger>;

beforeEach(jest.resetAllMocks);

afterEach(() => {
  AmazonConnectService["isInitialized"] = false;
});

describe("init", () => {
  let result: {
    provider: AmazonConnectService;
  };

  beforeEach(() => {
    mocked(generateUUID).mockReturnValueOnce(testProviderId);
    mocked(setGlobalProvider).mockImplementation(() => {});
  });

  beforeEach(() => {
    result = AmazonConnectService.init(config);
  });

  test("should return AmazonConnectService as provider", () => {
    expect(result.provider).toBeInstanceOf(AmazonConnectService);
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
    expect(LifecycleManagerMock).toHaveBeenCalledTimes(1);
    expect(AppProxy).toHaveBeenCalledTimes(1);
    const proxyMock = mocked(AppProxy).mock.instances[0];
    const managerMock = mocked(LifecycleManagerMock).mock.instances[0];

    expect(AppProxy).toHaveBeenCalledWith(result.provider, managerMock);
    expect(proxyMock.init).toHaveBeenCalled();
    expect(result.provider.getProxy()).toBe(proxyMock);
  });

  test("should be initialized", () => {
    expect(AmazonConnectService["isInitialized"]).toBeTruthy();
  });
});

describe("default", () => {
  test("should return value from global provider", () => {
    const { provider } = AmazonConnectService.init(config);
    mocked(getGlobalProvider).mockReturnValue(provider);

    const result = AmazonConnectService.default;

    expect(result).toEqual(provider);
  });
});

describe("when active", () => {
  beforeEach(() => {
    sut = new AmazonConnectService(config);
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
    test("should sendServiceError with no details", () => {
      const message = "hello";

      sut.sendFatalError(message);

      const proxy = ProxyMock.mock.instances[0];
      expect(proxy.sendServiceError).toHaveBeenCalledWith(message, undefined);
    });

    test("should sendServiceError with copy of object data", () => {
      const message = "hello";
      const data = { foo: 1 };

      sut.sendFatalError(message, data);

      const proxy = ProxyMock.mock.instances[0];
      expect(proxy.sendServiceError).toHaveBeenCalledWith(message, data);
      const sentData = proxy.sendServiceError.mock.calls[0][1];
      expect(sentData).toEqual(data);
      expect(sentData).not.toBe(data);
    });

    test("should sendServiceError with copy of error data", () => {
      const message = "hello";
      const data = new Error("error");

      sut.sendFatalError(message, data);

      const proxy = ProxyMock.mock.instances[0];
      expect(proxy.sendServiceError).toHaveBeenCalledWith(message, data);
      const sentData = proxy.sendServiceError.mock.calls[0][1];
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
