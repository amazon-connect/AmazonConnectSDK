import {
  AmazonConnectConfig,
  AmazonConnectProvider,
  ConnectLogger,
  Proxy,
  UpstreamMessage,
} from "@amazon-connect/core";

export abstract class SiteProxy<
  T extends AmazonConnectConfig & { instanceUrl: string },
> extends Proxy<T> {
  protected readonly proxyLogger: ConnectLogger;
  protected messagePort: MessagePort | undefined;
  private readonly postMessageHandler: (
    evt: MessageEvent<{ type?: string }>,
  ) => void;

  constructor(provider: AmazonConnectProvider<T>) {
    super(provider);

    this.postMessageHandler = this.listenForInitialMessage.bind(this);

    this.proxyLogger = new ConnectLogger({
      source: "siteProxy",
      provider,
    });
  }

  protected initProxy(): void {
    this.status.update({ status: "connecting" });
    window.addEventListener("message", this.postMessageHandler);
  }

  protected resetConnection(reason: string): void {
    super.resetConnection(reason);
    this.messagePort = undefined;
    this.status.update({ status: "connecting" });
  }

  protected sendMessageToSubject(message: UpstreamMessage): void {
    if (this.messagePort) {
      this.messagePort.postMessage(message);
    } else {
      // This could ever be reached if the setup did not occur and the
      // acknowledge process was initiated by non supported means.
      this.proxyLogger.error(
        "Failed to send UpstreamMessage. MessagePort not set",
        {
          messageType: message.type,
        },
      );
    }
  }

  protected addContextToLogger(): Record<string, unknown> {
    return {};
  }

  protected abstract verifyEventSource(
    evt: MessageEvent<{ type?: string }>,
  ): boolean;

  protected abstract invalidInitMessageHandler(data: { type?: string }): void;

  private listenForInitialMessage(evt: MessageEvent<{ type?: string }>) {
    // Verify origin
    if (!this.verifyOrigin(evt)) {
      // Log message is handled in the function with the actual reason for failure
      return;
    }

    if (this.verifyEventSource(evt)) {
      // Verify message
      if (evt.data.type !== "cross-domain-adapter-init") {
        this.invalidInitMessageHandler(evt.data);

        return;
      }

      // When a message port already exists
      if (this.messagePort) {
        this.resetConnection("Subsequent Message Port Detected");
        this.proxyLogger.info(
          "Subsequent message port received. Resetting connection",
        );
      }

      this.messagePort = evt.ports[0];
      if (!this.messagePort) {
        throw new Error("message port not provided by iframe");
      }
      this.messagePort.onmessage = this.consumerMessageHandler.bind(this);

      this.status.update({ status: "initializing" });

      this.messagePort.postMessage({
        type: "cross-domain-site-ready",
        providerId: this.provider.id,
      });

      this.proxyLogger.debug("CDA Post message handler removed");
    }
  }

  private verifyOrigin(evt: MessageEvent<{ type?: string }>): boolean {
    const eventOrigin = evt.origin;

    if (!eventOrigin) {
      this.proxyLogger.warn("No origin provided in event. Ignoring event.");
      return false;
    }

    let expectedOrigin: string;

    try {
      expectedOrigin = new URL(this.provider.config.instanceUrl).origin;
    } catch (error) {
      this.proxyLogger.error(
        "Unable to parse expected origin from config. Cannot match",
        {
          error,
          eventOrigin,
          configInstanceUrl: this.provider.config.instanceUrl,
        },
        { duplicateMessageToConsole: true },
      );
      return false;
    }

    if (eventOrigin !== expectedOrigin) {
      if (evt.data.type === "cross-domain-adapter-init") {
        // Only logging for the specific handshake message. Otherwise just ignore
        this.proxyLogger.warn(
          "Origin of message with type 'cross-domain-adapter-init' did not expected instance value. Ignoring",
          {
            expectedOrigin,
            eventOrigin,
          },
          { duplicateMessageToConsole: true },
        );
      }

      return false;
    }

    return true;
  }
}
