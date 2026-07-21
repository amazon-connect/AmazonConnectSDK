import {
  AmazonConnectNamespace,
  AmazonConnectProvider,
  ConnectLogger,
} from "@amazon-connect/core";

import { ExtensibilityClient } from "./extensibility-client";
import { createInterceptorHandler } from "./interceptor-handler-factory";
import { InterceptorStore } from "./interceptor-store";
import {
  Interceptor,
  InterceptorInvocationContext,
  RegisterInterceptorOptions,
} from "./interceptor-types";

export interface ExtensibilityManagerParams {
  provider: AmazonConnectProvider;
  namespace: AmazonConnectNamespace;
}

export interface AddInterceptorParams<T extends InterceptorInvocationContext> {
  interceptor: Interceptor<T>;
  interceptorKey: string;
  parameter?: string;
  options: RegisterInterceptorOptions;
}

export interface RemoveInterceptorParams<
  T extends InterceptorInvocationContext,
> {
  interceptor: Interceptor<T>;
  interceptorKey: string;
  parameter?: string;
}

export class ExtensibilityManager {
  private readonly client: ExtensibilityClient;
  private readonly store: InterceptorStore;
  private readonly createHandler: ReturnType<typeof createInterceptorHandler>;
  private readonly logger: ConnectLogger;

  constructor({ provider, namespace }: ExtensibilityManagerParams) {
    this.client = new ExtensibilityClient(namespace, { provider });
    this.store = new InterceptorStore();
    this.createHandler = createInterceptorHandler({
      provider,
      client: this.client,
    });
    this.logger = new ConnectLogger({
      source: "extensibility.manager",
      provider,
    });
  }

  async addInterceptor<T extends InterceptorInvocationContext>(
    params: AddInterceptorParams<T>,
  ): Promise<void> {
    const interceptorEntry = {
      interceptor: params.interceptor,
      interceptorKey: params.interceptorKey,
      parameter: params.parameter,
    };

    if (this.store.interceptorExists(interceptorEntry)) {
      this.logger.debug("Interceptor already exists", {
        interceptorKey: params.interceptorKey,
        parameter: params.parameter,
      });
      return;
    }

    this.store.startAdd(interceptorEntry);

    try {
      const result = await this.client.registerInterceptor({
        interceptorKey: params.interceptorKey,
        parameter: params.parameter,
        options: params.options,
      });

      const handler = this.createHandler<T>({
        interceptorKey: params.interceptorKey,
        interceptor: params.interceptor,
        parameter: params.parameter,
        interceptorId: result.interceptorId,
      });

      this.client.onInterceptorInvoked(handler, result.interceptorId);

      this.store.completeAdd(interceptorEntry, result.interceptorId, handler);

      this.logger.info("Interceptor Added", {
        interceptorKey: params.interceptorKey,
        parameter: params.parameter,
        interceptorId: result.interceptorId,
      });
    } catch (error) {
      // Roll back the startAdd so a later re-add of the same interceptor
      // is not silently skipped by the interceptorExists check.
      this.store.removeInterceptor(interceptorEntry);
      throw error;
    }
  }

  async removeInterceptor<T extends InterceptorInvocationContext>(
    params: RemoveInterceptorParams<T>,
  ): Promise<void> {
    const interceptorEntry = {
      interceptor: params.interceptor,
      interceptorKey: params.interceptorKey,
      parameter: params.parameter,
    };

    const interceptorId = this.store.getInterceptorId(interceptorEntry);

    if (!interceptorId) {
      this.logger.debug("Interceptor does not exist", {
        interceptorKey: params.interceptorKey,
        parameter: params.parameter,
      });
      return;
    }

    // Retrieve the handler BEFORE removing from the store so we can clean
    // up the subscription after the remote unregister succeeds (or fails).
    const interceptorHandler =
      this.store.getInterceptorHandlerById(interceptorId);

    this.store.removeInterceptor(interceptorEntry);

    // If the remote unregister fails, we still want to clean up the local
    // subscription so the handler doesn't keep firing.
    try {
      await this.client.unregisterInterceptor({
        interceptorKey: params.interceptorKey,
        interceptorId,
        parameter: params.parameter,
      });
    } catch (error) {
      this.logger.error("Failed to unregister interceptor remotely", {
        error,
        interceptorKey: params.interceptorKey,
        parameter: params.parameter,
        interceptorId,
      });
    }

    if (interceptorHandler) {
      this.client.offInterceptorInvoked(interceptorHandler, interceptorId);
    }

    this.logger.info("Interceptor Removed", {
      interceptorKey: params.interceptorKey,
      parameter: params.parameter,
      interceptorId: interceptorId,
    });
  }
}
