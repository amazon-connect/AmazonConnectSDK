import { AmazonConnectConfig } from "@amazon-connect/core";

export type AmazonConnectStreamsSiteConfig = AmazonConnectConfig & {
  instanceUrl: string;
};
