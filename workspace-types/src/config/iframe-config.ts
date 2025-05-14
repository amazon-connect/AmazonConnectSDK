import { ConfigBase } from "./config-base";

export type IFrameConfig = ConfigBase & {
  // TODO Set this as required after module is updated
  iframeConfig?: {
    allow: string[];
    sandbox: string[];
  };
};
