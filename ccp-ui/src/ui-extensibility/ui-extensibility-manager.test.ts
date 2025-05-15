/* eslint-disable @typescript-eslint/unbound-method */
import { AmazonConnectProvider, ConnectLogger } from "@amazon-connect/core";
import { MockedClass } from "jest-mock";
import { mock } from "jest-mock-extended";

import { InterceptorHandlerFactory } from "./interceptor-handler-factory";
import { InterceptorStore } from "./interceptor-store";
import {
  InterceptorInvocationContext,
  InterceptorInvokedHandler,
  RegisterInterceptorOptions,
  RegisterInterceptorResponse,
} from "./interceptor-types";
import { UIExtensibilityClient } from "./ui-extensibility-client";
import { UIExtensibilityManager } from "./ui-extensibility-manager";

jest.mock("@amazon-connect/core/lib/logging/connect-logger");
jest.mock("./ui-extensibility-client");
jest.mock("./interceptor-store");
jest.mock("./interceptor-handler-factory");
jest.mock("@amazon-connect/core");

describe("UIExtensibilityManager", () => {
  let manager: UIExtensibilityManager;
  const mockProvider = mock<AmazonConnectProvider>();
  let mockNamespace: string;
  let mockClient: jest.Mocked<UIExtensibilityClient>;
  let mockStore: jest.Mocked<InterceptorStore>;
  let mockHandlerFactory: jest.Mocked<InterceptorHandlerFactory>;
  let mockedLogger: jest.Mocked<ConnectLogger>;

  const ConnectLoggerMock = ConnectLogger as MockedClass<typeof ConnectLogger>;
  const MockedStore = InterceptorStore as MockedClass<typeof InterceptorStore>;
  const MockedClient = UIExtensibilityClient as MockedClass<
    typeof UIExtensibilityClient
  >;
  const MockedHandlerFactory = InterceptorHandlerFactory as MockedClass<
    typeof InterceptorHandlerFactory
  >;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    mockNamespace = "test-namespace";

    manager = new UIExtensibilityManager({
      provider: mockProvider,
      namespace: mockNamespace,
    });

    mockStore = MockedStore.mock.instances[0];
    mockedLogger = ConnectLoggerMock.mock.instances[0];
    mockClient = MockedClient.mock.instances[0];
    mockHandlerFactory = MockedHandlerFactory.mock.instances[0];
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
      mockHandlerFactory.createHandler.mockReturnValue(mockHandler);

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

      expect(mockClient.registerInterceptor).toHaveBeenCalledWith(
        mockInterceptorKey,
        mockParameter,
        mockOptions,
      );

      expect(mockHandlerFactory.createHandler).toHaveBeenCalledWith({
        interceptorKey: mockInterceptorKey,
        interceptor: mockInterceptor,
        parameter: mockParameter,
        interceptorId: mockInterceptorId,
      });

      expect(mockClient.onInterceptorInvoked).toHaveBeenCalledWith(
        mockInterceptorId,
        mockHandler,
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

    describe("Execution order", () => {
      beforeEach(() => {
        mockStore.interceptorExists.mockReturnValue(false);
        mockClient.registerInterceptor.mockResolvedValue({
          interceptorId: mockInterceptorId,
        });
        mockHandlerFactory.createHandler.mockReturnValue(mockHandler);
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
        mockHandlerFactory.createHandler.mockImplementation(() => {
          expect(mockClient.registerInterceptor).toHaveBeenCalledWith(
            mockInterceptorKey,
            mockParameter,
            mockOptions,
          );
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
            mockInterceptorId,
            mockHandler,
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

      expect(ConnectLoggerMock.mock.instances[0].debug).toHaveBeenCalledWith(
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
        mockInterceptorId,
        mockHandler,
      );

      expect(mockClient.unregisterInterceptor).toHaveBeenCalledWith(
        mockInterceptorKey,
        mockInterceptorId,
        mockParameter,
      );

      expect(ConnectLoggerMock.mock.instances[0].info).toHaveBeenCalledWith(
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

    describe("Execution order", () => {
      beforeEach(() => {
        mockStore.getInterceptorId.mockReturnValue(mockInterceptorId);
        mockStore.getInterceptorHandlerById.mockReturnValue(mockHandler);
        mockStore.removeInterceptor.mockReturnValue(true);
      });

      test("should invoke unregisterInterceptor before calling offInterceptorInvoked", async () => {
        mockClient.offInterceptorInvoked.mockImplementation(() => {
          expect(mockClient.unregisterInterceptor).toHaveBeenCalledWith(
            mockInterceptorKey,
            mockInterceptorId,
            mockParameter,
          );
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
