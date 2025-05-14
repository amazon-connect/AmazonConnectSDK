import { AppConfig, AppScope } from "@amazon-connect/workspace-types";

import { AppScopeKey } from "./app-scope-key";
import { AppState } from "./app-state";

export type AppInstanceData<T extends AppConfig = AppConfig> = {
  appInstanceId: string;
  appConfig: T;
  connectionId: string;
  startTime: Date;
  state: AppState;
  stateVersion: number;
  scope?: AppScope;
  scopeKey?: AppScopeKey;
  appCreateOrder: number;
};
