import {
  ConnectClientConfig,
  ConnectClientConfigDeprecated,
  ConnectClientConfigOptional,
  ConnectClientWithOptionalConfig,
} from "@amazon-connect/core";

import { contactNamespace } from "./namespace";
import { AgentRoutes } from "./routes";
import { AgentTopicKey } from "./topic-keys";
import {
  AgentChannelConcurrency,
  AgentRoutingProfile,
  AgentState,
  AgentStateChangedHandler,
  AvailabilityStateChangedHandler,
  EnabledChannelListChangedHandler,
  GetAvailabilityStateResult,
  ListQuickConnectsOptions,
  ListQuickConnectsResult,
  NetworkConnectionStatusChanged,
  NetworkConnectionStatusChangedHandler,
  NextAvailabilityStateChangedHandler,
  Queue,
  QueueARN,
  RoutingProfileChangedHandler,
  SetAvailabilityStateResult,
} from "./types";

export class AgentClient extends ConnectClientWithOptionalConfig {
  /**
   * Creates a new AgentClient instance with the specified configuration.
   *
   * @param config - The configuration for the client. Can be provided as:
   *   - An AmazonConnectProvider instance directly: `new AgentClient(provider)`
   *   - An object with provider: `new AgentClient({ provider })`
   *
   * @example
   * ```typescript
   * // Recommended: Pass provider directly
   * const client = new AgentClient(provider);
   *
   * // Alternative: Pass as object
   * const client = new AgentClient({ provider });
   * ```
   */
  constructor(config: ConnectClientConfig);

  /**
   * @deprecated Calling AgentClient without AmazonConnectProvider is deprecated and will be removed in a future version.
   * Please provide an AmazonConnectProvider instance: `new AgentClient(provider)`
   */
  constructor(config?: ConnectClientConfigDeprecated);

  constructor(config: ConnectClientConfigOptional) {
    super(contactNamespace, config);
  }

  async getARN(): Promise<string> {
    const { ARN } = await this.context.proxy.request<{
      ARN: string;
    }>(AgentRoutes.getARN);

    return ARN;
  }

  async getName(): Promise<string> {
    const { name } = await this.context.proxy.request<{ name: string }>(
      AgentRoutes.getName,
    );

    return name;
  }

  /**
   * @deprecated Use `getAvailabilityState` instead. Will be removed in a future major version.
   */
  getState(): Promise<AgentState> {
    return this.context.proxy.request(AgentRoutes.getState);
  }

  getRoutingProfile(): Promise<AgentRoutingProfile> {
    return this.context.proxy.request(AgentRoutes.getRoutingProfile);
  }

  getChannelConcurrency(): Promise<AgentChannelConcurrency> {
    return this.context.proxy.request(AgentRoutes.getChannelConcurrency);
  }

  async getExtension(): Promise<string | undefined> {
    const { extension } = await this.context.proxy.request<{
      extension?: string;
    }>(AgentRoutes.getExtension);

    return extension;
  }
  /**
   * @deprecated Use `VoiceClient.listDialableCountries` instead.
   */
  async getDialableCountries(): Promise<string[]> {
    const { dialableCountries } = await this.context.proxy.request<{
      dialableCountries: string[];
    }>(AgentRoutes.getDialableCountries);

    return dialableCountries;
  }

  /**
   * @deprecated Use `onAvailabilityStateChanged` instead. Will be removed in a future major version.
   */
  onStateChanged(handler: AgentStateChangedHandler): void {
    this.context.proxy.subscribe({ key: AgentTopicKey.StateChanged }, handler);
  }

  /**
   * @deprecated Use `offAvailabilityStateChanged` instead. Will be removed in a future major version.
   */
  offStateChanged(handler: AgentStateChangedHandler): void {
    this.context.proxy.unsubscribe(
      { key: AgentTopicKey.StateChanged },
      handler,
    );
  }

  /**
   * Subscribes to connection health status change events.
   *
   * @param handler - The handler function to invoke when the connection status changes.
   */
  onNetworkConnectionStatusChanged(handler: NetworkConnectionStatusChangedHandler): void {
    this.context.proxy.subscribe(
      { key: AgentTopicKey.NetworkConnectionStatusChanged },
      handler,
    );
  }

  /**
   * Unsubscribes from connection health status change events.
   *
   * @param handler - The handler function to remove from the subscription.
   */
  offNetworkConnectionStatusChanged(handler: NetworkConnectionStatusChangedHandler): void {
    this.context.proxy.unsubscribe(
      { key: AgentTopicKey.NetworkConnectionStatusChanged },
      handler,
    );
  }

  /**
   * Returns the current connection health status.
   *
   * Use this to check the connection status at any point,
   * regardless of when event subscriptions were registered.
   *
   * @returns The current connection status and timestamp.
   */
  getNetworkConnectionStatus(): Promise<NetworkConnectionStatusChanged> {
    return this.context.proxy.request<NetworkConnectionStatusChanged>(
      AgentRoutes.getNetworkConnectionStatus,
    );
  }

  setAvailabilityState(
    agentStateARN: string,
  ): Promise<SetAvailabilityStateResult> {
    return this.context.proxy.request(AgentRoutes.setAvailabilityState, {
      agentStateARN,
    });
  }

  setAvailabilityStateByName(
    agentStateName: string,
  ): Promise<SetAvailabilityStateResult> {
    return this.context.proxy.request(AgentRoutes.setAvailabilityStateByName, {
      agentStateName,
    });
  }

  setOffline(): Promise<SetAvailabilityStateResult> {
    return this.context.proxy.request(AgentRoutes.setOffline, {});
  }

  listAvailabilityStates(): Promise<AgentState[]> {
    return this.context.proxy.request(AgentRoutes.listAvailabilityStates);
  }

  listQuickConnects(
    queueARNs: QueueARN | QueueARN[],
    options?: ListQuickConnectsOptions,
  ): Promise<ListQuickConnectsResult> {
    return this.context.proxy.request(AgentRoutes.listQuickConnects, {
      queueARNs,
      options,
    });
  }

  onEnabledChannelListChanged(handler: EnabledChannelListChangedHandler): void {
    this.context.proxy.subscribe(
      { key: AgentTopicKey.EnabledChannelListChanged },
      handler,
    );
  }

  offEnabledChannelListChanged(
    handler: EnabledChannelListChangedHandler,
  ): void {
    this.context.proxy.unsubscribe(
      { key: AgentTopicKey.EnabledChannelListChanged },
      handler,
    );
  }

  onRoutingProfileChanged(handler: RoutingProfileChangedHandler): void {
    this.context.proxy.subscribe(
      { key: AgentTopicKey.RoutingProfileChanged },
      handler,
    );
  }

  offRoutingProfileChanged(handler: RoutingProfileChangedHandler): void {
    this.context.proxy.unsubscribe(
      { key: AgentTopicKey.RoutingProfileChanged },
      handler,
    );
  }

  /**
   * Returns the agent's default outbound queue from their routing profile.
   */
  getDefaultOutboundQueue(): Promise<Queue> {
    return this.context.proxy.request(AgentRoutes.getDefaultOutboundQueue);
  }

  /**
   * Returns all queues in the agent's current routing profile.
   */
  getRoutingProfileQueues(): Promise<Queue[]> {
    return this.context.proxy.request(AgentRoutes.getRoutingProfileQueues);
  }

  /**
   * Returns the agent's current availability state, plus an optional `nextState`
   * if the backend has queued a pending state transition until contacts clear.
   */
  getAvailabilityState(): Promise<GetAvailabilityStateResult> {
    return this.context.proxy.request(AgentRoutes.getAvailabilityState);
  }

  /**
   * Returns the list of security profile permissions for the current agent.
   */
  async listSecurityProfilePermissions(): Promise<string[]> {
    const { permissions } = await this.context.proxy.request<{
      permissions: string[];
    }>(AgentRoutes.listSecurityProfilePermissions);

    return permissions;
  }

  /**
   * Subscribes to availability state change events.
   */
  onAvailabilityStateChanged(handler: AvailabilityStateChangedHandler): void {
    this.context.proxy.subscribe(
      { key: AgentTopicKey.AvailabilityStateChanged },
      handler,
    );
  }

  /**
   * Unsubscribes from availability state change events.
   */
  offAvailabilityStateChanged(handler: AvailabilityStateChangedHandler): void {
    this.context.proxy.unsubscribe(
      { key: AgentTopicKey.AvailabilityStateChanged },
      handler,
    );
  }

  /**
   * Subscribes to next-availability-state change events. Fires when the
   * agent has a pending state transition queued and that pending state changes.
   */
  onNextAvailabilityStateChanged(
    handler: NextAvailabilityStateChangedHandler,
  ): void {
    this.context.proxy.subscribe(
      { key: AgentTopicKey.NextAvailabilityStateChanged },
      handler,
    );
  }

  /**
   * Unsubscribes from next-availability-state change events.
   */
  offNextAvailabilityStateChanged(
    handler: NextAvailabilityStateChangedHandler,
  ): void {
    this.context.proxy.unsubscribe(
      { key: AgentTopicKey.NextAvailabilityStateChanged },
      handler,
    );
  }
}
