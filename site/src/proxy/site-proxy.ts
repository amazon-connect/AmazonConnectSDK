import {
  AmazonConnectConfig,
  AmazonConnectProvider,
  ConnectLogger,
  Proxy,
  UpstreamMessage,
} from "@amazon-connect/core";

export abstract class SiteProxy<
  T extends AmazonConnectConfig,
> extends Proxy<T> {
  protected readonly proxyLogger: ConnectLogger;
  protected messagePort: MessagePort | undefined;
  private readonly postMessageHandler: (
    evt: MessageEvent<{ type?: string }>,
  ) => void;

  public readonly instanceUrl: string;

  /**
   * Creates a new SiteProxy instance.
   *
   * @overload
   * @param provider - Provider with config containing instanceUrl
   *
   * @overload
   * @param provider - Provider with base config
   * @param instanceUrl - The Amazon Connect instance URL
   *
   * @example
   * ```typescript
   * // First overload: instanceUrl in config
   * const provider1 = new AmazonConnectProvider({
   *   instanceUrl: "https://myinstance.awsapps.com/connect"
   * });
   * const proxy1 = new SiteProxy(provider1);
   *
   * // Second overload: instanceUrl as separate parameter
   * const provider2 = new AmazonConnectProvider({});
   * const proxy2 = new SiteProxy(provider2, "https://myinstance.awsapps.com/connect");
   * ```
   */
  constructor(provider: AmazonConnectProvider<T & { instanceUrl: string }>);
  constructor(provider: AmazonConnectProvider<T>, instanceUrl: string);
  constructor(
    provider:
      | AmazonConnectProvider<T>
      | AmazonConnectProvider<T & { instanceUrl: string }>,
    instanceUrl?: string,
  ) {
    super(provider);

    if (instanceUrl !== undefined) {
      // Two-parameter constructor: use the explicit instanceUrl parameter
      this.instanceUrl = instanceUrl;
    } else {
      // Single-parameter constructor: get instanceUrl from config
      this.instanceUrl = (
        provider as AmazonConnectProvider<T & { instanceUrl: string }>
      ).config.instanceUrl;
    }

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
      expectedOrigin = new URL(this.instanceUrl).origin;
    } catch (error) {
      this.proxyLogger.error(
        "Unable to parse expected origin from instanceUrl. Cannot match",
        {
          error,
          eventOrigin,
          instanceUrl: this.instanceUrl,
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
