/* eslint-disable @typescript-eslint/unbound-method */
import { mocked, MockedClass } from "jest-mock";
import { mock } from "jest-mock-extended";

import { AmazonConnectNamespace } from "../amazon-connect-namespace";
import { Context, ModuleContext } from "../context";
import { AmazonConnectProvider, isAmazonConnectProvider } from "../provider";
import { ConnectClientConfigOptional } from "./connect-client-config";
import { getModuleContext } from "./get-module-context";

jest.mock("../context/context");
jest.mock("../provider/is-provider");

const ContextMock = Context as MockedClass<typeof Context>;
const isAmazonConnectProviderMock = mocked(isAmazonConnectProvider);

const testNamespace: AmazonConnectNamespace = "test-namespace";

beforeEach(jest.resetAllMocks);

describe("getModuleContext", () => {
  describe("when config has context property", () => {
    test("should return the provided context directly", () => {
      const mockModuleContext = mock<ModuleContext>();
      const config: ConnectClientConfigOptional = {
        context: mockModuleContext,
      };

      const result = getModuleContext({ namespace: testNamespace, config });

      expect(result).toBe(mockModuleContext);
      expect(ContextMock).not.toHaveBeenCalled();
      expect(isAmazonConnectProviderMock).not.toHaveBeenCalled();
    });

    test("should return the provided context when config also has provider", () => {
      const mockModuleContext = mock<ModuleContext>();
      const mockProvider = mock<AmazonConnectProvider>();
      const config: ConnectClientConfigOptional = {
        context: mockModuleContext,
        provider: mockProvider,
      };

      const result = getModuleContext({ namespace: testNamespace, config });

      expect(result).toBe(mockModuleContext);
      expect(ContextMock).not.toHaveBeenCalled();
      expect(isAmazonConnectProviderMock).not.toHaveBeenCalled();
    });

    test("should not return context when context property is falsy", () => {
      const mockModuleContext = mock<ModuleContext>();
      const config = {
        context: undefined,
      };
      isAmazonConnectProviderMock.mockReturnValue(false);
      ContextMock.prototype.getModuleContext.mockReturnValue(mockModuleContext);

      const result = getModuleContext({ namespace: testNamespace, config });

      expect(result).toBe(mockModuleContext);
      expect(ContextMock).toHaveBeenCalledWith(undefined);
      expect(isAmazonConnectProviderMock).toHaveBeenCalledWith(config);
    });
  });

  describe("when config is an AmazonConnectProvider", () => {
    test("should create Context with provider and return module context", () => {
      const mockProvider = mock<AmazonConnectProvider>();
      const mockModuleContext = mock<ModuleContext>();
      isAmazonConnectProviderMock.mockReturnValue(true);
      ContextMock.prototype.getModuleContext.mockReturnValue(mockModuleContext);

      const result = getModuleContext({
        namespace: testNamespace,
        config: mockProvider,
      });

      expect(result).toBe(mockModuleContext);
      expect(isAmazonConnectProviderMock).toHaveBeenCalledWith(mockProvider);
      expect(ContextMock).toHaveBeenCalledWith(mockProvider);
      expect(
        ContextMock.mock.instances[0].getModuleContext,
      ).toHaveBeenCalledWith(testNamespace);
    });
  });

  describe("when config is not a provider", () => {
    test("should create Context with config.provider and return module context", () => {
      const mockProvider = mock<AmazonConnectProvider>();
      const mockModuleContext = mock<ModuleContext>();
      const config: ConnectClientConfigOptional = {
        provider: mockProvider,
      };
      isAmazonConnectProviderMock.mockReturnValue(false);
      ContextMock.prototype.getModuleContext.mockReturnValue(mockModuleContext);

      const result = getModuleContext({ namespace: testNamespace, config });

      expect(result).toBe(mockModuleContext);
      expect(isAmazonConnectProviderMock).toHaveBeenCalledWith(config);
      expect(ContextMock).toHaveBeenCalledWith(mockProvider);
      expect(
        ContextMock.mock.instances[0].getModuleContext,
      ).toHaveBeenCalledWith(testNamespace);
    });

    test("should create Context with undefined when config has no provider", () => {
      const mockModuleContext = mock<ModuleContext>();
      const config: ConnectClientConfigOptional = {};
      isAmazonConnectProviderMock.mockReturnValue(false);
      ContextMock.prototype.getModuleContext.mockReturnValue(mockModuleContext);

      const result = getModuleContext({ namespace: testNamespace, config });

      expect(result).toBe(mockModuleContext);
      expect(isAmazonConnectProviderMock).toHaveBeenCalledWith(config);
      expect(ContextMock).toHaveBeenCalledWith(undefined);
      expect(
        ContextMock.mock.instances[0].getModuleContext,
      ).toHaveBeenCalledWith(testNamespace);
    });

    test("should create Context with undefined when config is undefined", () => {
      const mockModuleContext = mock<ModuleContext>();
      const config: ConnectClientConfigOptional = undefined;
      isAmazonConnectProviderMock.mockReturnValue(false);
      ContextMock.prototype.getModuleContext.mockReturnValue(mockModuleContext);

      const result = getModuleContext({ namespace: testNamespace, config });

      expect(result).toBe(mockModuleContext);
      expect(isAmazonConnectProviderMock).toHaveBeenCalledWith(config);
      expect(ContextMock).toHaveBeenCalledWith(undefined);
      expect(
        ContextMock.mock.instances[0].getModuleContext,
      ).toHaveBeenCalledWith(testNamespace);
    });

    test("should create Context with undefined when config.provider is undefined", () => {
      const mockModuleContext = mock<ModuleContext>();
      const config: ConnectClientConfigOptional = {
        provider: undefined,
      };
      isAmazonConnectProviderMock.mockReturnValue(false);
      ContextMock.prototype.getModuleContext.mockReturnValue(mockModuleContext);

      const result = getModuleContext({ namespace: testNamespace, config });

      expect(result).toBe(mockModuleContext);
      expect(isAmazonConnectProviderMock).toHaveBeenCalledWith(config);
      expect(ContextMock).toHaveBeenCalledWith(undefined);
      expect(
        ContextMock.mock.instances[0].getModuleContext,
      ).toHaveBeenCalledWith(testNamespace);
    });
  });

  describe("edge cases", () => {
    test("should handle config with context set to empty object", () => {
      const config = {
        context: {} as ModuleContext,
      };

      const result = getModuleContext({ namespace: testNamespace, config });

      expect(result).toBe(config.context);
      expect(ContextMock).not.toHaveBeenCalled();
      expect(isAmazonConnectProviderMock).not.toHaveBeenCalled();
    });

    test("should handle different namespace values", () => {
      const mockModuleContext = mock<ModuleContext>();
      const differentNamespace: AmazonConnectNamespace = "different-namespace";
      const config: ConnectClientConfigOptional = undefined;
      isAmazonConnectProviderMock.mockReturnValue(false);
      ContextMock.prototype.getModuleContext.mockReturnValue(mockModuleContext);

      const result = getModuleContext({
        namespace: differentNamespace,
        config,
      });

      expect(result).toBe(mockModuleContext);
      expect(
        ContextMock.mock.instances[0].getModuleContext,
      ).toHaveBeenCalledWith(differentNamespace);
    });
  });

  describe("function call order verification", () => {
    test("should not call isAmazonConnectProvider when context is provided", () => {
      const mockModuleContext = mock<ModuleContext>();
      const config: ConnectClientConfigOptional = {
        context: mockModuleContext,
      };

      getModuleContext({ namespace: testNamespace, config });

      expect(isAmazonConnectProviderMock).not.toHaveBeenCalled();
    });

    test("should call isAmazonConnectProvider exactly once when no context provided", () => {
      const mockModuleContext = mock<ModuleContext>();
      const config: ConnectClientConfigOptional = {};
      isAmazonConnectProviderMock.mockReturnValue(false);
      ContextMock.prototype.getModuleContext.mockReturnValue(mockModuleContext);

      getModuleContext({ namespace: testNamespace, config });

      expect(isAmazonConnectProviderMock).toHaveBeenCalledTimes(1);
      expect(isAmazonConnectProviderMock).toHaveBeenCalledWith(config);
    });

    test("should create Context exactly once per call", () => {
      const mockModuleContext = mock<ModuleContext>();
      const config: ConnectClientConfigOptional = {};
      isAmazonConnectProviderMock.mockReturnValue(false);
      ContextMock.prototype.getModuleContext.mockReturnValue(mockModuleContext);

      getModuleContext({ namespace: testNamespace, config });

      expect(ContextMock).toHaveBeenCalledTimes(1);
      expect(ContextMock.prototype.getModuleContext).toHaveBeenCalledTimes(1);
    });
  });
});
