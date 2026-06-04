import { AppHostStore } from "@amazon-connect/app-manager";
import { AmazonConnectProvider } from "@amazon-connect/core";

import { AppScopeGroupStore } from "../app-scope-group-store";
import { ActiveScopedChangedRelay } from "./active-scope-changed";
import {
  AppScopeAppAddedRelay,
  AppScopeAppChangedRelayParams,
  AppScopeAppDestroyingRelay,
  AppScopeAppRemovedRelay,
} from "./app-changed";
import {
  ContactScopeAddedRelay,
  ContactScopeChangedParams,
  ContactScopeDestroyingRelay,
  ContactScopeRemovedRelay,
} from "./contact-scope-changed";

export type AppScopeGroupEventManagerParams = {
  provider: AmazonConnectProvider;
  appHostStore: AppHostStore;
  appScopeGroupStore: AppScopeGroupStore;
};

export class AppScopeGroupEventManager {
  readonly appAddedRelay: AppScopeAppAddedRelay;
  readonly appDestroyingRelay: AppScopeAppDestroyingRelay;
  readonly appRemovedRelay: AppScopeAppRemovedRelay;

  readonly contactScopeAddedRelay: ContactScopeAddedRelay;
  readonly contactScopeDestroyingRelay: ContactScopeDestroyingRelay;
  readonly contactScopeRemovedRelay: ContactScopeRemovedRelay;

  readonly activeScopeChangedRelay: ActiveScopedChangedRelay;

  constructor({
    provider,
    appHostStore,
    appScopeGroupStore,
  }: AppScopeGroupEventManagerParams) {
    const appParams: AppScopeAppChangedRelayParams = {
      provider,
      appHostStore,
      appScopeGroupStore,
    };

    this.appAddedRelay = new AppScopeAppAddedRelay(appParams);
    this.appDestroyingRelay = new AppScopeAppDestroyingRelay(appParams);
    this.appRemovedRelay = new AppScopeAppRemovedRelay(appParams);

    const groupParams: ContactScopeChangedParams = {
      provider,
      appScopeGroupStore,
    };

    this.contactScopeAddedRelay = new ContactScopeAddedRelay(groupParams);
    this.contactScopeDestroyingRelay = new ContactScopeDestroyingRelay({
      ...groupParams,
      appHostStore,
    });
    this.contactScopeRemovedRelay = new ContactScopeRemovedRelay(groupParams);

    this.activeScopeChangedRelay = new ActiveScopedChangedRelay(groupParams);
  }

  destroy(): void {
    this.appAddedRelay.destroy();
    this.appDestroyingRelay.destroy();
    this.appRemovedRelay.destroy();

    this.contactScopeAddedRelay.destroy();
    this.contactScopeDestroyingRelay.destroy();
    this.contactScopeRemovedRelay.destroy();

    this.activeScopeChangedRelay.destroy();
  }
}
