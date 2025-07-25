/* eslint-disable @typescript-eslint/no-empty-object-type */
/* eslint-disable @typescript-eslint/unbound-method */
import { AmazonConnectProvider, Proxy } from "@amazon-connect/core";
import { mock, MockProxy } from "jest-mock-extended";

import { ccpUiNamespace } from "../namespace";
import {
  InterceptorInvocationResult,
  RegisterInterceptorOptions,
  RegisterInterceptorResponse,
} from "./interceptor-types";
import { UIExtensibilityClient } from "./ui-extensibility-client";
import { UIExtensibilityRoutes } from "./ui-extensibility-routes";
import { UIExtensibilityTopics } from "./ui-extensibility-topics";

describe("UIExtensibilityClient", () => {
  let client: UIExtensibilityClient;
  const mockProxy: MockProxy<Proxy> = mock<Proxy>();
  const options = mock<RegisterInterceptorOptions>();

  beforeEach(() => {
    jest.clearAllMocks();
    const mockProvider = mock<AmazonConnectProvider>();
    mockProvider.getProxy.mockReturnValue(mockProxy);

    client = new UIExtensibilityClient(ccpUiNamespace, {
      provider: mockProvider,
    });
  });

  describe("registerInterceptor", () => {
    test("should call proxy.request with correct parameters", async () => {
      const interceptorKey = "testKey";
      const parameter = "testParam";
      mockProxy.request.mockResolvedValueOnce({});

      await client.registerInterceptor(interceptorKey, parameter, options);

      expect(mockProxy.request).toHaveBeenCalledWith(
        ccpUiNamespace,
        UIExtensibilityRoutes.registerInterceptor,
        {
          interceptorKey,
          parameter,
          options,
        },
      );
    });

    test("should use empty options object when options not provided", async () => {
      const interceptorKey = "testKey";
      const parameter = "testParam";

      mockProxy.request.mockResolvedValueOnce({});

      await client.registerInterceptor(interceptorKey, parameter);

      expect(mockProxy.request).toHaveBeenCalledWith(
        ccpUiNamespace,
        UIExtensibilityRoutes.registerInterceptor,
        {
          interceptorKey,
          parameter,
          options: {},
        },
      );
    });

    test("should return response from the client", async () => {
      const interceptorKey = "testKey";
      const parameter = "testParam";

      const expectedResponse = mock<RegisterInterceptorResponse>();

      mockProxy.request.mockResolvedValueOnce(expectedResponse);

      const response = await client.registerInterceptor(
        interceptorKey,
        parameter,
        options,
      );
      expect(response).toBe(expectedResponse);
    });
  });

  describe("sendInterceptorResult", () => {
    test("should call proxy.request with correct parameters", async () => {
      const result = {
        continue: true,
        success: true,
        invocationId: "testId",
        parameter: "testParam",
      } as InterceptorInvocationResult;

      mockProxy.request.mockResolvedValueOnce();

      await client.sendInterceptorResult(result);

      expect(mockProxy.request).toHaveBeenCalledWith(
        ccpUiNamespace,
        UIExtensibilityRoutes.sendInterceptorResult,
        result,
      );
    });
  });

  describe("unregisterInterceptor", () => {
    test("should call proxy.request with correct parameters", async () => {
      const interceptorKey = "testKey";
      const interceptorId = "testId";
      const parameter = "testParam";

      mockProxy.request.mockResolvedValueOnce();

      await client.unregisterInterceptor(
        interceptorKey,
        interceptorId,
        parameter,
      );

      expect(mockProxy.request).toHaveBeenCalledWith(
        ccpUiNamespace,
        UIExtensibilityRoutes.unregisterInterceptor,
        {
          interceptorKey,
          interceptorId,
          parameter,
        },
      );
    });
  });

  describe("onInterceptorInvoked", () => {
    test("should call proxy.subscribe with correct parameters", () => {
      const interceptorId = "testId";
      const handler = jest.fn();

      client.onInterceptorInvoked(interceptorId, handler);

      expect(mockProxy.subscribe).toHaveBeenCalledWith(
        {
          namespace: ccpUiNamespace,
          key: UIExtensibilityTopics.interceptorInvoked,
          parameter: interceptorId,
        },
        handler,
      );
    });
  });

  describe("offInterceptorInvoked", () => {
    test("should call proxy.unsubscribe with correct parameters", () => {
      const interceptorId = "testId";
      const handler = jest.fn();

      client.offInterceptorInvoked(interceptorId, handler);

      expect(mockProxy.unsubscribe).toHaveBeenCalledWith(
        {
          namespace: ccpUiNamespace,
          key: UIExtensibilityTopics.interceptorInvoked,
          parameter: interceptorId,
        },
        handler,
      );
    });
  });
});
