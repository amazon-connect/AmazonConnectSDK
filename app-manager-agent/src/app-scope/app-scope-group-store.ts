import { AppHostStore, AppScopeKey } from "@amazon-connect/app-manager";
import { AmazonConnectProvider } from "@amazon-connect/core";
import { AppScope } from "@amazon-connect/workspace-types";

import { AgentAppManagerClient } from "../agent-app-manager-client";
import { AppScopeRemoved, AppScopeRemovedHandler } from "./app-scope-events";
import { AppScopeGroup } from "./app-scope-group";
import { AppScopeGroupEventManager } from "./event-relay";

export type AppScopeGroupStoreParams = {
  provider: AmazonConnectProvider;
  appHostStore: AppHostStore;
};

export class AppScopeGroupStore {
  private readonly provider: AmazonConnectProvider;
  private readonly appHostStore: AppHostStore;
  private readonly scopeGroups: Map<AppScopeKey, AppScopeGroup>;
  private readonly workspaceClient: AgentAppManagerClient;
  private readonly removeAppScopeHandler: AppScopeRemovedHandler;
  private eventManager: AppScopeGroupEventManager | null;

  constructor({ provider, appHostStore }: AppScopeGroupStoreParams) {
    this.provider = provider;
    this.appHostStore = appHostStore;
    this.scopeGroups = new Map();
    this.eventManager = null;
    this.workspaceClient = new AgentAppManagerClient({ provider });

    this.removeAppScopeHandler = this.removeAppScope.bind(this);
    this.workspaceClient.onAppScopeRemoved(this.removeAppScopeHandler);
  }

  init(eventManager: AppScopeGroupEventManager): void {
    if (this.eventManager) {
      throw new Error("AppScopeGroupStore already initialized");
    }

    this.eventManager = eventManager;
  }

  get({ scope, key }: { scope: AppScope; key: AppScopeKey }): AppScopeGroup {
    const existing = this.scopeGroups.get(key);
    if (existing) {
      return existing;
    }

    if (!this.eventManager) {
      throw new Error("AppScopeGroupStore not initialized");
    }

    const group = new AppScopeGroup({
      scope,
      key,
      provider: this.provider,
      appHostStore: this.appHostStore,
      eventManager: this.eventManager,
    });

    this.scopeGroups.set(key, group);
    return group;
  }

  private async removeAppScope({ key }: AppScopeRemoved): Promise<void> {
    // Allow time for access before cleanup
    await new Promise((resolve) => setTimeout(resolve, 10000));
    this.scopeGroups.delete(key);
  }

  destroy(): void {
    this.eventManager = null;
    this.scopeGroups.clear();
    this.workspaceClient.offAppScopeRemoved(this.removeAppScopeHandler);
  }
}
