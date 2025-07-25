import { ConnectClient } from "@amazon-connect/core";

import {
  InterceptorInvocationContext,
  InterceptorInvocationResult,
  InterceptorInvokedHandler,
  RegisterInterceptor,
  RegisterInterceptorOptions,
  RegisterInterceptorResponse,
  UnregisterInterceptor,
} from "./interceptor-types";
import { UIExtensibilityRoutes } from "./ui-extensibility-routes";
import { UIExtensibilityTopics } from "./ui-extensibility-topics";

export class UIExtensibilityClient extends ConnectClient {
  registerInterceptor(
    interceptorKey: string,
    parameter: string | undefined,
    options?: RegisterInterceptorOptions,
  ): Promise<RegisterInterceptorResponse> {
    const data: RegisterInterceptor = {
      interceptorKey: interceptorKey,
      options: options ?? {},
      parameter,
    };

    return this.context.proxy.request(
      UIExtensibilityRoutes.registerInterceptor,
      data,
    );
  }

  sendInterceptorResult(result: InterceptorInvocationResult): Promise<void> {
    return this.context.proxy.request(
      UIExtensibilityRoutes.sendInterceptorResult,
      result,
    );
  }

  unregisterInterceptor(
    interceptorKey: string,
    interceptorId: string,
    parameter: string | undefined,
  ): Promise<void> {
    const data: UnregisterInterceptor = {
      interceptorKey,
      parameter,
      interceptorId,
    };

    return this.context.proxy.request(
      UIExtensibilityRoutes.unregisterInterceptor,
      data,
    );
  }

  onInterceptorInvoked<T extends InterceptorInvocationContext = void>(
    interceptorId: string,
    handler: InterceptorInvokedHandler<T>,
  ): void {
    this.context.proxy.subscribe(
      {
        key: UIExtensibilityTopics.interceptorInvoked,
        parameter: interceptorId,
      },
      handler,
    );
  }

  offInterceptorInvoked<T extends InterceptorInvocationContext = void>(
    interceptorId: string,
    handler: InterceptorInvokedHandler<T>,
  ): void {
    this.context.proxy.unsubscribe(
      {
        key: UIExtensibilityTopics.interceptorInvoked,
        parameter: interceptorId,
      },
      handler,
    );
  }
}
