import { AppScopeKey } from "@amazon-connect/app-manager";
import { SubscriptionHandler } from "@amazon-connect/core";
import { AppScope } from "@amazon-connect/workspace-types";

// Low Level Events that come from subject
export type BaseAppScopeEvent = {
  scope: AppScope;
  key: AppScopeKey;
};

export type AppScopeAdded = BaseAppScopeEvent;
export type AppScopeAddedHandler = SubscriptionHandler<AppScopeAdded>;

export type AppScopeAppUpdated = BaseAppScopeEvent & {
  appInstanceId: string;
  updateType: "added" | "destroying" | "removed";
};
export type AppScopeAppUpdatedHandler = SubscriptionHandler<AppScopeAppUpdated>;

export type AppScopeDestroying = BaseAppScopeEvent & {
  activeAppInstanceIds: string[];
  destroyingAppInstanceIds: string[];
};
export type AppScopeDestroyingHandler = SubscriptionHandler<AppScopeDestroying>;

export type AppScopeRemoved = BaseAppScopeEvent;
export type AppScopeRemovedHandler = SubscriptionHandler<AppScopeRemoved>;
