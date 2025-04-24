/* eslint-disable @typescript-eslint/unbound-method */
import { mocked } from "jest-mock";
import { mock } from "jest-mock-extended";

import { AmazonConnectConfig } from "../amazon-connect-config";
import { ConnectError } from "../error";
import { ConnectLogger, LogLevel } from "../logging";
import { Proxy } from "../proxy";
import { generateUUID } from "../utility";
import { getGlobalProvider, setGlobalProvider } from "./global-provider";
import {
  AmazonConnectProviderBase,
  AmazonConnectProviderParams,
} from "./provider-base";

jest.mock("../utility/id-generator");
jest.mock("../logging/connect-logger");
jest.mock("./global-provider");

class TestProvider extends AmazonConnectProviderBase {
  static init(config?: AmazonConnectConfig): {
    provider: TestProvider;
  } {
    const provider = new TestProvider({
      config: config ?? {},
      proxyFactory: () => mockProxy,
    });

    TestProvider.initializeProvider(provider);

    return { provider };
  }
}

const mockProxy = mock<Proxy>();

beforeEach(() => {
  jest.resetAllMocks();
  TestProvider["isInitialized"] = false;
});

describe("AmazonConnectProvider", () => {
  test("should throw error when initialized without proxy factory", () => {
    try {
      new TestProvider(
        {} as unknown as AmazonConnectProviderParams<AmazonConnectConfig>,
      );
    } catch (e: unknown) {
      expect((e as { message: string }).message).toEqual(
        "Attempted to get Proxy before setting up factory",
      );
    }

    expect.hasAssertions();
  });
  test("should throw error when initialized without config", () => {
    try {
      new TestProvider({
        config: undefined as unknown as AmazonConnectConfig,
        proxyFactory: () => mockProxy,
      });
    } catch (e: unknown) {
      expect((e as { message: string }).message).toEqual(
        "Failed to include config",
      );
    }

    expect.hasAssertions();
  });

  test("should create proxy when valid params are passed", () => {
    const config = {} as AmazonConnectConfig;
    const proxyFactory = () => mockProxy;

    const result = new TestProvider({ config, proxyFactory });

    expect(result).toBeDefined();
    expect(result.config).toEqual(config);
  });
});

describe("init", () => {
  describe("when initializing the first time", () => {
    test("should return a provider with a initialized proxy", () => {
      const { provider: sut } = TestProvider.init();

      expect(mockProxy.init).toHaveBeenCalledTimes(1);
      expect(sut.getProxy()).toEqual(mockProxy);
      expect(mockProxy.init).toHaveBeenCalledTimes(1);
    });

    test("should set as global provider", () => {
      const config: AmazonConnectConfig = {
        logging: { minLogToConsoleLevel: LogLevel.error },
      };

      const { provider: sut } = TestProvider.init(config);

      expect(sut).toBeInstanceOf(TestProvider);
      expect(setGlobalProvider).toHaveBeenCalledWith(sut);
      expect(sut.config).toEqual(config);
    });
  });

  describe("when initializing a second time", () => {
    beforeEach(() => {
      TestProvider.init();
      mocked(setGlobalProvider).mockReset();
      mockProxy.init.mockReset();
    });

    describe("when getting the existing provider succeeds", () => {
      const originalProvider = mock<AmazonConnectProviderBase>();
      beforeEach(() => {
        mocked(getGlobalProvider).mockReturnValue(originalProvider);
      });

      test("should log error", () => {
        try {
          TestProvider.init();
        } catch {
          expect(ConnectLogger).toHaveBeenCalledTimes(1);
          expect(ConnectLogger).toHaveBeenCalledWith({
            source: "core.amazonConnectProvider.init",
            provider: originalProvider,
          });
          const [loggerMock] = mocked(ConnectLogger).mock.instances;
          expect(loggerMock.error).toHaveBeenCalledTimes(1);
        }

        expect.hasAssertions();
      });

      test("should throw attemptInitializeMultipleProvider error", () => {
        try {
          TestProvider.init();
        } catch (error) {
          expect(error).toBeInstanceOf(ConnectError);
          expect((error as ConnectError).errorKey).toEqual(
            "attemptInitializeMultipleProviders",
          );
        }

        expect.hasAssertions();
      });

      test("should not update provider", () => {
        try {
          TestProvider.init();
        } catch {
          expect(mockProxy.init).not.toHaveBeenCalled();
        }

        expect.hasAssertions();
      });

      test("should not call init on proxy", () => {
        try {
          TestProvider.init();
        } catch {
          expect(setGlobalProvider).not.toHaveBeenCalled();
        }

        expect.hasAssertions();
      });
    });

    describe("when getting the existing provider throws", () => {
      test("should throw with additional details", () => {
        const testProviderErrorMessage = "testProviderError";
        const providerError = new Error(testProviderErrorMessage);
        mocked(getGlobalProvider).mockImplementation(() => {
          throw providerError;
        });

        try {
          TestProvider.init();
        } catch (error) {
          expect(error).toBeInstanceOf(ConnectError);
          expect((error as ConnectError).errorKey).toEqual(
            "attemptInitializeMultipleProviders",
          );
          expect((error as ConnectError).details.loggingError).toEqual(
            testProviderErrorMessage,
          );
        }

        expect.hasAssertions();
      });
    });
  });
});

describe("id", () => {
  test("should get a randomly generated id", () => {
    const testId = "testId";
    mocked(generateUUID).mockReturnValueOnce(testId);

    const sut = new TestProvider({
      config: {},
      proxyFactory: jest.fn(),
    });

    expect(sut.id).toEqual(testId);
  });
});

describe("getProxy", () => {
  test("should call proxy.init() only once on multiple getProxy calls", () => {
    const proxyFactoryMock = jest.fn(() => mockProxy);
    const sut = new TestProvider({
      config: {},
      proxyFactory: proxyFactoryMock,
    });

    sut.getProxy();
    sut.getProxy();

    expect(proxyFactoryMock).toHaveBeenCalled();
    expect(mockProxy.init).toHaveBeenCalledTimes(1);
  });
});

describe("get config", () => {
  test("should return config", () => {
    const proxyFactoryMock = jest.fn(() => mockProxy);
    jest.spyOn(proxyFactoryMock(), "init").mockImplementation(() => {});

    const sut = new TestProvider({
      config: { logging: undefined },
      proxyFactory: () => mockProxy,
    });

    expect(sut.config).toEqual({ logging: undefined });
  });

  describe("onError", () => {
    test("should add error handler to proxy error handler", () => {
      const sut = new TestProvider({
        proxyFactory: () => mockProxy,
        config: {} as AmazonConnectConfig,
      });
      const handler = jest.fn();

      sut.onError(handler);

      expect(mockProxy.onError).toHaveBeenCalledWith(handler);
    });
  });

  describe("offError", () => {
    test("should remove error handler to proxy error handler", () => {
      const sut = new TestProvider({
        proxyFactory: () => mockProxy,
        config: {} as AmazonConnectConfig,
      });
      const handler = jest.fn();

      sut.offError(handler);

      expect(mockProxy.offError).toHaveBeenCalledWith(handler);
    });
  });
});
