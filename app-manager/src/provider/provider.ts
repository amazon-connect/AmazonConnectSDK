import { AmazonConnectProviderBase } from "@amazon-connect/core";

import { AppManager } from "../manager";
import { AppManagerPlugin } from "./app-manager-plugin";

declare module "@amazon-connect/core" {
  interface AmazonConnectProvider {
    readonly appManager: AppManager;
  }

  interface AmazonConnectProviderBase {
    readonly appManager: AppManager;
  }
}

AppManagerPlugin(AmazonConnectProviderBase.prototype);
