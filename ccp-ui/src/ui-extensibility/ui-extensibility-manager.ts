import {
  AmazonConnectNamespace,
  AmazonConnectProvider,
  ConnectLogger,
} from "@amazon-connect/core";

import { InterceptorHandlerFactory } from "./interceptor-handler-factory";
import { InterceptorStore } from "./interceptor-store";
import {
  Interceptor,
  InterceptorInvocationContext,
  InterceptorInvokedHandler,
  RegisterInterceptorOptions,
} from "./interceptor-types";
import { UIExtensibilityClient } from "./ui-extensibility-client";

export interface UIExtensibilityManagerParams {
  provider: AmazonConnectProvider;
  namespace: AmazonConnectNamespace;
}

export type AddInterceptorParams<T extends InterceptorInvocationContext> = {
  interceptor: Interceptor<T>;
  interceptorKey: string;
  parameter?: string;
  options: RegisterInterceptorOptions | undefined;
};

export type RemoveInterceptorParams<T extends InterceptorInvocationContext> = {
  interceptor: Interceptor<T>;
  interceptorKey: string;
  parameter?: string;
};

export class UIExtensibilityManager {
  private readonly client: UIExtensibilityClient;
  private readonly store: InterceptorStore;
  private readonly handlerFactory: InterceptorHandlerFactory;
  private readonly logger: ConnectLogger;

  constructor({ provider, namespace }: UIExtensibilityManagerParams) {
    this.client = new UIExtensibilityClient(namespace, { provider });
    this.store = new InterceptorStore();
    this.handlerFactory = new InterceptorHandlerFactory({
      provider,
      client: this.client,
    });
    this.logger = new ConnectLogger({
      source: "ui-extensibility.manager",
      provider,
    });
  }

  async addInterceptor<T extends InterceptorInvocationContext>(
    params: AddInterceptorParams<T>,
  ): Promise<void> {
    const interceptorEntry = {
      interceptor: params.interceptor as unknown as Interceptor,
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

    const result = await this.client.registerInterceptor(
      params.interceptorKey,
      params.parameter,
      params.options,
    );

    const handler = this.handlerFactory.createHandler<T>({
      interceptorKey: params.interceptorKey,
      interceptor: params.interceptor,
      parameter: params.parameter,
      interceptorId: result.interceptorId,
    });

    this.client.onInterceptorInvoked(result.interceptorId, handler);

    this.store.completeAdd(
      interceptorEntry,
      result.interceptorId,
      handler as InterceptorInvokedHandler,
    );

    this.logger.info("Interceptor Added", {
      interceptorKey: params.interceptorKey,
      parameter: params.parameter,
      interceptorId: result.interceptorId,
    });
  }

  async removeInterceptor<T extends InterceptorInvocationContext>(
    params: RemoveInterceptorParams<T>,
  ): Promise<void> {
    const interceptorEntry = {
      interceptor: params.interceptor as unknown as Interceptor,
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

    this.store.removeInterceptor(interceptorEntry);

    await this.client.unregisterInterceptor(
      params.interceptorKey,
      interceptorId,
      params.parameter,
    );

    const interceptorHandler =
      this.store.getInterceptorHandlerById(interceptorId);

    // clean up the handler
    if (interceptorHandler) {
      this.client.offInterceptorInvoked(interceptorId, interceptorHandler);
    }

    this.logger.info("Interceptor Removed", {
      interceptorKey: params.interceptorKey,
      parameter: params.parameter,
      interceptorId: interceptorId,
    });
  }
}
