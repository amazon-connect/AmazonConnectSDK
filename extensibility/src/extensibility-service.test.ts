import { AmazonConnectProvider } from "@amazon-connect/core";
import { mocked } from "jest-mock";
import { mock } from "jest-mock-extended";

import { ExtensibilityService } from "./extensibility-service";
import {
  ExtensibilityManager,
  getExtensibilityManager,
  Interceptor,
  RegisterInterceptorOptions,
} from "./framework";
import { extensibilityNamespace } from "./namespace";

jest.mock("./framework/get-extensibility-manager");

beforeEach(jest.resetAllMocks);

describe("ExtensibilityService", () => {
  let service: ExtensibilityService;
  let mockProvider: AmazonConnectProvider;
  const mockManager = mock<ExtensibilityManager>();

  const mockInterceptor = jest.fn() as Interceptor<Record<string, unknown>>;
  const mockKey = "openQuickConnect";
  const mockParameter = "contact-1";

  beforeEach(() => {
    mockManager.addInterceptor.mockImplementation(jest.fn());
    mockManager.removeInterceptor.mockImplementation(jest.fn());
    mocked(getExtensibilityManager).mockReturnValue(mockManager);
    mockProvider = mock<AmazonConnectProvider>();
    service = new ExtensibilityService(mockProvider);
  });

  describe("constructor", () => {
    test("should obtain the manager via getExtensibilityManager with extensibilityNamespace", () => {
      expect(getExtensibilityManager).toHaveBeenCalledWith(
        extensibilityNamespace,
        mockProvider,
      );
    });

    test("extensibilityNamespace is aws.connect.extensibility", () => {
      expect(extensibilityNamespace).toBe("aws.connect.extensibility");
    });
  });

  describe("addInterceptor", () => {
    test("should call manager with parameter=undefined and options={} when called with (key, fn)", async () => {
      await service.addInterceptor(mockKey, mockInterceptor);

      expect(mockManager.addInterceptor).toHaveBeenCalledWith({
        interceptor: mockInterceptor,
        interceptorKey: mockKey,
        parameter: undefined,
        options: {},
      });
    });

    test("should parse parameter string and options={} when called with (key, fn, parameter)", async () => {
      await service.addInterceptor(mockKey, mockInterceptor, mockParameter);

      expect(mockManager.addInterceptor).toHaveBeenCalledWith({
        interceptor: mockInterceptor,
        interceptorKey: mockKey,
        parameter: mockParameter,
        options: {},
      });
    });

    test("should parse options object and parameter=undefined when called with (key, fn, options)", async () => {
      const options: RegisterInterceptorOptions = { maxConsecutiveBlocks: 3 };

      await service.addInterceptor(mockKey, mockInterceptor, options);

      expect(mockManager.addInterceptor).toHaveBeenCalledWith({
        interceptor: mockInterceptor,
        interceptorKey: mockKey,
        parameter: undefined,
        options,
      });
    });

    test("should pass both parameter and options when called with (key, fn, parameter, options)", async () => {
      const options: RegisterInterceptorOptions = {
        maxConsecutiveBlocks: 3,
        timeout: 5000,
      };

      await service.addInterceptor(
        mockKey,
        mockInterceptor,
        mockParameter,
        options,
      );

      expect(mockManager.addInterceptor).toHaveBeenCalledWith({
        interceptor: mockInterceptor,
        interceptorKey: mockKey,
        parameter: mockParameter,
        options,
      });
    });
  });

  describe("removeInterceptor", () => {
    test("should call manager with the matching tuple when called with (key, fn, parameter)", async () => {
      await service.removeInterceptor(mockKey, mockInterceptor, mockParameter);

      expect(mockManager.removeInterceptor).toHaveBeenCalledWith({
        interceptor: mockInterceptor,
        interceptorKey: mockKey,
        parameter: mockParameter,
      });
    });

    test("should call manager with parameter=undefined when called with (key, fn)", async () => {
      await service.removeInterceptor(mockKey, mockInterceptor);

      expect(mockManager.removeInterceptor).toHaveBeenCalledWith({
        interceptor: mockInterceptor,
        interceptorKey: mockKey,
        parameter: undefined,
      });
    });
  });
});
