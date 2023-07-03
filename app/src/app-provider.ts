import {
  AmazonConnectProvider,
  AppConfig,
} from "@amzn/amazon-connect-sdk-core";
import { AmazonConnectAppConfig } from "./amazon-connect-app-config";
import {
  AppStartHandler,
  AppStopHandler,
  LifecycleManager,
  StartSubscriptionOptions,
} from "./lifecycle";
import { AppProxy } from "./proxy";

export class AmazonConnectAppProvider extends AmazonConnectProvider<AmazonConnectAppConfig> {
  private readonly lifecycleManager: LifecycleManager;

  constructor(config: AmazonConnectAppConfig) {
    super({ config, proxyFactory: (p) => this.createProxy(p) });
    this.lifecycleManager = new LifecycleManager(this);
  }

  private createProxy(provider: AmazonConnectProvider): AppProxy {
    if (this !== provider) {
      throw new Error("AmazonConnectProvider mismatch");
    }

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
}
