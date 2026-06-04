import {
  AppHost,
  AppHostStore,
  AppScopeKey,
} from "@amazon-connect/app-manager";
import { AmazonConnectProvider, ConnectLogger } from "@amazon-connect/core";
import { AppScope } from "@amazon-connect/workspace-types";

import { AgentAppManagerClient } from "../agent-app-manager-client";
import {
  ModifyScopeGroupStateOptions,
  StartScopeResult,
  StoppedScopeResult,
} from "../types";
import {
  AppHostInScopeGroupAddedHandler,
  AppHostInScopeGroupDestroyingHandler,
  AppHostInScopeGroupRemovedHandler,
} from "./app-scope-group-events";
import { AppScopeGroupEventManager } from "./event-relay";

export type AppScopeGroupParams = {
  scope: AppScope;
  key: AppScopeKey;
  provider: AmazonConnectProvider;
  appHostStore: AppHostStore;
  eventManager: AppScopeGroupEventManager;
};

export class AppScopeGroup {
  readonly scope: Readonly<AppScope>;
  readonly key: AppScopeKey;

  private readonly appHostStore: AppHostStore;
  private readonly workspaceClient: AgentAppManagerClient;
  private readonly eventManager: AppScopeGroupEventManager;

  private readonly logger: ConnectLogger;

  constructor({
    scope,
    key,
    provider,
    appHostStore,
    eventManager,
  }: AppScopeGroupParams) {
    this.scope = scope;
    this.key = key;
    this.workspaceClient = new AgentAppManagerClient({ provider });
    this.appHostStore = appHostStore;
    this.eventManager = eventManager;

    this.logger = new ConnectLogger({
      source: "workspace.app-scope-group",
      provider,
      mixin: () => ({
        scope,
      }),
    });
  }

  async getAppHosts(options?: {
    includeDestroying?: boolean;
  }): Promise<AppHost[]> {
    const scopeGroup = await this.workspaceClient.getScopeGroup(this.key, {
      includeAppsWithoutScope: true,
    });

    if (!scopeGroup) {
      const message = "Attempted to get appHosts for scope that was not found";
      this.logger.error(message);

      throw new Error(message);
    }

    const { activeAppInstanceIds, destroyingAppInstanceIds } = scopeGroup;

    const { hosts: appHosts, missingValues } = this.appHostStore.getBatch(
      options?.includeDestroying
        ? [...activeAppInstanceIds, ...destroyingAppInstanceIds]
        : activeAppInstanceIds,
    );

    if (missingValues) {
      this.logger.warn("One or more app hosts missing when loading for scope", {
        missingValues,
      });
    }

    return appHosts.sort((a, b) => a.appCreateOrder - b.appCreateOrder);
  }

  onAppHostAdded(handler: AppHostInScopeGroupAddedHandler): void {
    this.eventManager.appAddedRelay.on(handler, this.key);
  }

  offAppHostAdded(handler: AppHostInScopeGroupAddedHandler): void {
    this.eventManager.appAddedRelay.off(handler, this.key);
  }

  onAppHostDestroying(handler: AppHostInScopeGroupDestroyingHandler): void {
    this.eventManager.appDestroyingRelay.on(handler, this.key);
  }

  offAppHostDestroying(handler: AppHostInScopeGroupDestroyingHandler): void {
    this.eventManager.appDestroyingRelay.off(handler, this.key);
  }

  onAppHostRemoved(handler: AppHostInScopeGroupRemovedHandler): void {
    this.eventManager.appRemovedRelay.on(handler, this.key);
  }

  offAppHostRemoved(handler: AppHostInScopeGroupRemovedHandler): void {
    this.eventManager.appRemovedRelay.off(handler, this.key);
  }

  startAll(options?: ModifyScopeGroupStateOptions): Promise<StartScopeResult> {
    return this.workspaceClient.startScopeGroup(this.key, options);
  }

  stopAll(options?: ModifyScopeGroupStateOptions): Promise<StoppedScopeResult> {
    return this.workspaceClient.stopScopeGroup(this.key, options);
  }
}
