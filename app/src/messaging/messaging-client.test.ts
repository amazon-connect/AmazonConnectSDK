import {
  SubscriptionHandler,
  SubscriptionTopic,
  getGlobalProvider,
} from "@amzn/amazon-connect-sdk-core";
import { AmazonConnectAppConfig } from "../amazon-connect-app-config";
import { AmazonConnectAppProvider } from "../app-provider";
import { AppProxy } from "../proxy";
import { MessagingClient } from "./messaging-client";
import { mocked, MockedClass } from "jest-mock";

jest.mock("@amzn/amazon-connect-sdk-core/lib/provider/global-provider");
jest.mock("../lifecycle/lifecycle-manager");
jest.mock("../proxy/app-proxy");

const topic: SubscriptionTopic = {
  namespace: "test-topic",
  key: "key1",
};

let provider: AmazonConnectAppProvider;
const ProxyMock = AppProxy as MockedClass<typeof AppProxy>;

beforeEach(() => {
  jest.resetAllMocks();
  provider = new AmazonConnectAppProvider({} as AmazonConnectAppConfig);
});

describe("when specifying the provider", () => {
  let sut: MessagingClient;
  beforeEach(() => {
    sut = new MessagingClient({ provider });
  });

  describe("subscribe", () => {
    test("should call subscribe in proxy", () => {
      const handler: SubscriptionHandler<{}> = () => Promise.resolve();

      sut.subscribe(topic, handler);

      const proxy = ProxyMock.mock.instances[0];
      expect(proxy.subscribe).toHaveBeenCalledWith(topic, handler);
    });
  });

  describe("unsubscribe", () => {
    test("should call unsubscribe in proxy", () => {
      const handler: SubscriptionHandler<{}> = () => Promise.resolve();

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
});

describe("when not specifying the provider", () => {
  let sut: MessagingClient;
  beforeEach(() => {
    mocked(getGlobalProvider).mockReturnValue(provider);
    sut = new MessagingClient();
  });

  describe("subscribe", () => {
    test("should call subscribe in proxy", () => {
      const handler: SubscriptionHandler<{}> = () => Promise.resolve();

      sut.subscribe(topic, handler);

      const proxy = ProxyMock.mock.instances[0];
      expect(proxy.subscribe).toHaveBeenCalledWith(topic, handler);
    });
  });

  describe("unsubscribe", () => {
    test("should call unsubscribe in proxy", () => {
      const handler: SubscriptionHandler<{}> = () => Promise.resolve();

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
});
