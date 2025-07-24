import { AppLaunchOptions } from "./launch";

export interface LaunchAppRequest {
  arnOrName: string;
  options: AppLaunchOptions;
}

export interface AppFocusResult {
  instanceId: string;
  result: "queued" | "completed" | "failed";
}
