import { ConfigBase } from "./config-base";
import { IFrameConfig } from "./iframe-config";

export type Permission = string;

type BaseAppConfig = ConfigBase & {
  _type: string;
  contactHandling?: { scope: string };
  permissions: Permission[];
};

export type IFrameAppConfig = BaseAppConfig &
  IFrameConfig & {
    _type: "iframe";
  };

// This will provide support for additional types of apps
// such as running an import map
export type AppConfig = IFrameAppConfig;
