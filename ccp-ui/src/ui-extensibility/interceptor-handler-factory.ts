import { AmazonConnectProvider, ConnectLogger } from "@amazon-connect/core";

import {
  Interceptor,
  InterceptorInvocationContext,
  InterceptorInvokedHandler,
  InterceptorResult,
} from "./interceptor-types";
import { translateInterceptorResult } from "./translate-interceptor-result";
import { UIExtensibilityClient } from "./ui-extensibility-client";

export interface InterceptorHandlerFactoryParams {
  provider: AmazonConnectProvider;
  client: UIExtensibilityClient;
}

export interface CreateHandlerParams<T extends InterceptorInvocationContext> {
  interceptor: Interceptor<T>;
  interceptorId: string;
  interceptorKey: string;
  parameter?: string;
}

export class InterceptorHandlerFactory {
  private readonly client: UIExtensibilityClient;
  private readonly logger: ConnectLogger;

  constructor({ provider, client }: InterceptorHandlerFactoryParams) {
    this.client = client;

    this.logger = new ConnectLogger({
      source: "ui-extensibility.interceptor-handler",
      provider,
    });
  }

  createHandler<T extends InterceptorInvocationContext>({
    interceptor,
    interceptorId,
    interceptorKey,
    parameter,
  }: CreateHandlerParams<T>): InterceptorInvokedHandler<T> {
    const interceptorData = {
      interceptorId,
      interceptorKey,
      parameter,
    };

    return async ({ invocationId, context }) => {
      let result: InterceptorResult;

      try {
        result = await interceptor(context);

        const transformedResult = translateInterceptorResult(
          result,
          invocationId,
        );

        if (!transformedResult.success) {
          this.logger.error("Invalid interceptor result", {
            ...interceptorData,
            result,
          });
        }

        await this.client.sendInterceptorResult(transformedResult);
      } catch (error) {
        this.logger.error("Error in interceptor", {
          error,
          invocationId,
          context,
          ...interceptorData,
        });

        await this.client.sendInterceptorResult({
          success: false,
          error: "InterceptorError",
          invocationId: invocationId,
        });
      }
    };
  }
}
