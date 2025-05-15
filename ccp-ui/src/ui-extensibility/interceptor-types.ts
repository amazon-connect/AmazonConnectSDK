import { SubscriptionHandler } from "@amazon-connect/core";

export type RegisterInterceptor = Readonly<{
  interceptorKey: string;
  parameter?: string;
  options: RegisterInterceptorOptions;
}>;

export type UnregisterInterceptor = Readonly<{
  interceptorKey: string;
  parameter?: string;
  interceptorId: string;
}>;

export type InterceptorId = string;

export type RegisterInterceptorOptions = {
  timeout?: number;
};

export type RegisterInterceptorResponse = {
  interceptorId: InterceptorId;
};

export type InterceptorInvocationContext = void | Record<string, unknown>;

export type InterceptorInvoked<T extends InterceptorInvocationContext> = {
  interceptorId: InterceptorId;
  invocationId: string;
  context: T;
};
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
