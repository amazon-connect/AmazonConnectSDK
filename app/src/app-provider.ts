import {
  AmazonConnectProvider,
  ConnectLogData,
  ConnectLogger,
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
  private readonly logger: ConnectLogger;

  constructor(config: AmazonConnectAppConfig) {
    super({ config, proxyFactory: (p) => this.createProxy(p) });
    this.lifecycleManager = new LifecycleManager(this);
    this.logger = new ConnectLogger({ provider: this, source: "app.provider" });
  }

  private createProxy(provider: AmazonConnectProvider): AppProxy {
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
}
