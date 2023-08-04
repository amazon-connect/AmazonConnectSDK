import { AmazonConnectConfig } from "../amazon-connect-config";
import { AmazonConnectProvider } from "./provider";

beforeEach(() => {
  jest.resetModules();
});

describe("setGlobalProvider", () => {
  test("should throw error when attempting to set a global provider a second time", () => {
    const { setGlobalProvider } = require("./global-provider");
    const provider = new AmazonConnectProvider({
      proxyFactory: () => ({} as any),
      config: {} as AmazonConnectConfig,
    });
    setGlobalProvider(provider);

    try {
      setGlobalProvider(provider);
    } catch (error: any) {
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toEqual("Global Provider is already set");
    }

    expect.hasAssertions();
  });
});

describe("getGlobalProvider", () => {
  test("should get provider it after it is set", () => {
    const {
      setGlobalProvider,
      getGlobalProvider,
    } = require("./global-provider");
    const provider = new AmazonConnectProvider({
      proxyFactory: () => ({} as any),
      config: {} as AmazonConnectConfig,
    });
    setGlobalProvider(provider);

    const result = getGlobalProvider(provider);

    expect(result).toEqual(provider);
  });

  test("should throw if attempting to get before set", () => {
    const { getGlobalProvider } = require("./global-provider");

    try {
      getGlobalProvider();
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
    }

    expect.hasAssertions();
  });
});
