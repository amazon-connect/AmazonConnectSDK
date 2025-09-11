import { AmazonConnectConfig } from "@amazon-connect/core";

export interface AmazonConnectGRStreamsSiteConfig extends AmazonConnectConfig {
  primaryInstanceUrl: string;
  secondaryInstanceUrl: string;
}
