import {
  AppManagerClient,
  AppScopeKey,
} from "@amazon-connect/app-manager";
import { isNoResultResponseError } from "@amazon-connect/core";
import { AppScope } from "@amazon-connect/workspace-types";

import { AppScopeRemovedHandler } from "./app-scope";
import { ActiveContactRoutes, AppScopeRoutes } from "./routes";
import { AgentWorkspaceTopicKeys } from "./topic-keys";
import {
  ActiveContactChangedHandler,
  ActiveContactId,
  AppScopeGroupData,
  GetScopeGroupOptions,
  GetScopeGroupsOptions,
  ModifyScopeGroupStateOptions,
  StartScopeResult,
  StoppedScopeResult,
} from "./types";

export class AgentAppManagerClient extends AppManagerClient {

  setActiveContact(contactId: string): Promise<void> {
    return this.context.proxy.request(ActiveContactRoutes.setActiveContact, {
      contactId,
    });
  }

  getActiveContact(): Promise<ActiveContactId> {
    return this.context.proxy.request(ActiveContactRoutes.getActiveContact);
  }

  onActiveContactChanged(handler: ActiveContactChangedHandler): void {
    this.context.proxy.subscribe(
      {
        key: AgentWorkspaceTopicKeys.activeContactChanged,
      },
      handler,
    );
  }

  offActiveContactChanged(handler: ActiveContactChangedHandler): void {
    this.context.proxy.unsubscribe(
      {
        key: AgentWorkspaceTopicKeys.activeContactChanged,
      },
      handler,
    );
  }

  async getScopeGroups(
    options?: GetScopeGroupsOptions,
  ): Promise<AppScopeGroupData[]> {
    const { scopeGroups } = await this.context.proxy.request<{
      scopeGroups: AppScopeGroupData[];
    }>(AppScopeRoutes.getScopes, { options });

    return scopeGroups;
  }

  async getScopeGroup(
    scope: AppScope | AppScopeKey,
    options?: GetScopeGroupOptions,
  ): Promise<AppScopeGroupData | undefined> {
    try {
      return await this.context.proxy.request(AppScopeRoutes.getScope, {
        scope,
        options,
      });
    } catch (error) {
      if (isNoResultResponseError(error)) return undefined;
      throw error;
    }
  }

  startScopeGroup(
    key: AppScopeKey,
    options?: ModifyScopeGroupStateOptions,
  ): Promise<StartScopeResult> {
    return this.context.proxy.request(AppScopeRoutes.startScope, {
      key,
      options,
    });
  }

  stopScopeGroup(
    key: AppScopeKey,
    options?: ModifyScopeGroupStateOptions,
  ): Promise<StoppedScopeResult> {
    return this.context.proxy.request(AppScopeRoutes.stopScope, {
      key,
      options,
    });
  }

  onAppScopeRemoved(
    handler: AppScopeRemovedHandler,
    appScope?: AppScopeKey,
  ): void {
    this.context.proxy.subscribe(
      {
        key: AgentWorkspaceTopicKeys.appScopeGroupRemoved,
        parameter: appScope,
      },
      handler,
    );
  }

  offAppScopeRemoved(
    handler: AppScopeRemovedHandler,
    appScope?: AppScopeKey,
  ): void {
    this.context.proxy.unsubscribe(
      {
        key: AgentWorkspaceTopicKeys.appScopeGroupRemoved,
        parameter: appScope,
      },
      handler,
    );
  }
}
