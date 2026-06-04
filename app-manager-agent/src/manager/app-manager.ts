/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { addAppManagerPluginKey } from "@amazon-connect/app-manager";
import { AppManager } from "@amazon-connect/app-manager";
import { AppScope } from "@amazon-connect/workspace-types";

import {
  ActiveAppScopeGroupChangedHandler,
  AppScopeGroup,
  ContactScopeGroup,
  ContactScopeGroupAddedHandler,
  ContactScopeGroupDestroyingHandler,
  ContactScopeGroupRemovedHandler,
} from "../app-scope";
import { ActiveContactChangedHandler, ActiveContactId } from "../types";
import { AgentAppManager } from "./agent-app-manager";

declare module "@amazon-connect/app-manager" {
  interface AppManager {
    getIdleStateGroup(): Promise<AppScopeGroup>;
    listContactGroups(): Promise<Record<string, ContactScopeGroup>>;
    getContactGroup(contact: string): Promise<ContactScopeGroup | undefined>;

    setActiveContact(contactId: string): Promise<void>;
    getActiveContact(): Promise<ActiveContactId | undefined>;
    onActiveContactChanged(handler: ActiveContactChangedHandler): void;
    offActiveContactChanged(handler: ActiveContactChangedHandler): void;

    onContactGroupAdded(handler: ContactScopeGroupAddedHandler): void;
    offContactGroupAdded(handler: ContactScopeGroupAddedHandler): void;
    onContactGroupDestroying(
      handler: ContactScopeGroupDestroyingHandler,
      contact?: string,
    ): void;
    offContactGroupDestroying(
      handler: ContactScopeGroupDestroyingHandler,
      contact?: string,
    ): void;
    onContactGroupRemoved(
      handler: ContactScopeGroupRemovedHandler,
      contact?: string,
    ): void;
    offContactGroupRemoved(
      handler: ContactScopeGroupRemovedHandler,
      contact?: string,
    ): void;
    getActiveAppScopeGroup(): Promise<AppScopeGroup>;
    onActiveAppScopeGroupChanged(
      handler: ActiveAppScopeGroupChangedHandler,
    ): void;
    offActiveAppScopeGroupChanged(
      handler: ActiveAppScopeGroupChangedHandler,
    ): void;
  }
}

declare module "@amazon-connect/app-controller" {
  interface CoreLaunchOptions {
    /**
     * For apps associated with a contact, apply a specific scope. If not set
     * the app will be associated with the active contact. The launch will
     * error if the app is not associated with a contact.
     * @example
     * {
     *   type: "contact",
     *   contactId: "123"
     * }
     * @throws {ConnectError} Throws if the scope is not active or if the app is
     * not associated with a contact
     */
    scope?: AppScope;
  }
}

// Sets plugin key when registering with shared worker
addAppManagerPluginKey("agent");

// Lazy load of agentAppManager
Object.defineProperty(AppManager.prototype, "agentAppManager", {
  get: function () {
    if (!this._agentAppManager) {
      Object.defineProperty(this, "_agentAppManager", {
        value: new AgentAppManager({
          provider: this.provider,
          appHosts: this.appHosts,
          getOrCreateAppHost: this.getOrCreateAppHost.bind(this),
        }),
        writable: false,
        enumerable: false,
        configurable: false,
      });
    }
    return this._agentAppManager;
  },
  enumerable: false,
  configurable: false,
});

// Adds every property in AgentAppManager to AppManager prototype
Object.getOwnPropertyNames(AgentAppManager.prototype)
  .filter((prop) => {
    return prop !== "constructor";
  })
  .forEach((methodName) => {
    Object.defineProperty(AppManager.prototype, methodName, {
      value: function (...args: any[]) {
        return this.agentAppManager[methodName](...args);
      },
      writable: false,
      enumerable: false,
      configurable: false,
    });
  });
