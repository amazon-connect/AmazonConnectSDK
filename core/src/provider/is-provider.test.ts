/* eslint-disable @typescript-eslint/unbound-method */
import { mocked } from "jest-mock";
import { mock } from "jest-mock-extended";

import { AmazonConnectConfig } from "../amazon-connect-config";
import { Proxy } from "../proxy";
import { generateUUID } from "../utility";
import { isAmazonConnectProvider } from "./is-provider";
import { AmazonConnectProvider } from "./provider";
import { AmazonConnectProviderBase } from "./provider-base";

jest.mock("../utility/id-generator");

beforeEach(jest.resetAllMocks);

beforeEach(() => {
  const testId = "test-provider-id";
  mocked(generateUUID).mockReturnValueOnce(testId);
});

describe("isAmazonConnectProvider", () => {
  describe("when value is not an object", () => {
    test("should return false for null", () => {
      expect(isAmazonConnectProvider(null)).toBe(false);
    });

    test("should return false for undefined", () => {
      expect(isAmazonConnectProvider(undefined)).toBe(false);
    });

    test("should return false for primitive string", () => {
      expect(isAmazonConnectProvider("test")).toBe(false);
    });

    test("should return false for primitive number", () => {
      expect(isAmazonConnectProvider(123)).toBe(false);
    });

    test("should return false for primitive boolean", () => {
      expect(isAmazonConnectProvider(true)).toBe(false);
    });

    test("should return false for symbol", () => {
      expect(isAmazonConnectProvider(Symbol("test"))).toBe(false);
    });
  });

  describe("when value is an object", () => {
    describe("missing required properties", () => {
      test("should return false for empty object", () => {
        expect(isAmazonConnectProvider({})).toBe(false);
      });

      test("should return false when missing id property", () => {
        const candidate = {
          config: {},
          getProxy: jest.fn(),
        };

        expect(isAmazonConnectProvider(candidate)).toBe(false);
      });

      test("should return false when missing config property", () => {
        const candidate = {
          id: "test-id",
          getProxy: jest.fn(),
        };

        expect(isAmazonConnectProvider(candidate)).toBe(false);
      });

      test("should return false when missing getProxy method", () => {
        const candidate = {
          id: "test-id",
          config: {},
        };

        expect(isAmazonConnectProvider(candidate)).toBe(false);
      });
    });

    describe("incorrect property types", () => {
      test("should return false when id is not a string", () => {
        const candidate = {
          id: 123,
          config: {},
          getProxy: jest.fn(),
        };

        expect(isAmazonConnectProvider(candidate)).toBe(false);
      });

      test("should return false when id is null", () => {
        const candidate = {
          id: null,
          config: {},
          getProxy: jest.fn(),
        };

        expect(isAmazonConnectProvider(candidate)).toBe(false);
      });

      test("should return false when id is undefined", () => {
        const candidate = {
          id: undefined,
          config: {},
          getProxy: jest.fn(),
        };

        expect(isAmazonConnectProvider(candidate)).toBe(false);
      });

      test("should return false when getProxy is not a function", () => {
        const candidate = {
          id: "test-id",
          config: {},
          getProxy: "not-a-function",
        };

        expect(isAmazonConnectProvider(candidate)).toBe(false);
      });

      test("should return false when getProxy is null", () => {
        const candidate = {
          id: "test-id",
          config: {},
          getProxy: null,
        };

        expect(isAmazonConnectProvider(candidate)).toBe(false);
      });
    });

    describe("valid provider-like objects", () => {
      test("should return true when object has all required properties with correct types", () => {
        const candidate = {
          id: "test-id",
          config: { some: "config" },
          getProxy: jest.fn(),
        };

        expect(isAmazonConnectProvider(candidate)).toBe(true);
      });

      test("should return true when config is undefined", () => {
        const candidate = {
          id: "test-id",
          config: undefined,
          getProxy: jest.fn(),
        };

        expect(isAmazonConnectProvider(candidate)).toBe(true);
      });

      test("should return true when config is null", () => {
        const candidate = {
          id: "test-id",
          config: null,
          getProxy: jest.fn(),
        };

        expect(isAmazonConnectProvider(candidate)).toBe(true);
      });

      test("should return true when object has additional properties", () => {
        const candidate = {
          id: "test-id",
          config: {},
          getProxy: jest.fn(),
          additionalProperty: "extra",
          anotherMethod: jest.fn(),
        };

        expect(isAmazonConnectProvider(candidate)).toBe(true);
      });

      test("should return true with empty string id", () => {
        const candidate = {
          id: "",
          config: {},
          getProxy: jest.fn(),
        };

        expect(isAmazonConnectProvider(candidate)).toBe(true);
      });
    });

    describe("real AmazonConnectProvider instances", () => {
      test("should return true for valid provider mock", () => {
        const providerMock = mock<AmazonConnectProvider<AmazonConnectConfig>>({
          id: "provider-id",
          config: { logging: undefined },
        });

        expect(isAmazonConnectProvider(providerMock)).toBe(true);
      });

      test("should return true for provider with complex config", () => {
        const complexConfig: AmazonConnectConfig = {
          logging: {
            minLogToConsoleLevel: 2,
          },
        };

        const providerMock = mock<AmazonConnectProvider<AmazonConnectConfig>>({
          id: "complex-provider-id",
          config: complexConfig,
        });

        expect(isAmazonConnectProvider(providerMock)).toBe(true);
      });
    });

    describe("edge cases", () => {
      test("should return false for array", () => {
        const candidate = ["id", {}, jest.fn()];

        expect(isAmazonConnectProvider(candidate)).toBe(false);
      });

      test("should return false for function", () => {
        const candidateFunction = () => ({
          id: "test-id",
          config: {},
          getProxy: jest.fn(),
        });

        expect(isAmazonConnectProvider(candidateFunction)).toBe(false);
      });

      test("should return false for Date object", () => {
        expect(isAmazonConnectProvider(new Date())).toBe(false);
      });

      test("should return true for object with getter properties", () => {
        const candidate = {
          get id() {
            return "getter-id";
          },
          get config() {
            return { some: "config" };
          },
          getProxy: jest.fn(),
        };

        expect(isAmazonConnectProvider(candidate)).toBe(true);
      });
    });
  });

  describe("type narrowing", () => {
    test("should narrow type correctly when used in conditional", () => {
      const someValue: unknown = {
        id: "test-id",
        config: { test: "config" },
        getProxy: jest.fn(() => mock<Proxy>()),
      };

      if (isAmazonConnectProvider(someValue)) {
        // TypeScript should now know someValue has these properties
        expect(typeof someValue.id).toBe("string");
        expect(someValue.config).toBeDefined();
        expect(typeof someValue.getProxy).toBe("function");

        // Should be able to call methods without type errors
        const proxy = someValue.getProxy();
        expect(proxy).toBeDefined();
      } else {
        fail("Expected someValue to be identified as a provider");
      }
    });
  });

  describe("actual AmazonConnectProviderBase instance", () => {
    test("should return true for real AmazonConnectProviderBase instance", () => {
      const mockConfig = mock<AmazonConnectConfig>();
      const proxyFactory = jest.fn(() => {
        throw new Error("Proxy factory should not be called in this test");
      });

      const testProvider = new AmazonConnectProviderBase({
        config: mockConfig,
        proxyFactory,
      });

      expect(isAmazonConnectProvider(testProvider)).toBe(true);
    });
  });
});
