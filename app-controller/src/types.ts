import { AppLaunchOptions } from "./launch";

export interface LaunchAppRequest {
  name: string;
  options: AppLaunchOptions;
}

export interface AppFocusResult {
  instanceId: string;
  result: "queued" | "completed" | "failed";
}
