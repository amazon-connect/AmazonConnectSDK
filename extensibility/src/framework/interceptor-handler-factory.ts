import { AmazonConnectProvider, ConnectLogger } from "@amazon-connect/core";

import { ExtensibilityClient } from "./extensibility-client";
import {
  Interceptor,
  InterceptorInvocationContext,
  InterceptorInvokedHandler,
  InterceptorResult,
} from "./interceptor-types";
import { translateInterceptorResult } from "./translate-interceptor-result";

export interface InterceptorHandlerFactoryParams {
  provider: AmazonConnectProvider;
  client: ExtensibilityClient;
}

export interface CreateHandlerParams<T extends InterceptorInvocationContext> {
  interceptor: Interceptor<T>;
  interceptorId: string;
  interceptorKey: string;
  parameter?: string;
}

/**
 * Returns a `createHandler` function bound to the supplied client and
 * logger. `createHandler` produces the subscription handler that will be
 * called when the module invokes an interceptor; the handler runs the
 * interceptor, translates its result, sends the result back via the
 * client, and logs errors.
 */
export function createInterceptorHandler({
  provider,
  client,
}: InterceptorHandlerFactoryParams): <T extends InterceptorInvocationContext>(
  params: CreateHandlerParams<T>,
) => InterceptorInvokedHandler<T> {
  const logger = new ConnectLogger({
    source: "extensibility.interceptor-handler",
    provider,
  });

  return function createHandler<T extends InterceptorInvocationContext>({
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
          logger.error("Invalid interceptor result", {
            ...interceptorData,
            result,
          });
        }

        await client.sendInterceptorResult(transformedResult);
      } catch (error) {
        logger.error("Error in interceptor", {
          error,
          invocationId,
          context,
          ...interceptorData,
        });

        try {
          await client.sendInterceptorResult({
            success: false,
            error: "InterceptorError",
            invocationId: invocationId,
          });
        } catch (sendError) {
          logger.error("Failed to send interceptor error result", {
            error: sendError,
            invocationId,
            ...interceptorData,
          });
        }
      }
    };
  };
}
