import {
  AmazonConnectNamespace,
  ModuleContext,
  ModuleProxy,
} from "@amazon-connect/core";
import { mock } from "jest-mock-extended";

import { ExtensibilityClient } from "./extensibility-client";
import { ExtensibilityRoutes } from "./extensibility-routes";
import { ExtensibilityTopics } from "./extensibility-topics";
import {
  InterceptorInvocationResult,
  RegisterInterceptor,
  RegisterInterceptorOptions,
  RegisterInterceptorResponse,
  UnregisterInterceptor,
} from "./interceptor-types";

const testNamespace = "aws.connect.extensibility" as AmazonConnectNamespace;
const moduleProxyMock = mock<ModuleProxy>();
const moduleContextMock = mock<ModuleContext>({
  proxy: moduleProxyMock,
});

let sut: ExtensibilityClient;
const optionsMock = mock<RegisterInterceptorOptions>();

beforeEach(jest.resetAllMocks);

describe("ExtensibilityClient", () => {
  beforeEach(() => {
    sut = new ExtensibilityClient(testNamespace, {
      context: moduleContextMock,
    });
  });

  describe("registerInterceptor", () => {
    test("calls proxy.request with register route and payload", async () => {
      const data: RegisterInterceptor = {
        interceptorKey: "testKey",
        parameter: "testParam",
        options: optionsMock,
      };
      moduleProxyMock.request.mockResolvedValueOnce({});

      await sut.registerInterceptor(data);

      expect(moduleProxyMock.request).toHaveBeenCalledWith(
        ExtensibilityRoutes.registerInterceptor,
        data,
      );
    });

    test("returns the value resolved by the proxy", async () => {
      const resolved = mock<RegisterInterceptorResponse>();
      moduleProxyMock.request.mockResolvedValueOnce(resolved);

      const actual = await sut.registerInterceptor({
        interceptorKey: "testKey",
        parameter: "testParam",
        options: optionsMock,
      });

      expect(actual).toBe(resolved);
    });
  });

  describe("sendInterceptorResult", () => {
    test("calls proxy.request with result route and payload", async () => {
      const result = {
        continue: true,
        success: true,
        invocationId: "testId",
      } as InterceptorInvocationResult;
      moduleProxyMock.request.mockResolvedValueOnce();

      await sut.sendInterceptorResult(result);

      expect(moduleProxyMock.request).toHaveBeenCalledWith(
        ExtensibilityRoutes.sendInterceptorResult,
        result,
      );
    });
  });

  describe("unregisterInterceptor", () => {
    test("calls proxy.request with unregister route and payload", async () => {
      const data: UnregisterInterceptor = {
        interceptorKey: "testKey",
        interceptorId: "testId",
        parameter: "testParam",
      };
      moduleProxyMock.request.mockResolvedValueOnce();

      await sut.unregisterInterceptor(data);

      expect(moduleProxyMock.request).toHaveBeenCalledWith(
        ExtensibilityRoutes.unregisterInterceptor,
        data,
      );
    });
  });

  describe("onInterceptorInvoked", () => {
    test("calls proxy.subscribe with topic key and interceptor id", () => {
      const interceptorId = "testId";
      const handler = jest.fn();

      sut.onInterceptorInvoked(handler, interceptorId);

      expect(moduleProxyMock.subscribe).toHaveBeenCalledWith(
        {
          key: ExtensibilityTopics.interceptorInvoked,
          parameter: interceptorId,
        },
        handler,
      );
    });
  });

  describe("offInterceptorInvoked", () => {
    test("calls proxy.unsubscribe with topic key and interceptor id", () => {
      const interceptorId = "testId";
      const handler = jest.fn();

      sut.offInterceptorInvoked(handler, interceptorId);

      expect(moduleProxyMock.unsubscribe).toHaveBeenCalledWith(
        {
          key: ExtensibilityTopics.interceptorInvoked,
          parameter: interceptorId,
        },
        handler,
      );
    });
  });
});
