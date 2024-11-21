/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-var-requires */
import { AmazonConnectConfig } from "../amazon-connect-config";
import { AmazonConnectProvider } from "./provider";

jest.mock("../utility/id-generator");

beforeEach(() => {
  jest.resetModules();
});

describe("setGlobalProvider", () => {
  test("should throw error when attempting to set a global provider a second time", () => {
    const { setGlobalProvider } = require("./global-provider");
    const provider = new AmazonConnectProvider({
      proxyFactory: jest.fn(),
      config: {} as AmazonConnectConfig,
    });
    setGlobalProvider(provider);

    try {
      setGlobalProvider(provider);
    } catch (error: unknown) {
      expect(error).toBeInstanceOf(Error);
      expect((error as { message: string }).message).toEqual(
        "Global Provider is already set",
      );
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
      proxyFactory: jest.fn(),
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
