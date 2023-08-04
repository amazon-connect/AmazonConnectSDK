import { AmazonConnectProvider, AmazonConnectProviderParams } from "./provider";
import { AmazonConnectConfig } from "../amazon-connect-config";
import { Proxy } from "../proxy";

jest.mock("../logging/connect-logger");
jest.mock("../proxy/proxy");

class TestProxy extends Proxy {
  constructor() {
    super(new AmazonConnectProvider({ config: {}, proxyFactory: () => this }));
  }

  protected initProxy(): void {
    throw new Error("Method not implemented.");
  }
  protected sendMessageToSubject(message: any): void {
    throw new Error("Method not implemented.");
  }
  protected addContextToLogger(): Record<string, unknown> {
    throw new Error("Method not implemented.");
  }
  public get proxyType(): string {
    throw new Error("Method not implemented.");
  }
}

beforeEach(() => {
  jest.resetAllMocks();
});

describe("AmazonConnectProvider", () => {
  test("should throw error when initialized without proxy factory", () => {
    try {
      const sut = new AmazonConnectProvider(
        {} as unknown as AmazonConnectProviderParams<AmazonConnectConfig>
      );
    } catch (e: any) {
      expect(e.message).toEqual(
        "Attempted to get Proxy before setting up factory"
      );
    }

    expect.hasAssertions();
  });
  test("should throw error when initialized without config", () => {
    try {
      const sut = new AmazonConnectProvider({
        config: undefined as unknown as AmazonConnectConfig,
        proxyFactory: () => new TestProxy(),
      });
    } catch (e: any) {
      expect(e.message).toEqual("Failed to include config");
    }

    expect.hasAssertions();
  });

  test("should create proxy when valid params are passed", () => {
    const config = {} as AmazonConnectConfig;
    const proxyFactory = () => new TestProxy();

    const result = new AmazonConnectProvider({ config, proxyFactory });

    expect(result).toBeDefined();
    expect(result.config).toEqual(config);
  });
});

describe("getProxy", () => {
  test("should call proxy.init() only once on multiple getProxy calls", () => {
    const testProxy = new TestProxy();
    const proxyFactoryMock = jest.fn(() => testProxy);
    jest.spyOn(proxyFactoryMock(), "init").mockImplementation(() => {});
    const sut = new AmazonConnectProvider({
      config: {},
      proxyFactory: proxyFactoryMock,
    });

    sut.getProxy();
    sut.getProxy();

    expect(proxyFactoryMock).toHaveBeenCalled();
    expect(proxyFactoryMock().init).toHaveBeenCalledTimes(1);
  });
});

describe("get config", () => {
  test("should return config", () => {
    const testProxy = new TestProxy();
    const proxyFactoryMock = jest.fn(() => testProxy);
    jest.spyOn(proxyFactoryMock(), "init").mockImplementation(() => {});

    const sut = new AmazonConnectProvider({
      config: { logging: undefined },
      proxyFactory: () => new TestProxy(),
    });

    expect(sut.config).toEqual({ logging: undefined });
  });

  describe("onError", () => {
    test("should add error handler to proxy error handler", () => {
      const testProxy = new TestProxy();
      const sut = new AmazonConnectProvider({
        proxyFactory: () => testProxy,
        config: {} as AmazonConnectConfig,
      });
      const handler = jest.fn();
      const onErrorMock = jest.spyOn(testProxy, "onError");

      sut.onError(handler);

      expect(onErrorMock).toHaveBeenCalledWith(handler);
    });
  });

  describe("offError", () => {
    test("should remove error handler to proxy error handler", () => {
      const testProxy = new TestProxy();
      const sut = new AmazonConnectProvider({
        proxyFactory: () => testProxy,
        config: {} as AmazonConnectConfig,
      });
      const handler = jest.fn();
      const offErrorMock = jest.spyOn(testProxy, "offError");

      sut.offError(handler);

      expect(offErrorMock).toHaveBeenCalledWith(handler);
    });
  });
});
