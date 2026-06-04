import { AmazonConnectProviderBase } from "@amazon-connect/core";

import { AppManager } from "../manager";
import type { AppManagerConfig } from "./app-manager-config";
import { AppManagerPlugin } from "./app-manager-plugin";

declare module "@amazon-connect/core" {
  interface AmazonConnectProvider {
    readonly appManager: AppManager;
  }

  interface AmazonConnectProviderBase {
    readonly appManager: AppManager;
  }

  interface AmazonConnectConfig {
    /**
     * Configuration options scoped to the app manager created by this specific
     * provider instance.
     *
     * Settings provided here apply only to the app manager belonging to the
     * provider being initialized. If a page contains multiple child partitions —
     * each with their own provider and their own app manager — these options will
     * only affect the app manager of the provider they are passed to.
     *
     * @example
     * ```typescript
     * AmazonConnectProvider.init({
     *   appManager: {
     *     plugins: ["my-plugin"],
     *   },
     * });
     * ```
     */
    appManager?: AppManagerConfig;
  }
}

AppManagerPlugin(AmazonConnectProviderBase.prototype);
