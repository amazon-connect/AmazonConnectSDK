import { ConnectClient, ConnectClientConfig } from "@amazon-connect/core";

import { activityNamespace } from "./activity-namespace";
import {
  ExpirationWarningClearedHandler,
  ExpirationWarningHandler,
  SessionExtensionErrorHandler,
} from "./activity-types";
import { ActivityTopicKeys } from "./topic-keys";

export class SessionExpirationWarningClient extends ConnectClient {
  constructor(config: ConnectClientConfig) {
    super(activityNamespace, config);
  }

  onExpirationWarning(handler: ExpirationWarningHandler): void {
    this.context.proxy.subscribe(
      { key: ActivityTopicKeys.expirationWarning },
      handler,
    );
  }

  offExpirationWarning(handler: ExpirationWarningHandler): void {
    this.context.proxy.unsubscribe(
      { key: ActivityTopicKeys.expirationWarning },
      handler,
    );
  }

  onExpirationWarningCleared(handler: ExpirationWarningClearedHandler): void {
    this.context.proxy.subscribe(
      { key: ActivityTopicKeys.expirationWarningCleared },
      handler,
    );
  }

  offExpirationWarningCleared(handler: ExpirationWarningClearedHandler): void {
    this.context.proxy.unsubscribe(
      { key: ActivityTopicKeys.expirationWarningCleared },
      handler,
    );
  }

  onSessionExtensionError(handler: SessionExtensionErrorHandler): void {
    this.context.proxy.subscribe(
      { key: ActivityTopicKeys.sessionExtensionError },
      handler,
    );
  }

  offSessionExtensionError(handler: SessionExtensionErrorHandler): void {
    this.context.proxy.unsubscribe(
      { key: ActivityTopicKeys.sessionExtensionError },
      handler,
    );
  }
}
