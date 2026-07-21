import { SubscriptionHandler } from "@amazon-connect/core";

export interface RegisterInterceptor {
  readonly interceptorKey: string;
  readonly parameter?: string;
  readonly options: RegisterInterceptorOptions;
}

export interface UnregisterInterceptor {
  readonly interceptorKey: string;
  readonly parameter?: string;
  readonly interceptorId: string;
}

export type InterceptorId = string;

export interface RegisterInterceptorOptions {
  timeout?: number;
  maxConsecutiveBlocks?: number;
}

export interface RegisterInterceptorResponse {
  interceptorId: InterceptorId;
}

export type InterceptorInvocationContext = void | Record<string, unknown>;

export interface InterceptorInvoked<T extends InterceptorInvocationContext> {
  interceptorId: InterceptorId;
  invocationId: string;
  context: T;
}
export type InterceptorInvokedHandler<
  T extends InterceptorInvocationContext = void,
> = SubscriptionHandler<InterceptorInvoked<T>>;

export type InterceptorError = string;

export type InterceptorInvocationResult =
  | {
      success: true;
      continue: boolean;
      invocationId: string;
    }
  | {
      success: false;
      error: InterceptorError;
      invocationId: string;
    };

export type InterceptorResult =
  | boolean
  | {
      continue: boolean;
    };

export type Interceptor<T extends InterceptorInvocationContext = void> = (
  context: T,
) => Promise<InterceptorResult>;

export type InterceptorTimeoutHandler = () => void | Promise<void>;
