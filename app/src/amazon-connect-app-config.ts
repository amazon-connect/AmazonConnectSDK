import { AmazonConnectConfig } from "@amzn/connect-core";
import { AppCreateHandler, AppDestroyHandler } from "./lifecycle";

export type AmazonConnectAppConfig = {
  onCreate: AppCreateHandler;
  onDestroy?: AppDestroyHandler;
} & AmazonConnectConfig;
