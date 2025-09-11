import { ConnectLogger, LogProvider } from "../logging";
import {
  ChildConnectionCloseMessage,
  ChildConnectionEnabledUpstreamMessage,
  ChildDownstreamMessage,
  ChildUpstreamMessage,
  sanitizeDownstreamMessage,
} from "../messaging";
import {
  ComponentChannelDownstreamSender,
  ComponentChannelUpstreamHandlerSetter,
} from "./component-channel-types";

/**
 * Internal data structure representing a communication channel.
 * Contains provider ID and discriminated union for iframe vs component channels.
 */
type ChannelData = {
  /** UUID of the provider that owns this channel */
  providerId: string;
} & (
  | {
      /** Channel type using browser MessagePort API for iframe communication */
      type: "iframe";
      /** MessagePort instance for communication */
      port: MessagePort;
      /** Event handler for incoming messages from the port */
      handler: (message: MessageEvent<unknown>) => void;
    }
  | {
      /** Channel type using direct function calls for component communication */
      type: "component";
      /** Function to send messages downstream to the child entity */
      sendDownstreamMessage: ComponentChannelDownstreamSender;
      /** Function to set up handler for upstream messages from child entity */
      setUpstreamMessageHandler: ComponentChannelUpstreamHandlerSetter;
    }
);

/**
 * Parameters for adding a new communication channel.
 * Supports both iframe and component channel types through discriminated union.
 */
export type AddChannelParams = {
  /** UUID of the provider that owns this channel */
  providerId: string;
  /** UUID identifier for this specific channel connection */
  connectionId: string;
} & (
  | {
      /** Channel type using browser MessagePort API for iframe communication */
      type: "iframe";
      /** MessagePort instance for communication with child entity */
      port: MessagePort;
    }
  | {
      /** Channel type using direct function calls for component communication */
      type: "component";
      /** Function to send messages downstream to the child entity */
      sendDownstreamMessage: ComponentChannelDownstreamSender;
      /** Function to set up handler for upstream messages from child entity */
      setUpstreamMessageHandler: ComponentChannelUpstreamHandlerSetter;
    }
);

/**
 * Parameters for updating an existing MessagePort channel.
 * Only applicable to MessagePort channels - Direct channels cannot be updated.
 */
export type UpdateChannelPortParams = {
  /** UUID identifier for the channel connection to update */
  connectionId: string;
  /** New MessagePort instance to replace the existing one */
  port: MessagePort;
  /** UUID of the provider that owns this channel */
  providerId: string;
};

/**
 * Manages communication channels between the proxy and child entities.
 *
 * The ChannelManager supports two types of communication channels:
 * 1. Iframe channels - Use browser MessagePort API for communication across different execution contexts
 * 2. Component channels - Use direct function calls when both entities exist in the same execution context
 *
 * Key responsibilities:
 * - Adding and removing child channels
 * - Routing downstream messages from proxy to child entities
 * - Relaying upstream messages from child entities back to the proxy
 * - Managing MessagePort lifecycle (opening, closing, cleanup)
 * - Validating provider IDs to ensure secure message routing
 *
 * @example Iframe Channel
 * ```typescript
 * const { port1, port2 } = new MessageChannel();
 * channelManager.addChannel({
 *   connectionId: "child-uuid",
 *   providerId: "provider-uuid",
 *   type: "iframe",
 *   port: port1
 * });
 * // port2 gets transferred to child entity
 * ```
 *
 * @example Component Channel
 * ```typescript
 * channelManager.addChannel({
 *   connectionId: "child-uuid",
 *   providerId: "provider-uuid",
 *   type: "component",
 *   sendDownstreamMessage: (msg) => childEntity.receive(msg),
 *   setUpstreamMessageHandler: (handler) => childEntity.onUpstream = handler
 * });
 * ```
 */
export class ChannelManager {
  private readonly provider: LogProvider;
  private readonly relayChildUpstreamMessage: (
    message: ChildUpstreamMessage,
  ) => void;
  private readonly channels: Map<string, ChannelData>;

  private readonly logger: ConnectLogger;

  constructor(
    provider: LogProvider,
    relayChildUpstreamMessage: (message: ChildUpstreamMessage) => void,
  ) {
    this.provider = provider;
    this.relayChildUpstreamMessage = relayChildUpstreamMessage;
    this.channels = new Map();

    this.logger = new ConnectLogger({
      provider,
      source: "childConnectionManager",
    });
  }

  /**
   * Adds a new communication channel for a child entity.
   *
   * Supports both iframe and component channel types. For iframe channels,
   * sets up message event listeners and starts the port. For component channels,
   * configures the upstream message handler. Both types send a "childConnectionReady"
   * message upstream to notify the proxy that the channel is established.
   *
   * @param params - Channel configuration parameters
   * @param params.connectionId - UUID identifier for this channel connection
   * @param params.providerId - UUID of the provider that owns this channel
   * @param params.type - Channel type: "iframe" or "component"
   *
   * @example Iframe Channel
   * ```typescript
   * const { port1, port2 } = new MessageChannel();
   * channelManager.addChannel({
   *   connectionId: "550e8400-e29b-41d4-a716-446655440000",
   *   providerId: "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
   *   type: "iframe",
   *   port: port1
   * });
   * ```
   *
   * @example Component Channel
   * ```typescript
   * channelManager.addChannel({
   *   connectionId: "550e8400-e29b-41d4-a716-446655440001",
   *   providerId: "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
   *   type: "component",
   *   sendDownstreamMessage: (msg) => childEntity.receive(msg),
   *   setUpstreamMessageHandler: (handler) => childEntity.onUpstream = handler
   * });
   * ```
   */
  addChannel(params: AddChannelParams): void {
    const { connectionId } = params;

    if (this.channels.has(connectionId)) {
      this.logger.error(
        "Attempted to add child connection that already exists. No action",
        {
          connectionId,
        },
      );
      return;
    }

    if (params.type === "iframe") {
      this.setupIframe(params);
    } else {
      this.setupComponent(params);
    }

    this.logger.debug("Child channel added", {
      connectionId,
      type: params.type,
    });
  }

  /**
   * Updates an existing MessagePort channel with a new MessagePort.
   *
   * This method is only applicable to MessagePort channels. Direct channels cannot
   * be updated and will result in an error. The old MessagePort is properly cleaned up
   * (event listeners removed, port closed) before the new port is configured.
   *
   * @param params - Update parameters
   * @param params.connectionId - UUID identifier for the channel to update
   * @param params.port - New MessagePort instance to replace the existing one
   * @param params.providerId - UUID of the provider that owns this channel
   *
   * @throws Logs error if connectionId doesn't exist or channel is Direct type
   *
   * @example
   * ```typescript
   * const { port1, port2 } = new MessageChannel();
   * channelManager.updateChannelPort({
   *   connectionId: "550e8400-e29b-41d4-a716-446655440000",
   *   port: port1,
   *   providerId: "6ba7b810-9dad-11d1-80b4-00c04fd430c8"
   * });
   * ```
   */
  updateChannelPort(params: UpdateChannelPortParams): void {
    const { connectionId } = params;

    const existingChannel = this.channels.get(connectionId);

    if (!existingChannel) {
      this.logger.error(
        "Attempted to update child connection that does not exist No action",
        {
          connectionId,
        },
      );
      return;
    }

    if (existingChannel.type === "component") {
      this.logger.error(
        "Attempted to update a component channel connection as MessagePort. This is not supported.",
        {
          connectionId,
        },
      );
      return;
    }

    const originalChannel = existingChannel;
    originalChannel.port.onmessage = null;
    originalChannel.port.close();

    const setupParams: AddChannelParams = {
      ...params,
      type: "iframe",
    };
    this.setupIframe(setupParams);

    this.logger.info("Updated child port", { connectionId });
  }

  private setupIframe(params: AddChannelParams & { type: "iframe" }): void {
    const { connectionId, port, providerId } = params;
    const handler = this.createMessageHandler(connectionId, providerId);

    port.addEventListener("message", handler);
    port.start();

    this.channels.set(connectionId, {
      type: "iframe",
      port,
      handler,
      providerId,
    });

    this.relayChildUpstreamMessage({
      type: "childUpstream",
      connectionId,
      sourceProviderId: providerId,
      parentProviderId: this.provider.id,
      message: {
        type: "childConnectionReady",
      },
    });
  }

  private setupComponent(
    params: AddChannelParams & { type: "component" },
  ): void {
    const {
      connectionId,
      providerId,
      sendDownstreamMessage,
      setUpstreamMessageHandler,
    } = params;

    const upstreamHandler = (
      message: ChildConnectionEnabledUpstreamMessage,
    ) => {
      this.relayChildUpstreamMessage({
        type: "childUpstream",
        sourceProviderId: providerId,
        parentProviderId: this.provider.id,
        connectionId,
        message,
      });
    };

    setUpstreamMessageHandler(upstreamHandler);

    this.channels.set(connectionId, {
      type: "component",
      providerId,
      sendDownstreamMessage,
      setUpstreamMessageHandler,
    });

    this.relayChildUpstreamMessage({
      type: "childUpstream",
      connectionId,
      sourceProviderId: providerId,
      parentProviderId: this.provider.id,
      message: {
        type: "childConnectionReady",
      },
    });
  }

  /**
   * Routes a downstream message from the proxy to the appropriate child channel.
   *
   * Validates that the target channel exists and that the provider ID matches
   * (for security). For MessagePort channels, uses postMessage(). For Direct
   * channels, calls the sendDownstreamMessage function.
   *
   * @param params - Downstream message parameters
   * @param params.connectionId - UUID of the target channel
   * @param params.message - The message to send to the child entity
   * @param params.targetProviderId - Expected provider ID for validation
   *
   * @example
   * ```typescript
   * channelManager.handleDownstreamMessage({
   *   connectionId: "550e8400-e29b-41d4-a716-446655440000",
   *   message: { type: "request", data: "some data" },
   *   targetProviderId: "6ba7b810-9dad-11d1-80b4-00c04fd430c8"
   * });
   * ```
   */
  handleDownstreamMessage({
    connectionId,
    message,
    targetProviderId,
  }: ChildDownstreamMessage): void {
    const channelData = this.channels.get(connectionId);

    if (!channelData) {
      this.logger.warn(
        "Attempted to route downstream message to child channel that does not exist",
        { connectionId, message: sanitizeDownstreamMessage(message) },
      );
      return;
    }

    const { providerId } = channelData;

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

    if (channelData.type === "iframe") {
      channelData.port.postMessage(message);
    } else {
      channelData.sendDownstreamMessage(message);
    }
  }

  /**
   * Handles closing a child channel and performs appropriate cleanup.
   *
   * For MessagePort channels, removes event listeners and closes the port.
   * For Direct channels, simply removes the channel from the internal map
   * since no port cleanup is needed. The channel is always removed from
   * the channels map regardless of type.
   *
   * @param params - Close message parameters
   * @param params.connectionId - UUID of the channel to close
   *
   * @example
   * ```typescript
   * channelManager.handleCloseMessage({
   *   connectionId: "550e8400-e29b-41d4-a716-446655440000"
   * });
   * ```
   */
  handleCloseMessage({ connectionId }: ChildConnectionCloseMessage): void {
    const channelData = this.channels.get(connectionId);

    if (!channelData) {
      this.logger.warn("Attempted to close child channel that was not found", {
        connectionId,
      });
      return;
    }

    if (channelData.type === "iframe") {
      const { port, handler } = channelData;
      port.removeEventListener("message", handler);
      port.close();
    }
    // For component channels, no cleanup of ports/handlers is needed

    this.channels.delete(connectionId);

    this.logger.debug("Removed child channel", {
      connectionId,
      type: channelData.type,
    });
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
