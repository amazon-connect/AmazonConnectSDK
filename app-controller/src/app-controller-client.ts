import {
  ConnectClient,
  ConnectClientConfig,
  deepClone,
} from "@amazon-connect/core";
import { AppConfig } from "@amazon-connect/workspace-types";

import { AppInfo } from "./app-info";
import { AppLaunchOptions } from "./launch/app-launch-options";
import { AppControllerRoutes } from "./routes";
import { AppFocusResult, LaunchAppRequest } from "./types";
import { workspaceNamespace } from "./workspace-namespace";

export class AppControllerClient extends ConnectClient {
  constructor(config?: ConnectClientConfig) {
    super(workspaceNamespace, config);
  }

  async getAppCatalog(): Promise<AppConfig[]> {
    const { applications } = await this.context.proxy.request<{
      applications: AppConfig[];
    }>(AppControllerRoutes.getCatalog);

    return applications;
  }

  getAppConfig(arnOrName: string): Promise<AppConfig> {
    return this.context.proxy.request<AppConfig>(
      AppControllerRoutes.getConfig,
      {
        key: arnOrName,
      },
    );
  }

  launchApp(arnOrName: string, options?: AppLaunchOptions): Promise<AppInfo> {
    const optionsCopy = { ...(options ?? {}) };
    if (optionsCopy.parameters) {
      optionsCopy.parameters = deepClone(optionsCopy.parameters);
    }

    const requestData: LaunchAppRequest = {
      arnOrName,
      options: optionsCopy,
    };

    return this.context.proxy.request(
      AppControllerRoutes.launchApp,
      requestData,
    );
  }

  getApp(instanceId: string): Promise<AppInfo> {
    return this.context.proxy.request<AppInfo>(AppControllerRoutes.getApp, {
      instanceId,
    });
  }

  async getApps(): Promise<AppInfo[]> {
    const { apps } = await this.context.proxy.request<{ apps: AppInfo[] }>(
      AppControllerRoutes.getApps,
      {},
    );

    return apps;
  }

  focusApp(instanceId: string): Promise<AppFocusResult> {
    return this.context.proxy.request<AppFocusResult>(
      AppControllerRoutes.focusApp,
      {
        instanceId,
      },
    );
  }

  closeApp(instanceId: string): Promise<void> {
    return this.context.proxy.request<void>(AppControllerRoutes.closeApp, {
      instanceId,
    });
  }
}
