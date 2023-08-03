import { AmazonConnectConfig } from "@amzn/amazon-connect-sdk-core";
import { AppCreateHandler, AppDestroyHandler } from "./lifecycle";

export type AmazonConnectAppConfig = {
  onCreate: AppCreateHandler;
  onDestroy?: AppDestroyHandler;

  workspace?: {
    connectionTimeout?: number; // Number of milliseconds. Defaults to 5000
  };
} & AmazonConnectConfig;
