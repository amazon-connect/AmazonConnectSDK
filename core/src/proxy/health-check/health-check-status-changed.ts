import { SubscriptionHandler } from "../../messaging/subscription";
import { HealthCheckStatus } from "./health-check-status";

export type HealthCheckStatusChanged = {
  status: Exclude<HealthCheckStatus, "unknown">;
  previousStatus: HealthCheckStatus;
  lastCheckTime: number | null;
  lastCheckCounter: number | null;
};

export type HealthCheckStatusChangedHandler =
  SubscriptionHandler<HealthCheckStatusChanged>;
