import { AmazonConnectConfig } from "@amazon-connect/core";

export interface AmazonConnectStreamsSiteConfig extends AmazonConnectConfig {
  instanceUrl: string;
}
