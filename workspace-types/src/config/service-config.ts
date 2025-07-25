import { IFrameConfig } from "./iframe-config";

export type ServiceConfig = IFrameConfig & {
  applyToAgentWorkspace: boolean;
  initializationTimeout: number;
};
