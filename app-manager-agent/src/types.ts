import { SubscriptionHandler } from "@amazon-connect/core";
import { AppScope } from "@amazon-connect/workspace-types";

export type AppScopeGroupData = {
  scope: AppScope;
  key: string;
  activeAppInstanceIds: string[];
  destroyingAppInstanceIds: string[];
};

export type ModifyScopeGroupStateOptions = {
  includeAppsWithoutScope?: boolean;
};

export type GetScopeGroupOptions = {
  includeAppsWithoutScope?: boolean;
};

export type GetScopeGroupsOptions = {
  scopeTypeFilter?: AppScope["type"];
};

export type StartScopeResult = {
  startedAppInstanceIds: string[];
};

export type StoppedScopeResult = {
  stoppedAppInstanceIds: string[];
};

export type ActiveContactId = {
  activeContactId: string | null;
};

export type ActiveContactChanged = ActiveContactId;
export type ActiveContactChangedHandler =
  SubscriptionHandler<ActiveContactChanged>;
