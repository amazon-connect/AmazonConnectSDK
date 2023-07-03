import { AmazonConnectConfig } from "@amzn/amazon-connect-sdk-core";
import { AppCreateHandler, AppDestroyHandler } from "./lifecycle";

export type AmazonConnectAppConfig = {
  onCreate: AppCreateHandler;
  onDestroy?: AppDestroyHandler;
} & AmazonConnectConfig;
