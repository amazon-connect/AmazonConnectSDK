import { AppHostStore, workspaceNamespace } from "@amazon-connect/app-manager";
import {
  AmazonConnectProvider,
  ConnectLogger,
  SubscriptionHandler,
  SubscriptionHandlerData,
  SubscriptionHandlerRelay,
} from "@amazon-connect/core";

import { AgentWorkspaceTopicKeys } from "../../../topic-keys";
import {
  AppScopeAppUpdated,
  AppScopeAppUpdatedHandler,
} from "../../app-scope-events";
import { AppScopeGroupStore } from "../../app-scope-group-store";

export type AppScopeAppChangedRelayParams = {
  provider: AmazonConnectProvider;
  appHostStore: AppHostStore;
  appScopeGroupStore: AppScopeGroupStore;
};

export abstract class AppScopeAppChangedRelay<
  TExternalHandler extends SubscriptionHandler<TExternalEvent>,
  TExternalEvent extends SubscriptionHandlerData,
> extends SubscriptionHandlerRelay<
  AppScopeAppUpdatedHandler,
  TExternalHandler,
  AppScopeAppUpdated,
  TExternalEvent
> {
  protected readonly namespace = workspaceNamespace;
  protected readonly topicKey = AgentWorkspaceTopicKeys.appScopeGroupAppUpdated;
  protected abstract readonly updateType: AppScopeAppUpdated["updateType"];

  protected appHostStore: AppHostStore;
  protected appScopeGroupStore: AppScopeGroupStore;
  protected logger: ConnectLogger;

  constructor({
    provider,
    appHostStore,
    appScopeGroupStore,
  }: AppScopeAppChangedRelayParams) {
    super(provider);

    this.appHostStore = appHostStore;
    this.appScopeGroupStore = appScopeGroupStore;
    this.logger = new ConnectLogger({
      source: "app-manager-agent.app-scope-app-changed-relay",
      provider,
      mixin: () => ({ updateType: this.updateType }),
    });
  }

  protected skipRelay({ updateType }: AppScopeAppUpdated): boolean {
    return updateType !== this.updateType;
  }

  protected getAppHost(appInstanceId: string) {
    const appHost = this.appHostStore.get(appInstanceId);

    if (!appHost) {
      const message = "Unable to find host for updated app in group";
      this.logger.error(message, { appInstanceId });
      throw new Error(message);
    }

    return appHost;
  }
}
