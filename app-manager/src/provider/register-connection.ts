import { AmazonConnectProvider, ConnectLogger } from "@amazon-connect/core";

import { AppManagerClient } from "../app-manager-client";
import { getProviderPlugins } from "./provider-plugins";

/**
 * Registers the provider's app manager connection, including the applicable
 * plugins for this provider instance.
 *
 * @remarks
 * The effective plugin list is the deduplicated union of the global plugins
 * (set via `addAppManagerPluginKey`) and any provider-scoped plugins supplied
 * through the `appManager.plugins` option on the provider's config. See
 * `getProviderPlugins` for the full merging logic.
 *
 * This function is internal and is called automatically when an app manager is
 * accessed on a provider for the first time.
 *
 * @param provider - The provider whose app manager connection should be registered.
 */
export async function registerConnection(
  provider: AmazonConnectProvider,
): Promise<void> {
  const client = new AppManagerClient(provider);
  const logger = new ConnectLogger({
    provider,
    source: "workspace.registerConnection",
  });

  const plugins = getProviderPlugins(provider);

  try {
    await client.registerWorkspaceConnection(plugins);
    logger.info("Workspace connection registered", { plugins });
  } catch (error) {
    logger.error("Error registering workspace connection", { error, plugins });
  }
}
