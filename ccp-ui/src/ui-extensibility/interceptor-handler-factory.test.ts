/* eslint-disable @typescript-eslint/unbound-method */
import { AmazonConnectProvider, ConnectLogger } from "@amazon-connect/core";
import { MockedClass } from "jest-mock";
import { mock } from "jest-mock-extended";

import { InterceptorHandlerFactory } from "./interceptor-handler-factory";
import {
  InterceptorInvocationContext,
  InterceptorResult,
} from "./interceptor-types";
import { UIExtensibilityClient } from "./ui-extensibility-client";

jest.mock("@amazon-connect/core/lib/logging/connect-logger");

describe("InterceptorHandlerFactory", () => {
  let handlerFactory: InterceptorHandlerFactory;
  const mockClient = mock<UIExtensibilityClient>();
  const ConnectLoggerMock = ConnectLogger as MockedClass<typeof ConnectLogger>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockClient.sendInterceptorResult.mockImplementation(jest.fn());
    handlerFactory = new InterceptorHandlerFactory({
      provider: mock<AmazonConnectProvider>(),
      client: mockClient,
    });
  });

  describe("createHandler", () => {
    const mockInterceptorId = "test-interceptor-id";
    const mockInterceptorKey = "test-interceptor-key";
    const mockParameter = "test-parameter";
    const mockInvocationId = "test-invocation-id";
    const mockContext = { someData: "test" } as InterceptorInvocationContext;

    test("should handle successful interceptor execution", async () => {
      const interceptorResult = {
        continue: true,
      };
      const mockInterceptor = jest.fn().mockResolvedValue(interceptorResult);

      const handler = handlerFactory.createHandler({
        interceptor: mockInterceptor,
        interceptorId: mockInterceptorId,
        interceptorKey: mockInterceptorKey,
        parameter: mockParameter,
      });

      await handler({
        invocationId: mockInvocationId,
        context: mockContext,
        interceptorId: mockInterceptorId,
      });

      expect(mockInterceptor).toHaveBeenCalledWith(mockContext);
      expect(mockClient.sendInterceptorResult).toHaveBeenCalled();
      expect(mockClient.sendInterceptorResult).toHaveBeenCalledWith({
        ...interceptorResult,
        invocationId: mockInvocationId,
        success: true,
      });
      expect(ConnectLoggerMock.mock.instances[0].error).not.toHaveBeenCalled();
    });

    test("should handle interceptor execution failure", async () => {
      // Mock failed interceptor
      const mockError = new Error("Test error");
      const mockInterceptor = jest.fn().mockRejectedValue(mockError);

      const handler = handlerFactory.createHandler({
        interceptor: mockInterceptor,
        interceptorId: mockInterceptorId,
        interceptorKey: mockInterceptorKey,
        parameter: mockParameter,
      });

      await handler({
        invocationId: mockInvocationId,
        context: mockContext,
        interceptorId: mockInterceptorId,
      });

      expect(mockInterceptor).toHaveBeenCalledWith(mockContext);
      expect(ConnectLoggerMock.mock.instances[0].error).toHaveBeenCalledWith(
        "Error in interceptor",
        {
          error: mockError,
          invocationId: mockInvocationId,
          context: mockContext,
          interceptorKey: mockInterceptorKey,
          parameter: mockParameter,
          interceptorId: mockInterceptorId,
        },
      );

      expect(mockClient.sendInterceptorResult).toHaveBeenCalledWith({
        success: false,
        error: "InterceptorError",
        invocationId: "test-invocation-id",
      });
    });

    test("should handle invalid interceptor results", async () => {
      // Mock interceptor with invalid result
      const invalidResult = {
        someUnknownResponse: true,
      } as never as InterceptorResult;

      const mockInterceptor = jest.fn().mockResolvedValue(invalidResult);

      const handler = handlerFactory.createHandler({
        interceptor: mockInterceptor,
        interceptorId: mockInterceptorId,
        interceptorKey: mockInterceptorKey,
        parameter: mockParameter,
      });

      await handler({
        invocationId: mockInvocationId,
        context: mockContext,
        interceptorId: mockInterceptorId,
      });

      expect(mockInterceptor).toHaveBeenCalledWith(mockContext);
      expect(ConnectLoggerMock.mock.instances[0].error).toHaveBeenCalledWith(
        "Invalid interceptor result",
        {
          result: invalidResult,
          interceptorKey: mockInterceptorKey,
          parameter: mockParameter,
          interceptorId: mockInterceptorId,
        },
      );
      expect(mockClient.sendInterceptorResult).toHaveBeenCalled();
    });
  });
});
