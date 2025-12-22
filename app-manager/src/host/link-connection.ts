import { AmazonConnectProvider, ConnectLogger } from "@amazon-connect/core";
import { AppHostInitMessage } from "@amazon-connect/workspace-types";

export function linkConnection({
  instanceId,
  connectionId,
  provider,
  port,
  hostInitMessage,
  isRestart,
}: {
  instanceId: string;
  connectionId: string;
  provider: AmazonConnectProvider;
  port: MessagePort;
  hostInitMessage: AppHostInitMessage;
  isRestart: boolean;
}): void {
  const { providerId, sdkVersion } = hostInitMessage;

  const logger = new ConnectLogger({
    provider,
    source: "workspace.linkConnection",
    mixin: () => ({
      connectionId: connectionId,
      providerId: providerId,
      instanceId,
    }),
  });

  try {
    const proxy = provider.getProxy();

    if (isRestart) {
      proxy.updateChildChannelPort({ connectionId, port, providerId });

      logger.info("Connection Restarted", { appSdkVersion: sdkVersion });
    } else {
      proxy.addChildChannel({ connectionId, port, providerId });
      logger.info("Connection established", { appSdkVersion: sdkVersion });
    }
  } catch (error) {
    logger.error("An error occurred when linking  connection", {
      error,
      isRestart,
    });
  }
}
