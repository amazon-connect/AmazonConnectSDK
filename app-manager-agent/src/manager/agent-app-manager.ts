import {
  AppHost,
  AppHostStore,
  AppInstanceData,
  AppManagerParams,
} from "@amazon-connect/app-manager";

import { AgentAppManagerClient } from "../agent-app-manager-client";
import {
  ActiveAppScopeGroupChangedHandler,
  AppScopeGroupManager,
  ContactScopeGroup,
  ContactScopeGroupAddedHandler,
  ContactScopeGroupDestroyingHandler,
  ContactScopeGroupRemovedHandler,
  getContactScopeKey,
  idleScopeKey,
} from "../app-scope";
import { AppScopeGroup } from "../app-scope/app-scope-group";
import { ActiveContactChangedHandler, ActiveContactId } from "../types";

export type AgentAppManagerParams = AppManagerParams & {
  appHosts: AppHostStore;
  getOrCreateAppHost: (instance: AppInstanceData) => AppHost;
};

export class AgentAppManager {
  private readonly agentWorkspaceClient: AgentAppManagerClient;
  private readonly scopeManager: AppScopeGroupManager;
  private readonly getOrCreateAppHost: (instance: AppInstanceData) => AppHost;

  constructor(params: AgentAppManagerParams) {
    const { provider, appHosts, getOrCreateAppHost } = params;

    this.agentWorkspaceClient = new AgentAppManagerClient({ provider });
    this.scopeManager = new AppScopeGroupManager({
      provider,
      appHostStore: appHosts,
    });
    this.getOrCreateAppHost = getOrCreateAppHost;
  }

  setActiveContact(contactId: string): Promise<void> {
    return this.agentWorkspaceClient.setActiveContact(contactId);
  }

  getActiveContact(): Promise<ActiveContactId> {
    return this.agentWorkspaceClient.getActiveContact();
  }

  onActiveContactChanged(handler: ActiveContactChangedHandler): void {
    this.agentWorkspaceClient.onActiveContactChanged(handler);
  }

  offActiveContactChanged(handler: ActiveContactChangedHandler): void {
    this.agentWorkspaceClient.offActiveContactChanged(handler);
  }

  async getIdleStateGroup(): Promise<AppScopeGroup> {
    const idleStateGroup = await this.scopeManager.getGroup(idleScopeKey);

    if (!idleStateGroup) throw new Error("Idle state group not found");

    return idleStateGroup;
  }

  /**
   * @deprecated Use `listContactGroups` instead.
   */
  async getContactGroups(): Promise<Record<string, ContactScopeGroup>> {
    const contactGroups = await this.scopeManager.listContactGroups();
    return contactGroups.reduce(
      (acc, group) => ({ ...acc, [group.scope.contactId]: group }),
      {},
    );
  }

  async listContactGroups(): Promise<Record<string, ContactScopeGroup>> {
    const contactGroups = await this.scopeManager.listContactGroups();
    return contactGroups.reduce(
      (acc, group) => ({ ...acc, [group.scope.contactId]: group }),
      {},
    );
  }

  async getContactGroup(
    contact: string,
  ): Promise<ContactScopeGroup | undefined> {
    const contactKey = getContactScopeKey(contact);

    return this.scopeManager.getGroup(contactKey) as Promise<ContactScopeGroup>;
  }

  onContactGroupAdded(handler: ContactScopeGroupAddedHandler): void {
    this.scopeManager.onContactGroupAdded(handler);
  }

  offContactGroupAdded(handler: ContactScopeGroupAddedHandler): void {
    this.scopeManager.offContactGroupAdded(handler);
  }

  onContactGroupDestroying(
    handler: ContactScopeGroupDestroyingHandler,
    contact?: string,
  ) {
    this.scopeManager.onContactGroupDestroying(handler, contact);
  }

  offContactGroupDestroying(
    handler: ContactScopeGroupDestroyingHandler,
    contact?: string,
  ) {
    this.scopeManager.offContactGroupDestroying(handler, contact);
  }

  onContactGroupRemoved(
    handler: ContactScopeGroupRemovedHandler,
    contact?: string,
  ) {
    this.scopeManager.onContactGroupRemoved(handler, contact);
  }

  offContactGroupRemoved(
    handler: ContactScopeGroupRemovedHandler,
    contact?: string,
  ) {
    this.scopeManager.offContactGroupRemoved(handler, contact);
  }

  async getActiveAppScopeGroup(): Promise<AppScopeGroup> {
    const { activeContactId } =
      await this.agentWorkspaceClient.getActiveContact();

    return this.scopeManager.getGroupFromContactId(activeContactId);
  }

  onActiveAppScopeGroupChanged(
    handler: ActiveAppScopeGroupChangedHandler,
  ): void {
    this.scopeManager.onActiveAppScopeGroupChanged(handler);
  }

  offActiveAppScopeGroupChanged(
    handler: ActiveAppScopeGroupChangedHandler,
  ): void {
    this.scopeManager.offActiveAppScopeGroupChanged(handler);
  }
}
