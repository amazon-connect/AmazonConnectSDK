import { AmazonConnectProvider } from "@amazon-connect/core";

import {
  ExtensibilityManager,
  getExtensibilityManager,
  Interceptor,
  InterceptorInvocationContext,
  RegisterInterceptorOptions,
} from "./framework";
import { InterceptorKey } from "./interceptor-key";
import { extensibilityNamespace } from "./namespace";

export class ExtensibilityService {
  private readonly manager: ExtensibilityManager;

  constructor(provider: AmazonConnectProvider) {
    this.manager = getExtensibilityManager(extensibilityNamespace, provider);
  }

  /**
   * Registers an interceptor for the supplied interceptor key. Interceptors
   * run before the default behavior fires; returning `{ continue: false }`
   * (or `false`) blocks the default behavior, while `{ continue: true }`
   * (or `true`) allows it to proceed.
   */
  addInterceptor<T extends InterceptorInvocationContext>(
    interceptorKey: InterceptorKey,
    interceptor: Interceptor<T>,
    options?: RegisterInterceptorOptions,
  ): Promise<void>;
  addInterceptor<T extends InterceptorInvocationContext>(
    interceptorKey: InterceptorKey,
    interceptor: Interceptor<T>,
    parameter: string,
    options?: RegisterInterceptorOptions,
  ): Promise<void>;
  addInterceptor<T extends InterceptorInvocationContext>(
    interceptorKey: InterceptorKey,
    interceptor: Interceptor<T>,
    parameterOrOptions?: string | RegisterInterceptorOptions,
    options?: RegisterInterceptorOptions,
  ): Promise<void> {
    const parameter =
      typeof parameterOrOptions === "string" ? parameterOrOptions : undefined;

    let interceptorOptions: RegisterInterceptorOptions = {};
    if (options) {
      interceptorOptions = options;
    } else if (typeof parameterOrOptions === "object") {
      interceptorOptions = parameterOrOptions;
    }

    return this.manager.addInterceptor({
      interceptor,
      interceptorKey,
      parameter,
      options: interceptorOptions,
    });
  }

  /**
   * Unregisters a previously registered interceptor. The `interceptor`
   * function reference and optional `parameter` must match the tuple that
   * was supplied to `addInterceptor`.
   */
  removeInterceptor<T extends InterceptorInvocationContext>(
    interceptorKey: InterceptorKey,
    interceptor: Interceptor<T>,
    parameter?: string,
  ): Promise<void> {
    return this.manager.removeInterceptor({
      interceptor,
      interceptorKey,
      parameter,
    });
  }
}
