import { ConnectLogger } from "../logging";
import {
  SubscriptionHandler,
  SubscriptionHandlerData,
} from "../messaging/subscription";
import { AmazonConnectProvider } from "../provider";
import { createModuleProxy, ModuleProxy } from "../proxy";

export abstract class SubscriptionHandlerRelay<
  TInternalHandler extends SubscriptionHandler<TInternalEvent>,
  TExternalHandler extends SubscriptionHandler<TExternalEvent>,
  TInternalEvent extends
    SubscriptionHandlerData = TInternalHandler extends SubscriptionHandler<
    infer U
  >
    ? U
    : never,
  TExternalEvent extends
    SubscriptionHandlerData = TExternalHandler extends SubscriptionHandler<
    infer U
  >
    ? U
    : never,
> {
  private handlersMap: Map<
    TExternalHandler,
    Map<string | undefined, TInternalHandler>
  >;
  protected readonly logger: ConnectLogger;
  protected readonly provider: AmazonConnectProvider;
  private proxy: ModuleProxy | undefined;

  protected abstract readonly namespace: string;
  protected abstract readonly topicKey: string;

  constructor(provider: AmazonConnectProvider) {
    this.handlersMap = new Map();

    this.provider = provider;
    this.logger = new ConnectLogger({
      source: "subscription-handler-relay",
      provider,
      mixin: () => ({
        namespace: this.namespace,
        topicKey: this.topicKey,
      }),
    });
  }

  protected get supportsParameter(): boolean {
    return true;
  }

  protected abstract translate(
    internalEvent: TInternalEvent,
  ): Promise<TExternalEvent>;

  on(handler: TExternalHandler, parameter?: string): void {
    if (parameter && !this.supportsParameter) {
      throw new Error("on provided unsupported parameter");
    }

    const parameterHandlerMap = this.getParameterInternalHandlerMap(handler);

    // Do not add when handler / parameter pair already exists
    if (parameterHandlerMap.has(parameter)) return;

    const internalHandler = (async (evt: TInternalEvent) => {
      if (this.skipRelay(evt)) return;

      let externalEvent: TExternalEvent;
      try {
        externalEvent = await this.translate(evt);
      } catch (error) {
        this.logger.error("An error occurred when translating event", {
          error,
          parameter,
        });
        // Stop execution. Rethrowing would produce a duplicate error message.
        return;
      }

      try {
        await handler(externalEvent);
      } catch (error: unknown) {
        this.logger.error("Error in event handler", {
          error,
          parameter,
        });
      }
    }) as TInternalHandler;

    parameterHandlerMap.set(parameter, internalHandler);

    this.getProxy().subscribe(
      { key: this.topicKey, parameter },
      internalHandler,
    );
  }

  off(handler: TExternalHandler, parameter?: string): void {
    if (parameter && !this.supportsParameter) {
      throw new Error("off provided unsupported parameter");
    }

    const internalHandler = this.handlersMap.get(handler)?.get(parameter);

    if (!internalHandler) return;

    const parameterMap = this.handlersMap.get(handler);

    if (parameterMap?.delete(parameter) && parameterMap.size < 1)
      this.handlersMap.delete(handler);

    this.getProxy().unsubscribe(
      { key: this.topicKey, parameter },
      internalHandler,
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected skipRelay(event: TInternalEvent): boolean {
    return false;
  }

  destroy(): void {
    const proxy = this.getProxy();
    for (const [externalHandler, parameterMapping] of this.handlersMap) {
      for (const [parameter, internalHandler] of parameterMapping) {
        proxy.unsubscribe({ key: this.topicKey, parameter }, internalHandler);

        parameterMapping.delete(parameter);
      }

      this.handlersMap.delete(externalHandler);
    }
  }

  private getParameterInternalHandlerMap(
    externalHandler: TExternalHandler,
  ): Map<string | undefined, TInternalHandler> {
    if (!this.handlersMap.has(externalHandler)) {
      this.handlersMap.set(externalHandler, new Map());
    }

    return this.handlersMap.get(externalHandler)!;
  }

  private getProxy(): ModuleProxy {
    if (!this.proxy) {
      const proxy = this.provider.getProxy();
      this.proxy = createModuleProxy(proxy, this.namespace);
    }
    return this.proxy;
  }
}
