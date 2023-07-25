import { AmazonConnectConfig } from "../amazon-connect-config";
import { setGlobalProvider } from "./global-provider";
import { AmazonConnectProvider, AmazonConnectProviderParams } from "./provider";

jest.mock("./provider", () => {
  return {
    AmazonConnectProvider: jest.fn().mockImplementation(() => {
      return {};
    }),
  };
});

beforeEach(() => {
  jest.resetAllMocks();
  jest.resetModules();
});

describe("setGlobalProvider", () => {
  test("should throw error with _provider already set", () => {
    const testProvider = new AmazonConnectProvider(
      {} as unknown as AmazonConnectProviderParams<AmazonConnectConfig>
    );

    try {
      setGlobalProvider(testProvider);
      setGlobalProvider(testProvider);
    } catch (e: any) {
      expect(e.message).toEqual("Global Provider is already set");
    }

    expect.hasAssertions();
  });
});
