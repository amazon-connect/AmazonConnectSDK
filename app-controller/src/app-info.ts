import {
  AppParameters,
  AppScope,
  ConfigBase,
  LaunchSource,
} from "@amazon-connect/workspace-types";

export type Config = Pick<
  ConfigBase,
  "arn" | "namespace" | "id" | "name" | "description"
>;

export type AppState = "starting" | "active" | "closing" | "error";

export interface AppInfo {
  instanceId: string;
  config: Config;
  startTime: Date;
  state: AppState;
  appCreateOrder: number;
  appManagerId: string;
  parameters: AppParameters | undefined;
  launchKey?: string;
  launchedBy?: LaunchSource;
  scope?: AppScope;
}
