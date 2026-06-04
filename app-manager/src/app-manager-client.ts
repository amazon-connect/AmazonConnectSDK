import {
  LaunchAppRequest,
} from "@amazon-connect/app-controller";
import {
  ConnectClient,
  ConnectClientConfig,
  sdkVersion,
} from "@amazon-connect/core";
import { AppConfig } from "@amazon-connect/workspace-types";

import {
  AppInstanceData,
  AppInstanceStateChangedHandler,
} from "./app";
import { AppLaunchOptions } from "./manager";
import {
  AppInstanceRoutes,
  AppManagerRoutes,
  AppRoutes,
  WorkspaceRoutes,
} from "./routes";
import { AppStateTopicKey } from "./topic-keys";
import { ClearAppManagerOptions, ClearAppManagerResult } from "./types";
import { workspaceNamespace } from "./workspace-namespace";

/**
 * This class is for internal use only and should not be used by consumers.
 * @internal
 */
export class AppManagerClient extends ConnectClient {
  constructor(config: ConnectClientConfig) {
    super(workspaceNamespace, config);
  }

  registerWorkspaceConnection(plugins?: string[]): Promise<void> {
    return this.context.proxy.request(WorkspaceRoutes.registerConnection, {
      sdkVersion,
      plugins,
    });
  }

  async getAppCatalog(): Promise<AppConfig[]> {
    const { applications } = await this.context.proxy.request<{
      applications: AppConfig[];
    }>(AppRoutes.getCatalog);

    return applications;
  }

  getAppConfig(appArn: string): Promise<AppConfig> {
    return this.context.proxy.request<AppConfig>(AppRoutes.getConfig, {
      key: appArn,
    });
  }

  launchApp(
    arnOrName: string,
    options?: AppLaunchOptions,
  ): Promise<AppInstanceData> {
    const requestData: LaunchAppRequest = {
      arnOrName,
      options: options ?? {},
    };

    return this.context.proxy.request(AppInstanceRoutes.launch, requestData);
  }

  destroyInstance(appInstanceId: string): Promise<void> {
    return this.context.proxy.request<void>(AppInstanceRoutes.destroy, {
      appInstanceId,
    });
  }

  /**
   * @deprecated Use `clearAppManager` instead.
   */
  destroyAllInstances(): Promise<{ appInstanceIds: string[] }> {
    return this.context.proxy.request<{ appInstanceIds: string[] }>(
      AppInstanceRoutes.destroyAll,
    );
  }

  /**
   * Clears all app instances and services managed by this app manager.
   *
   * @param options - Optional configuration for the clear operation.
   * @param options.waitForDestroy - When true, apps wait for their graceful
   * shutdown lifecycle to complete before being destroyed. Defaults to false.
   * @param options.force - @deprecated Use `waitForDestroy` instead.
   */
  clearAppManager(options?: ClearAppManagerOptions): Promise<ClearAppManagerResult> {
    return this.context.proxy.request<ClearAppManagerResult>(
      AppManagerRoutes.clear,
      options,
    );
  }

  onStateChanged(
    handler: AppInstanceStateChangedHandler,
    appInstanceId?: string,
  ) {
    this.context.proxy.subscribe(
      { key: AppStateTopicKey.StateChanged, parameter: appInstanceId },
      handler,
    );
  }

  offStateChanged(
    handler: AppInstanceStateChangedHandler,
    appInstanceId?: string,
  ) {
    this.context.proxy.unsubscribe(
      { key: AppStateTopicKey.StateChanged, parameter: appInstanceId },
      handler,
    );
  }

  onProvisioned(handler: AppInstanceStateChangedHandler) {
    this.context.proxy.subscribe(
      { key: AppStateTopicKey.Provisioned },
      handler,
    );
  }

  offProvisioned(handler: AppInstanceStateChangedHandler) {
    this.context.proxy.unsubscribe(
      { key: AppStateTopicKey.Provisioned },
      handler,
    );
  }

  onRunning(handler: AppInstanceStateChangedHandler, appInstanceId?: string) {
    this.context.proxy.subscribe(
      { key: AppStateTopicKey.Running, parameter: appInstanceId },
      handler,
    );
  }

  offRunning(handler: AppInstanceStateChangedHandler, appInstanceId?: string) {
    this.context.proxy.unsubscribe(
      { key: AppStateTopicKey.Running, parameter: appInstanceId },
      handler,
    );
  }

  onStopped(handler: AppInstanceStateChangedHandler, appInstanceId?: string) {
    this.context.proxy.subscribe(
      { key: AppStateTopicKey.Stopped, parameter: appInstanceId },
      handler,
    );
  }

  offStopped(handler: AppInstanceStateChangedHandler, appInstanceId?: string) {
    this.context.proxy.unsubscribe(
      { key: AppStateTopicKey.Stopped, parameter: appInstanceId },
      handler,
    );
  }

  onRestarting(
    handler: AppInstanceStateChangedHandler,
    appInstanceId?: string,
  ) {
    this.context.proxy.subscribe(
      { key: AppStateTopicKey.Restarting, parameter: appInstanceId },
      handler,
    );
  }

  offRestarting(
    handler: AppInstanceStateChangedHandler,
    appInstanceId?: string,
  ) {
    this.context.proxy.unsubscribe(
      { key: AppStateTopicKey.Restarting, parameter: appInstanceId },
      handler,
    );
  }

  onDestroying(
    handler: AppInstanceStateChangedHandler,
    appInstanceId?: string,
  ) {
    this.context.proxy.subscribe(
      { key: AppStateTopicKey.Destroying, parameter: appInstanceId },
      handler,
    );
  }

  offDestroying(
    handler: AppInstanceStateChangedHandler,
    appInstanceId?: string,
  ) {
    this.context.proxy.unsubscribe(
      { key: AppStateTopicKey.Destroying, parameter: appInstanceId },
      handler,
    );
  }

  onDestroyed(handler: AppInstanceStateChangedHandler, appInstanceId?: string) {
    this.context.proxy.subscribe(
      { key: AppStateTopicKey.Destroyed, parameter: appInstanceId },
      handler,
    );
  }

  offDestroyed(
    handler: AppInstanceStateChangedHandler,
    appInstanceId?: string,
  ) {
    this.context.proxy.unsubscribe(
      { key: AppStateTopicKey.Destroyed, parameter: appInstanceId },
      handler,
    );
  }

  onError(handler: AppInstanceStateChangedHandler, appInstanceId?: string) {
    this.context.proxy.subscribe(
      { key: AppStateTopicKey.Error, parameter: appInstanceId },
      handler,
    );
  }

  offError(handler: AppInstanceStateChangedHandler, appInstanceId?: string) {
    this.context.proxy.unsubscribe(
      { key: AppStateTopicKey.Error, parameter: appInstanceId },
      handler,
    );
  }
}
