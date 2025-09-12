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
  ListQuickConnectsOptions,
  ListQuickConnectsResult,
  QueueARN,
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

  onStateChanged(handler: AgentStateChangedHandler): void {
    this.context.proxy.subscribe({ key: AgentTopicKey.StateChanged }, handler);
  }

  offStateChanged(handler: AgentStateChangedHandler): void {
    this.context.proxy.unsubscribe(
      { key: AgentTopicKey.StateChanged },
      handler,
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
}
