import { AppHost } from "@amazon-connect/app-manager";
import { SubscriptionHandler } from "@amazon-connect/core";

import { AppScopeGroup } from "./app-scope-group";
import { ContactScopeGroup } from "./contact-scope-group";

// High Level Events Emitted by Package

type BaseAppScopeGroupEvent<TAppScopeGroup extends AppScopeGroup> = {
  scopeGroup: TAppScopeGroup;
};

export type AppScopeGroupAdded<
  TScopeGroup extends AppScopeGroup = AppScopeGroup,
> = BaseAppScopeGroupEvent<TScopeGroup>;
export type AppScopeGroupAddedHandler = SubscriptionHandler<AppScopeGroupAdded>;

export type AppScopeGroupDestroying<
  TScopeGroup extends AppScopeGroup = AppScopeGroup,
> = BaseAppScopeGroupEvent<TScopeGroup> & {
  destroyingAppHosts: AppHost[];
};
export type AppScopeGroupDestroyingHandler =
  SubscriptionHandler<AppScopeGroupDestroying>;

export type AppScopeGroupRemoved<
  TScopeGroup extends AppScopeGroup = AppScopeGroup,
> = BaseAppScopeGroupEvent<TScopeGroup>;
export type AppScopeGroupRemovedHandler =
  SubscriptionHandler<AppScopeGroupRemoved>;

export type ActiveAppScopeGroupChanged = BaseAppScopeGroupEvent<AppScopeGroup>;
export type ActiveAppScopeGroupChangedHandler =
  SubscriptionHandler<ActiveAppScopeGroupChanged>;

export type ContactScopeGroupAdded = AppScopeGroupAdded<ContactScopeGroup>;
export type ContactScopeGroupAddedHandler =
  SubscriptionHandler<ContactScopeGroupAdded>;
export type ContactScopeGroupDestroying =
  AppScopeGroupDestroying<ContactScopeGroup>;
export type ContactScopeGroupDestroyingHandler =
  SubscriptionHandler<ContactScopeGroupDestroying>;
export type ContactScopeGroupRemoved = AppScopeGroupRemoved<ContactScopeGroup>;
export type ContactScopeGroupRemovedHandler =
  SubscriptionHandler<ContactScopeGroupRemoved>;

type BaseAppHostInScopeGroupEvent = {
  scopeGroup: AppScopeGroup;
};

export type AppHostInScopeGroupAdded = BaseAppHostInScopeGroupEvent & {
  appHost: AppHost;
};
export type AppHostInScopeGroupAddedHandler =
  SubscriptionHandler<AppHostInScopeGroupAdded>;

export type AppHostInScopeGroupDestroying = BaseAppHostInScopeGroupEvent & {
  appHost: AppHost;
};
export type AppHostInScopeGroupDestroyingHandler =
  SubscriptionHandler<AppHostInScopeGroupDestroying>;

export type AppHostInScopeGroupRemoved = BaseAppHostInScopeGroupEvent & {
  appInstanceId: string;
};
export type AppHostInScopeGroupRemovedHandler =
  SubscriptionHandler<AppHostInScopeGroupRemoved>;
