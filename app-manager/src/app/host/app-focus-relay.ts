import {
  AmazonConnectProvider,
  ConnectError,
  SubscriptionHandlerRelay,
} from "@amazon-connect/core";

import { AppTopicKeys } from "../../topic-keys";
import { workspaceNamespace } from "../../workspace-namespace";
import {
  AppFocused,
  AppFocusedHandler,
  AppInstanceFocused,
  AppInstanceFocusedHandler,
} from "../app-event-types";
import { AppHost } from "./app-host";

export type AppFocusRelayParams = {
  provider: AmazonConnectProvider;
} & (
  | { host: AppHost }
  | { getHost: (instanceId: string) => AppHost | undefined }
);

export class AppFocusRelay extends SubscriptionHandlerRelay<
  AppInstanceFocusedHandler,
  AppFocusedHandler
> {
  private readonly getHost: (instanceId: string) => AppHost;

  constructor(params: AppFocusRelayParams) {
    super(params.provider);

    this.getHost = (instanceId) => {
      const host = "host" in params ? params.host : params.getHost(instanceId);

      if (!host) {
        throw new ConnectError({
          namespace: workspaceNamespace,
          errorKey: "focusAppNotFound",
          reason: "Unable to find app host for focused app",
          details: { instanceId },
        });
      }

      if (host.instanceId !== instanceId) {
        throw new ConnectError({
          namespace: workspaceNamespace,
          errorKey: "focusAppHostMismatch",
          reason: "Mismatch between provided appHost and event",
          details: {
            eventInstanceId: instanceId,
            appHostInstanceId: host.instanceId,
          },
        });
      }

      return host;
    };
  }

  protected namespace: string = workspaceNamespace;
  protected topicKey: string = AppTopicKeys.Focused;

  protected translate(internalEvent: AppInstanceFocused): Promise<AppFocused> {
    const evt: AppFocused = {
      host: this.getHost(internalEvent.instanceId),
      focusRequestTime: internalEvent.focusRequestTime,
    };

    return Promise.resolve(evt);
  }
}
