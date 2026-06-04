import { AppHostStore, AppScopeKey } from "@amazon-connect/app-manager";
import { AmazonConnectProvider, ConnectLogger } from "@amazon-connect/core";
import { AppScope } from "@amazon-connect/workspace-types";

import { AgentAppManagerClient } from "../agent-app-manager-client";
import { AppScopeGroup } from "./app-scope-group";
import {
  ActiveAppScopeGroupChangedHandler,
  ContactScopeGroupAddedHandler,
  ContactScopeGroupDestroyingHandler,
  ContactScopeGroupRemovedHandler,
} from "./app-scope-group-events";
import { AppScopeGroupStore } from "./app-scope-group-store";
import { getContactScopeKey, idleScopeKey } from "./app-scope-key-values";
import { ContactScopeGroup } from "./contact-scope-group";
import {
  ContactToAppScopeGroupTranslator,
  getContactToAppScopeGroupTranslator,
} from "./contact-to-app-scope-group-translator";
import { AppScopeGroupEventManager } from "./event-relay/app-scope-group-event-manager";

export type AppScopeGroupManagerParams = {
  provider: AmazonConnectProvider;
  appHostStore: AppHostStore;
};

export class AppScopeGroupManager {
  private readonly workspaceClient: AgentAppManagerClient;
  private readonly appScopeGroupStore: AppScopeGroupStore;
  private readonly groupEventManager: AppScopeGroupEventManager;
  private readonly contactToAppScopeGroupTranslator: ContactToAppScopeGroupTranslator;

  private readonly logger: ConnectLogger;

  constructor({ provider, appHostStore }: AppScopeGroupManagerParams) {
    this.workspaceClient = new AgentAppManagerClient({ provider });

    this.appScopeGroupStore = new AppScopeGroupStore({
      provider,
      appHostStore,
    });

    this.groupEventManager = new AppScopeGroupEventManager({
      provider,
      appHostStore,
      appScopeGroupStore: this.appScopeGroupStore,
    });

    this.appScopeGroupStore.init(this.groupEventManager);

    this.contactToAppScopeGroupTranslator = getContactToAppScopeGroupTranslator(
      { appScopeGroupStore: this.appScopeGroupStore },
    );

    this.logger = new ConnectLogger({
      provider,
      source: "app-manager-agent.app-scope-manager",
    });
  }

  async getIdleGroup(): Promise<AppScopeGroup> {
    const data = await this.workspaceClient.getScopeGroup(idleScopeKey);

    if (!data) {
      const message = "Idle state group not found";
      this.logger.error(message);
      throw new Error(message);
    }

    return this.appScopeGroupStore.get(data);
  }

  async listContactGroups(): Promise<ContactScopeGroup[]> {
    const data = await this.workspaceClient.getScopeGroups({
      scopeTypeFilter: "contact",
    });

    return data.map((a) => this.appScopeGroupStore.get(a) as ContactScopeGroup);
  }

  async getGroup(
    scope: AppScope | AppScopeKey,
  ): Promise<AppScopeGroup | undefined> {
    const result = await this.workspaceClient.getScopeGroup(scope);

    return result ? this.appScopeGroupStore.get(result) : undefined;
  }

  getGroupFromContactId(contactId: string | null): AppScopeGroup {
    return this.contactToAppScopeGroupTranslator(contactId);
  }

  onContactGroupAdded(handler: ContactScopeGroupAddedHandler): void {
    this.groupEventManager.contactScopeAddedRelay.on(handler);
  }

  offContactGroupAdded(handler: ContactScopeGroupAddedHandler): void {
    this.groupEventManager.contactScopeAddedRelay.off(handler);
  }

  onContactGroupDestroying(
    handler: ContactScopeGroupDestroyingHandler,
    contact?: string,
  ) {
    const parameter = this.getContactParameter(contact);
    this.groupEventManager.contactScopeDestroyingRelay.on(handler, parameter);
  }

  offContactGroupDestroying(
    handler: ContactScopeGroupDestroyingHandler,
    contact?: string,
  ) {
    const parameter = this.getContactParameter(contact);
    this.groupEventManager.contactScopeDestroyingRelay.off(handler, parameter);
  }

  onContactGroupRemoved(
    handler: ContactScopeGroupRemovedHandler,
    contact?: string,
  ) {
    const parameter = this.getContactParameter(contact);
    this.groupEventManager.contactScopeRemovedRelay.on(handler, parameter);
  }

  offContactGroupRemoved(
    handler: ContactScopeGroupRemovedHandler,
    contact?: string,
  ) {
    const parameter = this.getContactParameter(contact);
    this.groupEventManager.contactScopeRemovedRelay.off(handler, parameter);
  }

  onActiveAppScopeGroupChanged(handler: ActiveAppScopeGroupChangedHandler) {
    this.groupEventManager.activeScopeChangedRelay.on(handler);
  }

  offActiveAppScopeGroupChanged(handler: ActiveAppScopeGroupChangedHandler) {
    this.groupEventManager.activeScopeChangedRelay.off(handler);
  }

  private getContactParameter(contact: string | undefined): string | undefined {
    return contact ? getContactScopeKey(contact) : undefined;
  }

  destroy(): void {
    this.groupEventManager.destroy();
  }
}
