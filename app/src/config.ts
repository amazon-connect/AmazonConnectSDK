import { AmazonConnectConfig } from "@amazon-connect/core";

import {
  AppCreateHandler,
  AppDestroyHandler,
  ServiceCreatedHandler,
} from "./lifecycle";

export type BaseConfig = {
  workspace?: {
    connectionTimeout?: number; // Number of milliseconds. Defaults to 5000
  };
} & AmazonConnectConfig;

export type AmazonConnectAppConfig = BaseConfig & {
  onCreate: AppCreateHandler;
  onDestroy?: AppDestroyHandler;
};

export type AmazonConnectServiceConfig = BaseConfig & {
  onCreate: ServiceCreatedHandler;
};
