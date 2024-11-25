import { ConnectLogger, LogProvider } from "../logging";
import {
  ChildConnectionCloseMessage,
  ChildConnectionEnabledUpstreamMessage,
  ChildDownstreamMessage,
  ChildUpstreamMessage,
  sanitizeDownstreamMessage,
} from "../messaging";

type MessagePortData = {
  port: MessagePort;
  handler: (message: MessageEvent<unknown>) => void;
  providerId: string;
};

export type AddChannelParams = {
  connectionId: string;
  port: MessagePort;
  providerId: string;
};

export class ChannelManager {
  private readonly provider: LogProvider;
  private readonly relayChildUpstreamMessage: (
    message: ChildUpstreamMessage,
  ) => void;
  private readonly messagePorts: Map<string, MessagePortData>;

  private readonly logger: ConnectLogger;

  constructor(
    provider: LogProvider,
    relayChildUpstreamMessage: (message: ChildUpstreamMessage) => void,
  ) {
    this.provider = provider;
    this.relayChildUpstreamMessage = relayChildUpstreamMessage;
    this.messagePorts = new Map();

    this.logger = new ConnectLogger({
      provider,
      source: "childConnectionManager",
    });
  }

  addChannel({ connectionId, port, providerId }: AddChannelParams): void {
    if (this.messagePorts.has(connectionId)) {
      this.logger.error(
        "Attempted to add child connection that already exists. No action",
        {
          connectionId,
        },
      );
      return;
    }

    const handler = this.createMessageHandler(connectionId, providerId);

    port.addEventListener("message", handler);
    port.start();

    this.messagePorts.set(connectionId, { port, handler, providerId });

    this.relayChildUpstreamMessage({
      type: "childUpstream",
      connectionId,
      sourceProviderId: providerId,
      parentProviderId: this.provider.id,
      message: {
        type: "childConnectionReady",
      },
    });

    this.logger.debug("Child port added", { connectionId });
  }

  handleDownstreamMessage({
    connectionId,
    message,
    targetProviderId,
  }: ChildDownstreamMessage): void {
    const messagePortData = this.messagePorts.get(connectionId);

    if (!messagePortData) {
      this.logger.warn(
        "Attempted to route downstream message to child message port that does not exist",
        { connectionId, message: sanitizeDownstreamMessage(message) },
      );
      return;
    }

    const { port, providerId } = messagePortData;

    // Older versions of the SDK do not provide a provider id. This
    // check is ignored for versions without a providerId.
    if (providerId && providerId !== targetProviderId) {
      this.logger.error(
        "Downstream target message did not match target provider id. Not sending message.",
        {
          connectionId,
          targetProviderId,
          actualProviderId: providerId,
          message: sanitizeDownstreamMessage(message),
        },
      );
      return;
    }

    port.postMessage(message);
  }

  handleCloseMessage({ connectionId }: ChildConnectionCloseMessage): void {
    const messagePortData = this.messagePorts.get(connectionId);

    if (!messagePortData) {
      this.logger.warn(
        "Attempted to close child message port that was not found",
        { connectionId },
      );
      return;
    }

    const { port, handler } = messagePortData;

    port.removeEventListener("message", handler);
    port.close();
    this.messagePorts.delete(connectionId);

    this.logger.debug("Removed child message channel", { connectionId });
  }

  private createMessageHandler(
    connectionId: string,
    providerId: string,
  ): (message: MessageEvent<unknown>) => void {
    return (message) =>
      this.relayChildUpstreamMessage({
        type: "childUpstream",
        sourceProviderId: providerId,
        parentProviderId: this.provider.id,
        connectionId,
        message: message.data as ChildConnectionEnabledUpstreamMessage,
      });
  }
}
