import {
  AmazonConnectProvider,
  ConnectLogData,
  ConnectLogger,
  getGlobalProvider,
  SubscriptionHandler,
  SubscriptionHandlerData,
  SubscriptionTopic,
} from "@amazon-connect/core";

import { AmazonConnectAppConfig } from "./amazon-connect-app-config";
import {
  AppStartHandler,
  AppStopHandler,
  LifecycleManager,
  StartSubscriptionOptions,
} from "./lifecycle";
import { AppProxy } from "./proxy";

export class AmazonConnectApp extends AmazonConnectProvider<AmazonConnectAppConfig> {
  private readonly lifecycleManager: LifecycleManager;
  private readonly logger: ConnectLogger;

  constructor(config: AmazonConnectAppConfig) {
    super({ config, proxyFactory: () => this.createProxy() });
    this.lifecycleManager = new LifecycleManager(this);
    this.logger = new ConnectLogger({ provider: this, source: "app.provider" });
  }

  static init(config: AmazonConnectAppConfig): {
    provider: AmazonConnectApp;
  } {
    const provider = new AmazonConnectApp(config);

    AmazonConnectApp.initializeProvider(provider);

    return { provider };
  }

  static get default(): AmazonConnectApp {
    return getGlobalProvider<AmazonConnectApp>(
      "AmazonConnectApp has not been initialized"
    );
  }

  private createProxy(): AppProxy {
    return new AppProxy(this, this.lifecycleManager);
  }

  onStart(handler: AppStartHandler, options?: StartSubscriptionOptions): void {
    this.lifecycleManager.onStart(handler, options);
  }

  onStop(handler: AppStopHandler): void {
    this.lifecycleManager.onStop(handler);
  }

  offStart(handler: AppStartHandler): void {
    this.lifecycleManager.offStart(handler);
  }

  offStop(handler: AppStopHandler): void {
    this.lifecycleManager.offStop(handler);
  }

  sendCloseAppRequest(message?: string): void {
    (this.getProxy() as AppProxy).tryCloseApp(message, false);
  }

  sendError(message: string, data?: ConnectLogData): void {
    this.logger.error(message, data);
  }

  sendFatalError(
    message: string,
    data?: Record<string, unknown> | Error
  ): void {
    (this.getProxy() as AppProxy).tryCloseApp(message, true, data);
  }

  subscribe<THandlerData extends SubscriptionHandlerData>(
    topic: SubscriptionTopic,
    handler: SubscriptionHandler<THandlerData>
  ): void {
    this.getProxy().subscribe(topic, handler);
  }

  unsubscribe<THandlerData extends SubscriptionHandlerData>(
    topic: SubscriptionTopic,
    handler: SubscriptionHandler<THandlerData>
  ): void {
    this.getProxy().unsubscribe(topic, handler);
  }

  publish<THandlerData extends SubscriptionHandlerData>(
    topic: SubscriptionTopic,
    data: THandlerData
  ): void {
    (this.getProxy() as AppProxy).publish(topic, data);
  }
}
