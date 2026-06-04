import { workspaceNamespace } from "@amazon-connect/app-controller";
import {
  AmazonConnectProvider,
  SubscriptionHandlerRelay,
} from "@amazon-connect/core";

import { AgentWorkspaceTopicKeys } from "../../../topic-keys";
import {
  ActiveContactChanged,
  ActiveContactChangedHandler,
} from "../../../types";
import {
  ActiveAppScopeGroupChanged,
  ActiveAppScopeGroupChangedHandler,
} from "../../app-scope-group-events";
import { AppScopeGroupStore } from "../../app-scope-group-store";
import {
  ContactToAppScopeGroupTranslator,
  getContactToAppScopeGroupTranslator,
} from "../../contact-to-app-scope-group-translator";

export interface ActiveScopedChangedRelayParams {
  provider: AmazonConnectProvider;
  appScopeGroupStore: AppScopeGroupStore;
}

export class ActiveScopedChangedRelay extends SubscriptionHandlerRelay<
  ActiveContactChangedHandler,
  ActiveAppScopeGroupChangedHandler,
  ActiveContactChanged,
  ActiveAppScopeGroupChanged
> {
  private readonly contactToAppScopeGroupTranslator: ContactToAppScopeGroupTranslator;
  protected readonly namespace = workspaceNamespace;
  protected readonly topicKey = AgentWorkspaceTopicKeys.activeContactChanged;

  constructor({
    provider,
    appScopeGroupStore,
  }: ActiveScopedChangedRelayParams) {
    super(provider);

    this.contactToAppScopeGroupTranslator = getContactToAppScopeGroupTranslator(
      { appScopeGroupStore },
    );
  }

  protected translate({
    activeContactId,
  }: ActiveContactChanged): Promise<ActiveAppScopeGroupChanged> {
    const scopeGroup = this.contactToAppScopeGroupTranslator(activeContactId);

    return Promise.resolve({ scopeGroup });
  }
}
