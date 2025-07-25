import { AmazonConnectProvider } from "@amazon-connect/core";

import { CCPUIInterceptorKey } from "./ccp-ui-interceptor-key";
import {
  OutboundDialerOpenInterceptor,
  QuickConnectOpenInterceptor,
} from "./ccp-ui-interceptor-types";
import { ccpUiNamespace } from "./namespace";
import {
  getUIExtensibilityManager,
  UIExtensibilityManager,
} from "./ui-extensibility";
import { RegisterInterceptorOptions } from "./ui-extensibility/interceptor-types";

export class CCPUIExtensibilityService {
  private readonly manager: UIExtensibilityManager;

  constructor(provider: AmazonConnectProvider) {
    this.manager = getUIExtensibilityManager(ccpUiNamespace, provider);
  }

  /**
   * Adds a quick connect open interceptor with optional contact ID and options
   */
  addQuickConnectOpenInterceptor(
    interceptor: QuickConnectOpenInterceptor,
    contactId?: string,
  ): Promise<void>;
  addQuickConnectOpenInterceptor(
    interceptor: QuickConnectOpenInterceptor,
    options: RegisterInterceptorOptions,
  ): Promise<void>;
  addQuickConnectOpenInterceptor(
    interceptor: QuickConnectOpenInterceptor,
    contactId: string,
    options?: RegisterInterceptorOptions,
  ): Promise<void>;
  addQuickConnectOpenInterceptor(
    interceptor: QuickConnectOpenInterceptor,
    contactIdOrOptions?: string | RegisterInterceptorOptions,
    options?: RegisterInterceptorOptions,
  ): Promise<void> {
    const parameter =
      typeof contactIdOrOptions === "string" ? contactIdOrOptions : undefined;

    let interceptorOptions: RegisterInterceptorOptions = {};

    if (options) {
      interceptorOptions = options;
    } else if (typeof contactIdOrOptions === "object") {
      interceptorOptions = contactIdOrOptions;
    }

    return this.manager.addInterceptor({
      interceptor,
      interceptorKey: CCPUIInterceptorKey.quickConnectOpen,
      parameter,
      options: interceptorOptions,
    });
  }

  removeQuickConnectOpenInterceptor(
    interceptor: QuickConnectOpenInterceptor,
    contactId?: string,
  ): Promise<void> {
    return this.manager.removeInterceptor({
      interceptor,
      interceptorKey: CCPUIInterceptorKey.quickConnectOpen,
      parameter: contactId,
    });
  }

  /**
   * Adds an interceptor for opening the outbound dialer with optional contactId and options
   */
  addOutboundDialerOpenInterceptor(
    interceptor: OutboundDialerOpenInterceptor,
    contactId?: string,
  ): Promise<void>;
  addOutboundDialerOpenInterceptor(
    interceptor: OutboundDialerOpenInterceptor,
    options: RegisterInterceptorOptions,
  ): Promise<void>;
  addOutboundDialerOpenInterceptor(
    interceptor: OutboundDialerOpenInterceptor,
    contactId: string,
    options?: RegisterInterceptorOptions,
  ): Promise<void>;
  addOutboundDialerOpenInterceptor(
    interceptor: OutboundDialerOpenInterceptor,
    contactIdOrOptions?: string | RegisterInterceptorOptions,
    options?: RegisterInterceptorOptions,
  ): Promise<void> {
    const parameter =
      typeof contactIdOrOptions === "string" ? contactIdOrOptions : undefined;

    let interceptorOptions: RegisterInterceptorOptions = {};

    if (options) {
      interceptorOptions = options;
    } else if (typeof contactIdOrOptions === "object") {
      interceptorOptions = contactIdOrOptions;
    }

    return this.manager.addInterceptor({
      interceptor,
      interceptorKey: CCPUIInterceptorKey.outboundDialerOpen,
      options: interceptorOptions,
      parameter,
    });
  }

  removeOutboundDialerOpenInterceptor(
    interceptor: OutboundDialerOpenInterceptor,
    contactId?: string,
  ): Promise<void> {
    return this.manager.removeInterceptor({
      interceptor,
      interceptorKey: CCPUIInterceptorKey.outboundDialerOpen,
      parameter: contactId,
    });
  }
}
