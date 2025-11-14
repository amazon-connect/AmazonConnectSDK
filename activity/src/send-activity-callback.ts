import { AmazonConnectProvider, ConnectLogger } from "@amazon-connect/core";
import debounce from "lodash.debounce";

import { activityNamespace } from "./activity-namespace";
import { ActivityRoutes } from "./routes";

const DEFAULT_DEBOUNCE_TIME: number = 1000;

let loggerCount: number = 0;
let logger: ConnectLogger;
let debouncedSendActivity: () => void;

/**
 * Sends activity signals to keep agent active
 * @param provider
 */
export function sendActivity(provider: AmazonConnectProvider): void {
  if (!debouncedSendActivity) {
    logger = new ConnectLogger({
      provider,
      source: activityNamespace,
    });
    logger.debug("Creating activity callback..");
    const action: () => void = () => {
      void sendActivityRequest({ provider });
    };
    debouncedSendActivity = debounce(action, DEFAULT_DEBOUNCE_TIME, {
      leading: true,
      trailing: false,
    });
  }
  debouncedSendActivity();
}

async function sendActivityRequest({
  provider,
}: {
  provider: AmazonConnectProvider;
}): Promise<void> {
  try {
    await provider
      .getProxy()
      .request(activityNamespace, ActivityRoutes.sendActivity);
    loggerCount = 0;
  } catch (error) {
    if (loggerCount < 5) {
      logger.error("Failed to record agent activity", {
        error,
        errorCount: loggerCount,
      });
      loggerCount++;
    }
  }
}
