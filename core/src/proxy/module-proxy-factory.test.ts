import {
  ModuleSubscriptionTopic,
  SubscriptionTopic,
} from "../messaging/subscription";
import { AmazonConnectProvider } from "../provider";
import { createModuleProxy } from "./module-proxy-factory";
import { Proxy } from "./proxy";

jest.mock("../logging/connect-logger");

class TestProxy extends Proxy {
  constructor() {
    super(new AmazonConnectProvider({ config: {}, proxyFactory: () => this }));
  }

  protected initProxy(): void {
    throw new Error("Method not implemented.");
  }
  protected sendMessageToSubject(): void {
    throw new Error("Method not implemented.");
  }
  protected addContextToLogger(): Record<string, unknown> {
    throw new Error("Method not implemented.");
  }
  public get proxyType(): string {
    throw new Error("Method not implemented.");
  }
}

const testNamespace = "test";

describe("createModuleProxy", () => {
  describe("subscribe", () => {
    test("should subscribe with ModuleSubscriptionTopic with parameter", () => {
      const proxy = new TestProxy();
      const subscribeSpy = jest.spyOn(proxy, "subscribe");
      const sut = createModuleProxy(proxy, testNamespace);
      const topic: ModuleSubscriptionTopic = { key: "foo", parameter: "1" };
      const handler = jest.fn();

      sut.subscribe(topic, handler);

      expect(subscribeSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          namespace: testNamespace,
          key: "foo",
          parameter: "1",
        }),
        handler
      );
    });

    test("should subscribe with topic with namespace mismatch", () => {
      const proxy = new TestProxy();
      const subscribeSpy = jest.spyOn(proxy, "subscribe");
      const sut = createModuleProxy(proxy, testNamespace);
      const topic: SubscriptionTopic = {
        namespace: "mismatch",
        key: "foo",
      };
      const handler = jest.fn();

      sut.subscribe(topic, handler);

      expect(subscribeSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          namespace: testNamespace,
          key: "foo",
        }),
        handler
      );
    });
  });

  describe("unsubscribe", () => {
    test("should unsubscribe with ModuleSubscriptionTopic with parameter", () => {
      const proxy = new TestProxy();
      const unsubscribeSpy = jest.spyOn(proxy, "unsubscribe");
      const sut = createModuleProxy(proxy, testNamespace);
      const topic: ModuleSubscriptionTopic = { key: "foo", parameter: "1" };
      const handler = jest.fn();

      sut.unsubscribe(topic, handler);

      expect(unsubscribeSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          namespace: testNamespace,
          key: "foo",
          parameter: "1",
        }),
        handler
      );
    });

    test("should unsubscribe with topic with namespace mismatch", () => {
      const proxy = new TestProxy();
      const unsubscribeSpy = jest.spyOn(proxy, "unsubscribe");
      const sut = createModuleProxy(proxy, testNamespace);
      const topic: SubscriptionTopic = {
        namespace: "mismatch",
        key: "foo",
      };
      const handler = jest.fn();

      sut.unsubscribe(topic, handler);

      expect(unsubscribeSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          namespace: testNamespace,
          key: "foo",
        }),
        handler
      );
    });
  });

  test("should getProxyInfo from proxy", () => {
    const proxy = new TestProxy();
    jest
      .spyOn(TestProxy.prototype, "connectionStatus", "get")
      .mockReturnValue("ready");
    jest.spyOn(TestProxy.prototype, "proxyType", "get").mockReturnValue("test");
    const sut = createModuleProxy(proxy, testNamespace);

    const result = sut.getProxyInfo();

    expect(result.connectionStatus).toEqual("ready");
    expect(result.proxyType).toEqual("test");
  });

  test("should add handler for ConnectionStatusChanged event", () => {
    const proxy = new TestProxy();
    const sut = createModuleProxy(proxy, testNamespace);
    const handler = jest.fn();
    const onConnectionStatusChangeSpy = jest.spyOn(
      proxy,
      "onConnectionStatusChange"
    );

    sut.onConnectionStatusChange(handler);

    expect(onConnectionStatusChangeSpy).toHaveBeenCalledWith(handler);
  });

  test("should remove handler for ConnectionStatusChanged event", () => {
    const proxy = new TestProxy();
    const sut = createModuleProxy(proxy, testNamespace);
    const handler = jest.fn();
    const offConnectionStatusChangeSpy = jest.spyOn(
      proxy,
      "offConnectionStatusChange"
    );

    sut.offConnectionStatusChange(handler);

    expect(offConnectionStatusChangeSpy).toHaveBeenCalledWith(handler);
  });
});
