/* eslint-disable @typescript-eslint/unbound-method */
import { AmazonConnectProvider } from "@amazon-connect/core";
import { mocked } from "jest-mock";
import { mock } from "jest-mock-extended";

import { CCPUIExtensibilityService } from "./ccp-ui-extensibility-service";
import { CCPUIInterceptorKey } from "./ccp-ui-interceptor-key";
import {
  OutboundDialerOpenInterceptor,
  QuickConnectOpenInterceptor,
} from "./ccp-ui-interceptor-types";
import {
  getUIExtensibilityManager,
  RegisterInterceptorOptions,
  UIExtensibilityManager,
} from "./ui-extensibility";

jest.mock("./ui-extensibility/get-ui-extensibility-manager");

describe("CCPUIExtensibilityService", () => {
  let service: CCPUIExtensibilityService;
  const mockManager = mock<UIExtensibilityManager>();

  beforeEach(() => {
    jest.resetAllMocks();
    mockManager.addInterceptor.mockImplementation(jest.fn());
    mockManager.removeInterceptor.mockImplementation(jest.fn());
    mocked(getUIExtensibilityManager).mockReturnValue(mockManager);
    service = new CCPUIExtensibilityService(mock<AmazonConnectProvider>());
  });

  describe("addQuickConnectOpenInterceptor", () => {
    const mockInterceptor = jest.fn() as QuickConnectOpenInterceptor;

    test("should add interceptor without contactId or options", async () => {
      await service.addQuickConnectOpenInterceptor(mockInterceptor);

      expect(mockManager.addInterceptor).toHaveBeenCalledWith({
        interceptor: mockInterceptor,
        interceptorKey: CCPUIInterceptorKey.quickConnectOpen,
        parameter: undefined,
        options: {},
      });
    });

    test("should add interceptor with contactId", async () => {
      const contactId = "test-contact-id";
      await service.addQuickConnectOpenInterceptor(mockInterceptor, contactId);

      expect(mockManager.addInterceptor).toHaveBeenCalledWith({
        interceptor: mockInterceptor,
        interceptorKey: CCPUIInterceptorKey.quickConnectOpen,
        parameter: contactId,
        options: {},
      });
    });

    test("should add interceptor with options", async () => {
      const options = { timeout: 2000 } as RegisterInterceptorOptions;
      await service.addQuickConnectOpenInterceptor(mockInterceptor, options);

      expect(mockManager.addInterceptor).toHaveBeenCalledWith({
        interceptor: mockInterceptor,
        interceptorKey: CCPUIInterceptorKey.quickConnectOpen,
        parameter: undefined,
        options,
      });
    });

    test("should add interceptor with both contactId and options", async () => {
      const contactId = "test-contact-id";
      const options = { timeout: 2000 } as RegisterInterceptorOptions;
      await service.addQuickConnectOpenInterceptor(
        mockInterceptor,
        contactId,
        options,
      );

      expect(mockManager.addInterceptor).toHaveBeenCalledWith({
        interceptor: mockInterceptor,
        interceptorKey: CCPUIInterceptorKey.quickConnectOpen,
        parameter: contactId,
        options,
      });
    });
  });

  describe("removeQuickConnectOpenInterceptor", () => {
    const mockInterceptor = jest.fn() as QuickConnectOpenInterceptor;

    test("should remove interceptor without contactId", async () => {
      await service.removeQuickConnectOpenInterceptor(mockInterceptor);

      expect(mockManager.removeInterceptor).toHaveBeenCalledWith({
        interceptor: mockInterceptor,
        interceptorKey: CCPUIInterceptorKey.quickConnectOpen,
        parameter: undefined,
      });
    });

    test("should remove interceptor with contactId", async () => {
      const contactId = "test-contact-id";
      await service.removeQuickConnectOpenInterceptor(
        mockInterceptor,
        contactId,
      );

      expect(mockManager.removeInterceptor).toHaveBeenCalledWith({
        interceptor: mockInterceptor,
        interceptorKey: CCPUIInterceptorKey.quickConnectOpen,
        parameter: contactId,
      });
    });
  });

  describe("addOutboundDialerOpenInterceptor", () => {
    const mockInterceptor = jest.fn() as OutboundDialerOpenInterceptor;

    test("should add interceptor with no additional parameters", async () => {
      await service.addOutboundDialerOpenInterceptor(mockInterceptor);

      expect(mockManager.addInterceptor).toHaveBeenCalledWith({
        interceptor: mockInterceptor,
        interceptorKey: CCPUIInterceptorKey.outboundDialerOpen,
        parameter: undefined,
        options: {},
      });
    });

    test("should add interceptor with both contactId and options", async () => {
      const contactId = "test-contact-id";
      const options = { timeout: 25000 } as RegisterInterceptorOptions;
      await service.addOutboundDialerOpenInterceptor(
        mockInterceptor,
        contactId,
        options,
      );

      expect(mockManager.addInterceptor).toHaveBeenCalledWith({
        interceptor: mockInterceptor,
        interceptorKey: CCPUIInterceptorKey.outboundDialerOpen,
        parameter: contactId,
        options,
      });
    });

    test("should add interceptor with options", async () => {
      const options = mock<RegisterInterceptorOptions>({ timeout: 30000 });

      await service.addOutboundDialerOpenInterceptor(mockInterceptor, options);

      expect(mockManager.addInterceptor).toHaveBeenCalledWith({
        interceptor: mockInterceptor,
        interceptorKey: CCPUIInterceptorKey.outboundDialerOpen,
        options,
      });

      await service.addOutboundDialerOpenInterceptor(mockInterceptor, options);
    });

    test("should add interceptor with just contactId", async () => {
      const contactId = "test-contact-id";
      await service.addOutboundDialerOpenInterceptor(
        mockInterceptor,
        contactId,
      );

      expect(mockManager.addInterceptor).toHaveBeenCalledWith({
        interceptor: mockInterceptor,
        interceptorKey: CCPUIInterceptorKey.outboundDialerOpen,
        parameter: contactId,
        options: {},
      });
    });
  });

  describe("removeOutboundDialerOpenInterceptor", () => {
    const mockInterceptor = jest.fn() as OutboundDialerOpenInterceptor;

    test("should remove interceptor without contactId", async () => {
      await service.removeOutboundDialerOpenInterceptor(mockInterceptor);

      expect(mockManager.removeInterceptor).toHaveBeenCalledWith({
        interceptor: mockInterceptor,
        interceptorKey: CCPUIInterceptorKey.outboundDialerOpen,
        parameter: undefined,
      });
    });

    test("should remove interceptor with contactId", async () => {
      const contactId = "test-contact-id";
      await service.removeOutboundDialerOpenInterceptor(
        mockInterceptor,
        contactId,
      );

      expect(mockManager.removeInterceptor).toHaveBeenCalledWith({
        interceptor: mockInterceptor,
        interceptorKey: CCPUIInterceptorKey.outboundDialerOpen,
        parameter: contactId,
      });
    });
  });
});
