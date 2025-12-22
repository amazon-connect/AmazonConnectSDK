import { AmazonConnectProvider, ConnectLogger } from "@amazon-connect/core";
import { AppHostInitMessage } from "@amazon-connect/workspace-types";

export function linkAppConnection({
  appInstanceId,
  connectionId,
  provider,
  port,
  hostInitMessage,
  isRestart,
}: {
  appInstanceId: string;
  connectionId: string;
  provider: AmazonConnectProvider;
  port: MessagePort;
  hostInitMessage: AppHostInitMessage;
  isRestart: boolean;
}): void {
  const { providerId, sdkVersion } = hostInitMessage;

  const logger = new ConnectLogger({
    provider,
    source: "workspace.linkAppConnection",
    mixin: () => ({
      connectionId: connectionId,
      providerId: providerId,
      appInstanceId,
    }),
  });

  try {
    const proxy = provider.getProxy();

    if (isRestart) {
      proxy.updateChildChannelPort({ connectionId, port, providerId });

      logger.info("App Connection Restarted", { appSdkVersion: sdkVersion });
    } else {
      proxy.addChildChannel({ connectionId, port, providerId });
      logger.info("App Connection established", { appSdkVersion: sdkVersion });
    }
  } catch (error) {
    logger.error("An error occurred when linking app connection", {
      error,
      isRestart,
    });
  }
}
