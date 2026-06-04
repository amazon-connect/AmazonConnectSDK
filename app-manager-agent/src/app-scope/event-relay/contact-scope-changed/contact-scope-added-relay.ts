import { workspaceNamespace } from "@amazon-connect/app-manager";
import { SubscriptionHandlerRelay } from "@amazon-connect/core";

import { AgentWorkspaceTopicKeys } from "../../../topic-keys";
import { AppScopeAdded, AppScopeAddedHandler } from "../../app-scope-events";
import {
  ContactScopeGroupAdded,
  ContactScopeGroupAddedHandler,
} from "../../app-scope-group-events";
import { AppScopeGroupStore } from "../../app-scope-group-store";
import { ContactScopeGroup } from "../../contact-scope-group";
import { ContactScopeChangedParams } from "./contact-scope-changed-params";

export class ContactScopeAddedRelay extends SubscriptionHandlerRelay<
  AppScopeAddedHandler,
  ContactScopeGroupAddedHandler,
  AppScopeAdded,
  ContactScopeGroupAdded
> {
  private readonly appScopeGroupStore: AppScopeGroupStore;
  protected readonly namespace = workspaceNamespace;
  protected readonly topicKey = AgentWorkspaceTopicKeys.appScopeGroupAdded;

  constructor({ provider, appScopeGroupStore }: ContactScopeChangedParams) {
    super(provider);

    this.appScopeGroupStore = appScopeGroupStore;
  }

  protected skipRelay({ scope }: AppScopeAdded): boolean {
    return scope.type !== "contact";
  }

  protected translate({
    scope,
    key,
  }: AppScopeAdded): Promise<ContactScopeGroupAdded> {
    return Promise.resolve({
      scopeGroup: this.appScopeGroupStore.get({
        scope,
        key,
      }) as ContactScopeGroup,
    });
  }
}
