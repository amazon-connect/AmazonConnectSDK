import { AppHostStore, workspaceNamespace } from "@amazon-connect/app-manager";
import { ConnectLogger, SubscriptionHandlerRelay } from "@amazon-connect/core";

import { AgentWorkspaceTopicKeys } from "../../../topic-keys";
import {
  AppScopeDestroying,
  AppScopeDestroyingHandler,
} from "../../app-scope-events";
import {
  ContactScopeGroupDestroying,
  ContactScopeGroupDestroyingHandler,
} from "../../app-scope-group-events";
import { AppScopeGroupStore } from "../../app-scope-group-store";
import { ContactScopeGroup } from "../../contact-scope-group";
import { ContactScopeChangedParams } from "./contact-scope-changed-params";

export type ContactScopeDestroyingRelayParams = ContactScopeChangedParams & {
  appHostStore: AppHostStore;
};

export class ContactScopeDestroyingRelay extends SubscriptionHandlerRelay<
  AppScopeDestroyingHandler,
  ContactScopeGroupDestroyingHandler,
  AppScopeDestroying,
  ContactScopeGroupDestroying
> {
  private readonly appScopeGroupStore: AppScopeGroupStore;
  protected readonly namespace = workspaceNamespace;
  protected readonly topicKey = AgentWorkspaceTopicKeys.appScopeGroupDestroying;
  private readonly appHostStore: AppHostStore;
  protected readonly logger: ConnectLogger;

  constructor({
    provider,
    appScopeGroupStore,
    appHostStore,
  }: ContactScopeDestroyingRelayParams) {
    super(provider);

    this.appScopeGroupStore = appScopeGroupStore;
    this.appHostStore = appHostStore;

    this.logger = new ConnectLogger({
      source: "app-manager-agent.contact-scope-destroying-relay",
      provider,
    });
  }

  protected skipRelay({ scope }: AppScopeDestroying): boolean {
    return scope.type !== "contact";
  }

  protected translate({
    scope,
    key,
    destroyingAppInstanceIds,
  }: AppScopeDestroying): Promise<ContactScopeGroupDestroying> {
    const { hosts: destroyingAppHosts, missingValues } =
      this.appHostStore.getBatch(destroyingAppInstanceIds);

    if (missingValues) {
      // This
      this.logger.debug(
        "Destroying app host(s) not found. This is likely because they have already completed destroy routine.",
        {
          appInstanceIds: missingValues,
        },
      );
    }

    return Promise.resolve({
      destroyingAppHosts,
      scopeGroup: this.appScopeGroupStore.get({
        scope,
        key,
      }) as ContactScopeGroup,
    });
  }
}
