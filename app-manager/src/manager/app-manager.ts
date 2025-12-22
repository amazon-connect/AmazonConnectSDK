import {
  AmazonConnectProvider,
  AsyncEventEmitter,
  ConnectLogger,
} from "@amazon-connect/core";
import { AppConfig } from "@amazon-connect/workspace-types";

import {
  AppFocusedHandler,
  AppHost,
  AppHostAdded,
  AppHostAddedHandler,
  AppHostRemoved,
  AppHostRemovedHandler,
  AppInstanceData,
  AppInstanceStateChanged,
  AppInstanceStateChangedHandler,
  createAppHost,
} from "../app";
import { AppFocusRelay } from "../app/host";
import { AppManagerClient } from "../app-manager-client";
import { ClearAppManagerResult } from "../types";
import { AppHostStore } from "./app-host-store";
import { AppLaunchOptions } from "./app-launch-options";

export type AppManagerParams = {
  provider: AmazonConnectProvider;
};

export class AppManager {
  protected readonly provider: AmazonConnectProvider;
  protected readonly appHosts: AppHostStore;
  private readonly appManagerClient: AppManagerClient;
  private readonly logger: ConnectLogger;
  private readonly addedEmitter: AsyncEventEmitter<AppHostAdded>;
  private readonly removedEmitter: AsyncEventEmitter<AppHostRemoved>;
  private readonly appFocusRelay: AppFocusRelay;

  private readonly appAddedHandler: AppInstanceStateChangedHandler;
  private readonly appRemovedHandler: AppInstanceStateChangedHandler;
  private static readonly ALL_APP_INSTANCES = "%__all_app_instance_ids__%";

  constructor({ provider }: AppManagerParams) {
    this.provider = provider;
    this.appHosts = new AppHostStore();
    this.appManagerClient = new AppManagerClient({ provider });

    this.addedEmitter = new AsyncEventEmitter({
      provider,
      loggerKey: "appHostAdded",
    });
    this.removedEmitter = new AsyncEventEmitter({
      provider,
      loggerKey: "appHostRemoved",
    });
    this.appFocusRelay = new AppFocusRelay({
      provider,
      getHost: this.getAppHost.bind(this),
    });

    this.logger = new ConnectLogger({
      provider,
      source: "workspace.appManager",
    });
    this.appAddedHandler = this.handleAppAdded.bind(this);
    this.appRemovedHandler = this.handleAppRemoved.bind(this);

    this.appManagerClient.onProvisioned(this.appAddedHandler);
    this.appManagerClient.onDestroyed(this.appRemovedHandler);
  }

  async launchApp(
    arnOrName: string,
    options?: AppLaunchOptions,
  ): Promise<AppHost> {
    const instance = await this.appManagerClient.launchApp(arnOrName, options);

    return this.getOrCreateAppHost(instance);
  }

  protected getOrCreateAppHost(instance: AppInstanceData): AppHost {
    let appHost = this.appHosts.get(instance.instanceId);

    // appAddedHandler likely already created the AppHost,
    // but create a new one up here if not
    if (!appHost) {
      appHost = this.createAppFromInstance(instance);
    }

    return appHost;
  }

  getAppHost(appInstanceId: string): AppHost | undefined {
    return this.appHosts.get(appInstanceId);
  }
 /**
   * @deprecated Use `listAppHosts` instead.
   */
  getAppHosts(): AppHost[] {
    return this.appHosts.getAll();
  }

  listAppHosts(): AppHost[] {
    return this.appHosts.getAll();
  }

  onAppHostAdded(handler: AppHostAddedHandler): void {
    this.addedEmitter.on(AppManager.ALL_APP_INSTANCES, handler);
  }

  offAppHostAdded(handler: AppHostAddedHandler): void {
    this.addedEmitter.off(AppManager.ALL_APP_INSTANCES, handler);
  }

  onAppHostRemoved(
    handler: AppHostRemovedHandler,
    appInstanceId?: string,
  ): void {
    this.removedEmitter.on(
      appInstanceId ?? AppManager.ALL_APP_INSTANCES,
      handler,
    );
  }

  offAppHostRemoved(
    handler: AppHostRemovedHandler,
    appInstanceId?: string,
  ): void {
    this.removedEmitter.off(
      appInstanceId ?? AppManager.ALL_APP_INSTANCES,
      handler,
    );
  }

  onAppHostFocused(handler: AppFocusedHandler): void {
    this.appFocusRelay.on(handler);
  }

  offAppHostFocused(handler: AppFocusedHandler): void {
    this.appFocusRelay.off(handler);
  }

  protected createAppFromInstance(instance: AppInstanceData): AppHost {
    const appHost = createAppHost({ ...instance, provider: this.provider });
    this.appHosts.set(appHost);
    return appHost;
  }

  private handleAppAdded(evt: AppInstanceStateChanged): Promise<void> {
    let appHost = this.appHosts.get(evt.appInstanceId);

    if (!appHost) {
      appHost = this.createAppFromInstance(evt);

      this.logger.info("AppHost created by event handler", {
        appInstanceId: appHost.appInstanceId,
      });
    }

    return this.addedEmitter.emit(AppManager.ALL_APP_INSTANCES, {
      appHost,
    });
  }

  private async handleAppRemoved({
    appInstanceId,
  }: AppInstanceStateChanged): Promise<void> {
    const appHost = this.appHosts.get(appInstanceId);
    this.appHosts.delete(appInstanceId);

    if (appHost) {
      await Promise.all([
        this.removedEmitter.emit(appHost.appInstanceId, { appHost }),
        this.removedEmitter.emit(AppManager.ALL_APP_INSTANCES, { appHost }),
      ]);

      this.logger.info("AppHost removed by event handler", {
        appInstanceId: appHost.appInstanceId,
      });
    } else {
      this.logger.warn("AppHost not found for destroyed app", {
        appInstanceId,
      });
    }

    return Promise.resolve();
  }

  /**
   * @deprecated Use `clearAll` instead.
   */
  destroyAllInstances(): Promise<{ appInstanceIds: string[] }> {
    return this.appManagerClient.destroyAllInstances();
  }

  clearAll(): Promise<ClearAppManagerResult> {
    return this.appManagerClient.clearAppManager();
  }

  destroy(): void {
    // Not waiting for response when destroying all apps
    void this.clearAll();

    this.appManagerClient.offProvisioned(this.appAddedHandler);
    this.appManagerClient.offDestroyed(this.appRemovedHandler);
    this.appFocusRelay.destroy();
  }

  async getAppCatalog(): Promise<AppConfig[]> {
    return this.appManagerClient.getAppCatalog();
  }

  getAppConfig(arnOrName: string): Promise<AppConfig> {
    return this.appManagerClient.getAppConfig(arnOrName);
  }

  destroyInstance(appInstanceId: string): Promise<void> {
    return this.appManagerClient.destroyInstance(appInstanceId);
  }
}
