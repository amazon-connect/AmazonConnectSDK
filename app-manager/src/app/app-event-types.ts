import { SubscriptionHandler } from "@amazon-connect/core";

import {
  InstanceStateChanged,
  InstanceStateChangedHandler,
  StateChanged,
} from "../host";
import { AppInstanceData } from "./app-instance-data";
import { AppHost } from "./host";

export type AppStateChanged = StateChanged<AppHost>;

export type AppStateChangedHandler = SubscriptionHandler<AppStateChanged>;

export type AppProvisioned = AppStateChanged;
export type AppProvisionedHandler = SubscriptionHandler<AppProvisioned>;

export type AppRunning = AppStateChanged;
export type AppRunningHandler = SubscriptionHandler<AppRunning>;

export type AppStopped = AppStateChanged;
export type AppStoppedHandler = SubscriptionHandler<AppStopped>;

export type AppRestarting = AppStateChanged;
export type AppRestartingHandler = SubscriptionHandler<AppRestarting>;

export type AppDestroying = AppStateChanged;
export type AppDestroyingHandler = SubscriptionHandler<AppDestroying>;

export type AppDestroyed = AppStateChanged;
export type AppDestroyedHandler = SubscriptionHandler<AppDestroyed>;

export type AppError = AppStateChanged & {
  // TODO Attempt to make this a defined type
  error: unknown;
};
export type AppErrorHandler = SubscriptionHandler<AppError>;

export type AppFocused = {
  host: AppHost;
  focusRequestTime: number;
};
export type AppFocusedHandler = SubscriptionHandler<AppFocused>;

export type AppInstanceStateChanged = InstanceStateChanged<AppInstanceData>;

export type AppInstanceStateChangedHandler =
  InstanceStateChangedHandler<AppInstanceStateChanged>;

export type AppInstanceFocused = AppInstanceData & {
  focusRequestTime: number;
};
export type AppInstanceFocusedHandler = SubscriptionHandler<AppInstanceFocused>;
