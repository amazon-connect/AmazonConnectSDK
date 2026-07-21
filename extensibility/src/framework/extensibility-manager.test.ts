import { AmazonConnectProvider, ConnectLogger } from "@amazon-connect/core";
import { MockedClass } from "jest-mock";
import { mock } from "jest-mock-extended";

import { ExtensibilityClient } from "./extensibility-client";
import { ExtensibilityManager } from "./extensibility-manager";
import { createInterceptorHandler } from "./interceptor-handler-factory";
import { InterceptorStore } from "./interceptor-store";
import {
  InterceptorInvocationContext,
  InterceptorInvokedHandler,
  RegisterInterceptorOptions,
  RegisterInterceptorResponse,
} from "./interceptor-types";

jest.mock("@amazon-connect/core/lib/logging/connect-logger");
jest.mock("./extensibility-client");
jest.mock("./interceptor-store");
jest.mock("./interceptor-handler-factory");

const ConnectLoggerMock = ConnectLogger as MockedClass<typeof ConnectLogger>;
const MockedStore = InterceptorStore as MockedClass<typeof InterceptorStore>;
const MockedClient = ExtensibilityClient as MockedClass<
  typeof ExtensibilityClient
>;
const createInterceptorHandlerMock =
  createInterceptorHandler as jest.MockedFunction<
    typeof createInterceptorHandler
  >;

beforeEach(jest.resetAllMocks);

describe("ExtensibilityManager", () => {
  let manager: ExtensibilityManager;
  const mockProvider = mock<AmazonConnectProvider>();
  let mockNamespace: string;
  let mockClient: jest.Mocked<ExtensibilityClient>;
  let mockStore: jest.Mocked<InterceptorStore>;
  let mockedLogger: jest.Mocked<ConnectLogger>;
  const createHandlerMock = jest.fn();

  beforeEach(() => {
    mockNamespace = "test-namespace";
    createInterceptorHandlerMock.mockReturnValue(createHandlerMock);

    manager = new ExtensibilityManager({
      provider: mockProvider,
      namespace: mockNamespace,
    });

    mockStore = MockedStore.mock.instances[0];
    mockedLogger = ConnectLoggerMock.mock.instances[0];
    mockClient = MockedClient.mock.instances[0];
  });

  describe("addInterceptor", () => {
    const mockInterceptor = jest.fn();
    const mockInterceptorKey = "testKey";
    const mockParameter = "testParam";
    const mockOptions = mock<RegisterInterceptorOptions>();
    const mockInterceptorId = "test-id-123";
    const mockHandler = jest.fn();

    test("should not add interceptor if it already exists", async () => {
      mockStore.interceptorExists.mockReturnValue(true);
      await manager.addInterceptor({
        interceptor: mockInterceptor,
        interceptorKey: mockInterceptorKey,
        parameter: mockParameter,
        options: mockOptions,
      });

      expect(mockStore.startAdd).not.toHaveBeenCalled();
      expect(mockClient.registerInterceptor).not.toHaveBeenCalled();

      expect(mockedLogger.debug).toHaveBeenCalledWith(
        "Interceptor already exists",
        {
          interceptorKey: mockInterceptorKey,
          parameter: mockParameter,
        },
      );
    });

    test("should successfully add new interceptor", async () => {
      mockStore.interceptorExists.mockReturnValue(false);
      mockClient.registerInterceptor.mockResolvedValue({
        interceptorId: mockInterceptorId,
      });
      createHandlerMock.mockReturnValue(mockHandler);

      await manager.addInterceptor({
        interceptor: mockInterceptor,
        interceptorKey: mockInterceptorKey,
        parameter: mockParameter,
        options: mockOptions,
      });

      expect(mockStore.startAdd).toHaveBeenCalledWith({
        interceptor: mockInterceptor,
        interceptorKey: mockInterceptorKey,
        parameter: mockParameter,
      });

      expect(mockClient.registerInterceptor).toHaveBeenCalledWith({
        interceptorKey: mockInterceptorKey,
        parameter: mockParameter,
        options: mockOptions,
      });

      expect(createHandlerMock).toHaveBeenCalledWith({
        interceptorKey: mockInterceptorKey,
        interceptor: mockInterceptor,
        parameter: mockParameter,
        interceptorId: mockInterceptorId,
      });

      expect(mockClient.onInterceptorInvoked).toHaveBeenCalledWith(
        mockHandler,
        mockInterceptorId,
      );

      expect(mockStore.completeAdd).toHaveBeenCalledWith(
        {
          interceptor: mockInterceptor,
          interceptorKey: mockInterceptorKey,
          parameter: mockParameter,
        },
        mockInterceptorId,
        mockHandler,
      );

      expect(mockedLogger.info).toHaveBeenCalledWith("Interceptor Added", {
        interceptorKey: mockInterceptorKey,
        parameter: mockParameter,
        interceptorId: mockInterceptorId,
      });
    });

    test("should roll back startAdd if registerInterceptor throws", async () => {
      mockStore.interceptorExists.mockReturnValue(false);
      const err = new Error("register failed");
      mockClient.registerInterceptor.mockRejectedValue(err);

      await expect(
        manager.addInterceptor({
          interceptor: mockInterceptor,
          interceptorKey: mockInterceptorKey,
          parameter: mockParameter,
          options: mockOptions,
        }),
      ).rejects.toThrow("register failed");

      expect(mockStore.startAdd).toHaveBeenCalled();
      expect(mockStore.removeInterceptor).toHaveBeenCalledWith({
        interceptor: mockInterceptor,
        interceptorKey: mockInterceptorKey,
        parameter: mockParameter,
      });
    });

    describe("Execution order", () => {
      beforeEach(() => {
        mockStore.interceptorExists.mockReturnValue(false);
        mockClient.registerInterceptor.mockResolvedValue({
          interceptorId: mockInterceptorId,
        });
        createHandlerMock.mockReturnValue(mockHandler);
      });

      test("should invoke startAdd before calling registerInterceptor", async () => {
        mockClient.registerInterceptor.mockImplementation(() => {
          expect(mockStore.startAdd).toHaveBeenCalledWith({
            interceptor: mockInterceptor,
            interceptorKey: mockInterceptorKey,
            parameter: mockParameter,
          });
          return mock<Promise<RegisterInterceptorResponse>>();
        });

        await manager.addInterceptor({
          interceptor: mockInterceptor,
          interceptorKey: mockInterceptorKey,
          parameter: mockParameter,
          options: mockOptions,
        });
        expect.hasAssertions();
      });

      test("should invoke registerInterceptor before calling createHandler", async () => {
        createHandlerMock.mockImplementation(() => {
          expect(mockClient.registerInterceptor).toHaveBeenCalledWith({
            interceptorKey: mockInterceptorKey,
            parameter: mockParameter,
            options: mockOptions,
          });
          return mock<
            InterceptorInvokedHandler<InterceptorInvocationContext>
          >();
        });

        await manager.addInterceptor({
          interceptor: mockInterceptor,
          interceptorKey: mockInterceptorKey,
          parameter: mockParameter,
          options: mockOptions,
        });
        expect.hasAssertions();
      });

      test("should invoke onInterceptorInvoked before calling completeAdd", async () => {
        mockStore.completeAdd.mockImplementation(() => {
          expect(mockClient.onInterceptorInvoked).toHaveBeenCalledWith(
            mockHandler,
            mockInterceptorId,
          );
        });

        await manager.addInterceptor({
          interceptor: mockInterceptor,
          interceptorKey: mockInterceptorKey,
          parameter: mockParameter,
          options: mockOptions,
        });
        expect.hasAssertions();
      });
    });
  });

  describe("removeInterceptor", () => {
    const mockInterceptor = jest.fn();
    const mockInterceptorKey = "testKey";
    const mockParameter = "testParam";
    const mockInterceptorId = "test-id-123";
    const mockHandler = jest.fn();

    test("should not remove interceptor if it does not exist", async () => {
      mockStore.getInterceptorId.mockReturnValue(undefined);

      await manager.removeInterceptor({
        interceptor: mockInterceptor,
        interceptorKey: mockInterceptorKey,
        parameter: mockParameter,
      });

      expect(mockStore.removeInterceptor).not.toHaveBeenCalled();
      expect(mockClient.unregisterInterceptor).not.toHaveBeenCalled();

      expect(mockedLogger.debug).toHaveBeenCalledWith(
        "Interceptor does not exist",
        {
          interceptorKey: mockInterceptorKey,
          parameter: mockParameter,
        },
      );
    });

    test("should successfully remove existing interceptor", async () => {
      mockStore.getInterceptorId.mockReturnValue(mockInterceptorId);
      mockStore.getInterceptorHandlerById.mockReturnValue(mockHandler);
      mockStore.removeInterceptor.mockReturnValue(true);

      await manager.removeInterceptor({
        interceptor: mockInterceptor,
        interceptorKey: mockInterceptorKey,
        parameter: mockParameter,
      });

      expect(mockStore.removeInterceptor).toHaveBeenCalledWith({
        interceptor: mockInterceptor,
        interceptorKey: mockInterceptorKey,
        parameter: mockParameter,
      });

      expect(mockClient.offInterceptorInvoked).toHaveBeenCalledWith(
        mockHandler,
        mockInterceptorId,
      );

      expect(mockClient.unregisterInterceptor).toHaveBeenCalledWith({
        interceptorKey: mockInterceptorKey,
        interceptorId: mockInterceptorId,
        parameter: mockParameter,
      });

      expect(mockedLogger.info).toHaveBeenCalledWith(
        "Interceptor Removed",
        {
          interceptorKey: mockInterceptorKey,
          parameter: mockParameter,
          interceptorId: mockInterceptorId,
        },
      );
    });

    test("should handle case when interceptor handler is not found", async () => {
      mockStore.getInterceptorId.mockReturnValue(mockInterceptorId);
      mockStore.getInterceptorHandlerById.mockReturnValue(undefined);
      mockStore.removeInterceptor.mockReturnValue(true);

      await manager.removeInterceptor({
        interceptor: mockInterceptor,
        interceptorKey: mockInterceptorKey,
        parameter: mockParameter,
      });

      expect(mockClient.offInterceptorInvoked).not.toHaveBeenCalled();
      expect(mockClient.unregisterInterceptor).toHaveBeenCalled();
    });

    test("still cleans up the subscription when unregisterInterceptor throws", async () => {
      mockStore.getInterceptorId.mockReturnValue(mockInterceptorId);
      mockStore.getInterceptorHandlerById.mockReturnValue(mockHandler);
      mockStore.removeInterceptor.mockReturnValue(true);
      const unregisterError = new Error("network");
      mockClient.unregisterInterceptor.mockRejectedValue(unregisterError);

      await manager.removeInterceptor({
        interceptor: mockInterceptor,
        interceptorKey: mockInterceptorKey,
        parameter: mockParameter,
      });

      // Even though the remote unregister failed, the local subscription
      // cleanup and the "Interceptor Removed" log still fire.
      expect(mockClient.offInterceptorInvoked).toHaveBeenCalledWith(
        mockHandler,
        mockInterceptorId,
      );
      expect(mockedLogger.error).toHaveBeenCalledWith(
        "Failed to unregister interceptor remotely",
        {
          error: unregisterError,
          interceptorKey: mockInterceptorKey,
          parameter: mockParameter,
          interceptorId: mockInterceptorId,
        },
      );
      expect(mockedLogger.info).toHaveBeenCalledWith("Interceptor Removed", {
        interceptorKey: mockInterceptorKey,
        parameter: mockParameter,
        interceptorId: mockInterceptorId,
      });
    });

    describe("Execution order", () => {
      beforeEach(() => {
        mockStore.getInterceptorId.mockReturnValue(mockInterceptorId);
        mockStore.getInterceptorHandlerById.mockReturnValue(mockHandler);
        mockStore.removeInterceptor.mockReturnValue(true);
      });

      test("should retrieve handler BEFORE removing from store", async () => {
        mockStore.removeInterceptor.mockImplementation(() => {
          expect(mockStore.getInterceptorHandlerById).toHaveBeenCalledWith(
            mockInterceptorId,
          );
          return true;
        });

        await manager.removeInterceptor({
          interceptor: mockInterceptor,
          interceptorKey: mockInterceptorKey,
          parameter: mockParameter,
        });
        expect.hasAssertions();
      });

      test("should invoke unregisterInterceptor before calling offInterceptorInvoked", async () => {
        mockClient.offInterceptorInvoked.mockImplementation(() => {
          expect(mockClient.unregisterInterceptor).toHaveBeenCalledWith({
            interceptorKey: mockInterceptorKey,
            interceptorId: mockInterceptorId,
            parameter: mockParameter,
          });
        });

        await manager.removeInterceptor({
          interceptor: mockInterceptor,
          interceptorKey: mockInterceptorKey,
          parameter: mockParameter,
        });

        expect.hasAssertions();
      });
    });
  });
});
