import { workspaceNamespace } from "@amazon-connect/app-manager";
import { SubscriptionHandlerRelay } from "@amazon-connect/core";

import { AgentWorkspaceTopicKeys } from "../../../topic-keys";
import {
  AppScopeRemoved,
  AppScopeRemovedHandler,
} from "../../app-scope-events";
import {
  ContactScopeGroupRemoved,
  ContactScopeGroupRemovedHandler,
} from "../../app-scope-group-events";
import { AppScopeGroupStore } from "../../app-scope-group-store";
import { ContactScopeGroup } from "../../contact-scope-group";
import { ContactScopeChangedParams } from "./contact-scope-changed-params";

export class ContactScopeRemovedRelay extends SubscriptionHandlerRelay<
  AppScopeRemovedHandler,
  ContactScopeGroupRemovedHandler,
  AppScopeRemoved,
  ContactScopeGroupRemoved
> {
  private readonly appScopeGroupStore: AppScopeGroupStore;
  protected readonly namespace = workspaceNamespace;
  protected readonly topicKey = AgentWorkspaceTopicKeys.appScopeGroupRemoved;

  constructor({ provider, appScopeGroupStore }: ContactScopeChangedParams) {
    super(provider);

    this.appScopeGroupStore = appScopeGroupStore;
  }

  protected skipRelay({ scope }: AppScopeRemoved): boolean {
    return scope.type !== "contact";
  }

  protected translate({
    scope,
    key,
  }: AppScopeRemoved): Promise<ContactScopeGroupRemoved> {
    return Promise.resolve({
      scopeGroup: this.appScopeGroupStore.get({
        scope,
        key,
      }) as ContactScopeGroup,
    });
  }
}
