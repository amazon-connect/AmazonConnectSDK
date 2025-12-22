import { AmazonConnectProvider, ConnectLogger } from "@amazon-connect/core";

import { AppManagerClient } from "../app-manager-client";

const plugins: string[] = [];

export async function registerConnection(
  provider: AmazonConnectProvider,
): Promise<void> {
  const client = new AppManagerClient({ provider });
  const logger = new ConnectLogger({
    provider,
    source: "workspace.registerConnection",
  });
  try {
    await client.registerWorkspaceConnection(plugins);
    logger.info("Workspace connection registered", { plugins });
  } catch (error) {
    logger.error("Error registering workspace connection", { error, plugins });
  }
}

export function addAppManagerPluginKey(pluginName: string): void {
  plugins.push(pluginName);
}
