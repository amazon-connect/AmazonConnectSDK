import { AppHost } from "./app";
import { ComponentState, CurrentState } from "./component-state";

export type WorkspaceType = "default" | "agent";

export type StateFailReason =
  | "invalidTransition"
  | "isCurrentState"
  | "invalidManualStateRequest"
  | "staleRequest";

/**
 * @deprecated This property is deprecated. Use `StateFailReason` instead.
 */
export type AppStateFailReason = StateFailReason;

export type StateChangeResult =
  | {
      success: false;
      reason: StateFailReason;
      state: ComponentState;
    }
  | (CurrentState & { success: true; previous: { state: ComponentState } });

/**
 * @deprecated This property is deprecated. Use `StateChangeResult` instead.
 */
export type AppStateChangeResult = StateChangeResult;

type AppStateSetResult =
  | {
      success: false;
      reason: string;
    }
  | { success: true; state: ComponentState };

export type AppStartedResult = AppStateSetResult &
  ({ success: false } | { success: true; state: "running" });

export type AppStoppedResult = AppStateSetResult &
  ({ success: false } | { success: true; state: "stopped" });

export type BulkInstances<T> = {
  hosts: T[];
  missingValues?: string[];
};
export type BulkAppInstances = BulkInstances<AppHost>;

export type ClearAppManagerResult = {
  appInstanceIds: string[];
  serviceInstanceIds: string[];
};
