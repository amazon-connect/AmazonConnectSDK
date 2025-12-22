import { AmazonConnectProvider, ConnectLogger } from "@amazon-connect/core";
import { AppHostInitMessage } from "@amazon-connect/workspace-types";

import { SetIframeOptions } from "../app";
import { StateChangeResult } from "../types";
import { HostStateManager } from "./host-state-manager";
import { applyIFrameConfig, IFrameAttributeConfig } from "./iframe-config-utils";
import { isValidRegionalOriginPair } from "./is-valid-regional-origin-pair";
import { linkConnection } from "./link-connection";
import { isSupportedAppSource } from "./supported-app-sources";

export interface IFrameConfig {
  name: string;
  accessUrl: string;
  arn: string;
  iframeConfig?: IFrameAttributeConfig;
}

export interface IFrameRunnerParams {
  instanceId: string;
  config: IFrameConfig;
  connectionId: string;
  hostStateManager: HostStateManager;
  provider: AmazonConnectProvider;
}

export class IFrameRunner {
  private readonly instanceId: string;
  private readonly config: Readonly<IFrameConfig>;
  private readonly connectionId: string;
  private readonly provider: AmazonConnectProvider;

  private _iframe: HTMLIFrameElement | undefined;
  private messagePort: MessagePort | undefined;
  private readonly hostStateManager: HostStateManager;
  private readonly logger: ConnectLogger;
  private unexpectedPostMessageCount = 0;

  private postMessageHandler: (evt: MessageEvent<{ type?: string }>) => void;

  constructor({
    instanceId,
    config,
    connectionId,
    hostStateManager,
    provider,
  }: IFrameRunnerParams) {
    this.instanceId = instanceId;
    this.connectionId = connectionId;
    this.config = config;
    this.hostStateManager = hostStateManager;
    this.provider = provider;

    this.postMessageHandler = this.listenForInitialMessage.bind(this);

    this.logger = new ConnectLogger({
      source: "workspace.iframeRunner",
      provider: provider,
      mixin: () => ({
        instanceId: this.instanceId,
        appName: this.config.name,
        arn: this.config.arn,
        connectionId: this.connectionId,
      }),
    });
  }

  get iframe(): HTMLIFrameElement | undefined {
    return this._iframe;
  }

  // TODO Make this Async... verify state is provisioned
  setIFrame(iframe: HTMLIFrameElement, setIframeOptions?: SetIframeOptions) {
    if (this._iframe) {
      const msg = "Attempted to set iframe that already has iframe set";
      this.logger.error(msg);
      throw new Error(msg);
    }

    this._iframe = iframe;
    this.logger.info("Setting iframe with IFrame Runner");

    // Set loading status
    void this.hostStateManager.updateState("loading");

    window.addEventListener("message", this.postMessageHandler);

    // Set frames on props including the onLoaded event
    this._iframe.title = this.config.name;
    this._iframe.onload = () => {
      void this.hostStateManager.updateState("loaded");
    };
    this._iframe.src = this.config.accessUrl;
    
    // Apply iframe configuration using utility function
    applyIFrameConfig(iframe, this.config.iframeConfig, setIframeOptions);
  }

  private listenForInitialMessage(
    evt: MessageEvent<{
      source?: string;
      type?: string;
    }>,
  ) {
    if (!this._iframe) {
      const msg = "IFrame is not defined";
      this.logger.error(msg);
      throw new Error(msg);
    }

    if (evt.source === this._iframe?.contentWindow) {
      // Verify origin
      if (!this.verifyOrigin(evt.origin)) {
        // Log message is handled in the function with the actual reason for failure
        return;
      }

      // Verify message
      if (evt.data.type !== "connect-app-host-init") {
        if (!isSupportedAppSource(evt)) {
          this.unexpectedPostMessageCount++;

          if (this.unexpectedPostMessageCount <= 5) {
            this.logger.warn("Unexpected PostMessage from iframe. No action", {
              msg: evt.data,
              unexpectedPostMessageCount: this.unexpectedPostMessageCount,
            });
          }
        }
        return;
      }

      const isRestart = Boolean(this.messagePort);

      this.messagePort = evt.ports[0];
      if (!this.messagePort) {
        throw new Error("message port not found on event");
      }

      void this.linkConnection(
        evt as MessageEvent<AppHostInitMessage>,
        this.messagePort,
        isRestart,
      );
    }
  }

  private async linkConnection(
    evt: MessageEvent<AppHostInitMessage>,
    messagePort: MessagePort,
    isRestart: boolean,
  ): Promise<void> {
    if (isRestart) {
      const restartResult = await this.restart();

      if (!restartResult.success) {
        this.logger.error(
          "Failure when attempting to restart app. App will not work",
          {
            reason: restartResult.reason,
            state: restartResult.state,
          },
        );
        return;
      }
    }

    linkConnection({
      instanceId: this.instanceId,
      connectionId: this.connectionId,
      provider: this.provider,
      port: messagePort,
      hostInitMessage: evt.data,
      isRestart,
    });

    await this.hostStateManager.updateState("connected");
  }

  private verifyOrigin(eventOrigin: string): boolean {
    if (!eventOrigin) {
      this.logger.warn("No origin provided in event. Ignoring event");
      return false;
    }
    let expectedOrigin: string;
    try {
      expectedOrigin = new URL(this.config.accessUrl).origin;
    } catch (error) {
      this.logger.warn(
        "Unable to parse expected origin off app. Cannot match",
        {
          appLocation: this.config.accessUrl,
          eventOrigin,
          error,
        },
      );
      return false;
    }

    if (eventOrigin === expectedOrigin) {
      return true;
    }

    if (isValidRegionalOriginPair(eventOrigin, expectedOrigin)) {
      this.logger.debug("Global routing origin validation successful", {
        expectedOrigin,
        eventOrigin,
      });
      return true;
    }

    this.logger.warn("Origin of message did not match event. Ignoring", {
      expectedOrigin,
      eventOrigin,
    });

    return false;
  }

  private async restart(): Promise<StateChangeResult> {
    const restartResult = await this.hostStateManager.updateState("restarting");
    // Once an app restarts new post messages may be sent.
    // We reset the count to prevent the suppression of new warnings.
    this.unexpectedPostMessageCount = 0;

    if (!restartResult.success) {
      this.logger.warn("Attempting to restart. Retrying one time after 500ms", {
        reason: restartResult.reason,
        state: restartResult.state,
      });

      await new Promise((resolve) => setTimeout(resolve, 500));
      return await this.hostStateManager.updateState("restarting");
    }

    return restartResult;
  }
}
