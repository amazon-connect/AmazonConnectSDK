import {
  AmazonConnectProviderBase,
  ConnectLogData,
  ConnectLogger,
  deepClone,
  getGlobalProvider,
  SubscriptionHandler,
  SubscriptionHandlerData,
  SubscriptionTopic,
} from "@amazon-connect/core";

import { AmazonConnectServiceConfig } from "../config";
import { ServiceLifecycleManager } from "../lifecycle/service-lifecycle-manager";
import { AppProxy } from "../proxy";

export class AmazonConnectService extends AmazonConnectProviderBase<AmazonConnectServiceConfig> {
  private readonly lifecycleManager: ServiceLifecycleManager;
  private readonly logger: ConnectLogger;

  constructor(config: AmazonConnectServiceConfig) {
    super({ config, proxyFactory: () => this.createProxy() });
    this.lifecycleManager = new ServiceLifecycleManager(this);
    this.logger = new ConnectLogger({ provider: this, source: "app.provider" });
  }

  static init(config: AmazonConnectServiceConfig): {
    provider: AmazonConnectService;
  } {
    const provider = new AmazonConnectService(config);

    AmazonConnectService.initializeProvider(provider);

    return { provider };
  }

  static get default(): AmazonConnectService {
    return getGlobalProvider<AmazonConnectService>(
      "AmazonConnectService has not been initialized",
    );
  }

  private createProxy(): AppProxy {
    return new AppProxy(this, this.lifecycleManager);
  }

  sendError(message: string, data?: ConnectLogData): void {
    this.logger.error(message, data);
  }

  sendFatalError(
    message: string,
    data?: Record<string, unknown> | Error,
  ): void {
    (this.getProxy() as AppProxy).sendServiceError(
      message,
      data ? deepClone(data) : undefined,
    );
  }

  subscribe<THandlerData extends SubscriptionHandlerData>(
    topic: SubscriptionTopic,
    handler: SubscriptionHandler<THandlerData>,
  ): void {
    this.getProxy().subscribe(topic, handler);
  }

  unsubscribe<THandlerData extends SubscriptionHandlerData>(
    topic: SubscriptionTopic,
    handler: SubscriptionHandler<THandlerData>,
  ): void {
    this.getProxy().unsubscribe(topic, handler);
  }

  publish<THandlerData extends SubscriptionHandlerData>(
    topic: SubscriptionTopic,
    data: THandlerData,
  ): void {
    (this.getProxy() as AppProxy).publish(topic, deepClone(data));
  }
}
