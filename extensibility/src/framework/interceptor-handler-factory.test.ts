import { AmazonConnectProvider, ConnectLogger } from "@amazon-connect/core";
import { MockedClass } from "jest-mock";
import { mock } from "jest-mock-extended";

import { ExtensibilityClient } from "./extensibility-client";
import { createInterceptorHandler } from "./interceptor-handler-factory";
import {
  InterceptorInvocationContext,
  InterceptorResult,
} from "./interceptor-types";

jest.mock("@amazon-connect/core/lib/logging/connect-logger");

const ConnectLoggerMock = ConnectLogger as MockedClass<typeof ConnectLogger>;

beforeEach(jest.resetAllMocks);

describe("createInterceptorHandler", () => {
  const mockClient = mock<ExtensibilityClient>();
  let createHandler: ReturnType<typeof createInterceptorHandler>;

  beforeEach(() => {
    mockClient.sendInterceptorResult.mockImplementation(jest.fn());
    createHandler = createInterceptorHandler({
      provider: mock<AmazonConnectProvider>(),
      client: mockClient,
    });
  });

  const mockInterceptorId = "test-interceptor-id";
  const mockInterceptorKey = "test-interceptor-key";
  const mockParameter = "test-parameter";
  const mockInvocationId = "test-invocation-id";
  const mockContext = { someData: "test" } as InterceptorInvocationContext;

  test("handles successful interceptor execution", async () => {
    const interceptorResult = { continue: true };
    const mockInterceptor = jest.fn().mockResolvedValue(interceptorResult);

    const handler = createHandler({
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
    expect(mockClient.sendInterceptorResult).toHaveBeenCalledWith({
      ...interceptorResult,
      invocationId: mockInvocationId,
      success: true,
    });
    expect(ConnectLoggerMock.mock.instances[0].error).not.toHaveBeenCalled();
  });

  test("handles interceptor execution failure", async () => {
    const mockError = new Error("Test error");
    const mockInterceptor = jest.fn().mockRejectedValue(mockError);

    const handler = createHandler({
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
      invocationId: mockInvocationId,
    });
  });

  test("logs but does not throw if the fallback sendInterceptorResult rejects", async () => {
    const interceptorError = new Error("interceptor failed");
    const sendError = new Error("send failed");
    const mockInterceptor = jest.fn().mockRejectedValue(interceptorError);
    mockClient.sendInterceptorResult.mockRejectedValueOnce(sendError);

    const handler = createHandler({
      interceptor: mockInterceptor,
      interceptorId: mockInterceptorId,
      interceptorKey: mockInterceptorKey,
      parameter: mockParameter,
    });

    await expect(
      handler({
        invocationId: mockInvocationId,
        context: mockContext,
        interceptorId: mockInterceptorId,
      }),
    ).resolves.toBeUndefined();

    expect(ConnectLoggerMock.mock.instances[0].error).toHaveBeenCalledWith(
      "Failed to send interceptor error result",
      {
        error: sendError,
        invocationId: mockInvocationId,
        interceptorKey: mockInterceptorKey,
        parameter: mockParameter,
        interceptorId: mockInterceptorId,
      },
    );
  });

  test("handles invalid interceptor results", async () => {
    const invalidResult = {
      someUnknownResponse: true,
    } as never as InterceptorResult;
    const mockInterceptor = jest.fn().mockResolvedValue(invalidResult);

    const handler = createHandler({
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
