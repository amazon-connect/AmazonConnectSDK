import { ConnectClient } from "@amazon-connect/core";

import { ExtensibilityRoutes } from "./extensibility-routes";
import { ExtensibilityTopics } from "./extensibility-topics";
import {
  InterceptorInvocationContext,
  InterceptorInvocationResult,
  InterceptorInvokedHandler,
  RegisterInterceptor,
  RegisterInterceptorResponse,
  UnregisterInterceptor,
} from "./interceptor-types";

export class ExtensibilityClient extends ConnectClient {
  registerInterceptor(
    data: RegisterInterceptor,
  ): Promise<RegisterInterceptorResponse> {
    return this.context.proxy.request(
      ExtensibilityRoutes.registerInterceptor,
      data,
    );
  }

  sendInterceptorResult(result: InterceptorInvocationResult): Promise<void> {
    return this.context.proxy.request(
      ExtensibilityRoutes.sendInterceptorResult,
      result,
    );
  }

  unregisterInterceptor(data: UnregisterInterceptor): Promise<void> {
    return this.context.proxy.request(
      ExtensibilityRoutes.unregisterInterceptor,
      data,
    );
  }

  onInterceptorInvoked<T extends InterceptorInvocationContext = void>(
    handler: InterceptorInvokedHandler<T>,
    interceptorId: string,
  ): void {
    this.context.proxy.subscribe(
      {
        key: ExtensibilityTopics.interceptorInvoked,
        parameter: interceptorId,
      },
      handler,
    );
  }

  offInterceptorInvoked<T extends InterceptorInvocationContext = void>(
    handler: InterceptorInvokedHandler<T>,
    interceptorId: string,
  ): void {
    this.context.proxy.unsubscribe(
      {
        key: ExtensibilityTopics.interceptorInvoked,
        parameter: interceptorId,
      },
      handler,
    );
  }
}
