import { ConnectClient, ConnectClientConfig } from "@amazon-connect/core";

import { AgentStateChangeHandler, AgentTopic } from "./agent-events";
import {
  AgentChannelConcurrencyMap,
  AgentRequests,
  AgentRoutingProfile,
  AgentState,
} from "./agent-request";
import { contactNamespace } from "./namespace";

export class AgentClient extends ConnectClient {
  constructor(config?: ConnectClientConfig) {
    super(contactNamespace, config);
  }

  // requests
  async getARN(): Promise<string> {
    const data: Record<string, string> = await this.context.proxy.request(
      AgentRequests.getARN,
    );
    return data.ARN;
  }

  async getName(): Promise<string> {
    const data: Record<string, string> = await this.context.proxy.request(
      AgentRequests.getName,
    );
    return data.name;
  }

  async getState(): Promise<AgentState> {
    const data: AgentState = await this.context.proxy.request(
      AgentRequests.getState,
    );
    return data;
  }

  async getRoutingProfile(): Promise<AgentRoutingProfile> {
    const data: AgentRoutingProfile = await this.context.proxy.request(
      AgentRequests.getRoutingProfile,
    );
    return data;
  }

  async getChannelConcurrency(): Promise<AgentChannelConcurrencyMap> {
    const data: AgentChannelConcurrencyMap = await this.context.proxy.request(
      AgentRequests.getChannelConcurrency,
    );
    return data;
  }

  async getExtension(): Promise<string | undefined> {
    const data: Record<string, string> = await this.context.proxy.request(
      AgentRequests.getExtension,
    );
    return data.extension;
  }

  async getDialableCountries(): Promise<string[]> {
    const data: Record<string, string[]> = await this.context.proxy.request(
      AgentRequests.getDialableCountries,
    );
    return data.dialableCountries;
  }

  // lifecycle
  onStateChange(handler: AgentStateChangeHandler): void {
    this.context.proxy.subscribe({ key: AgentTopic.STATE_CHANGE }, handler);
  }

  offStateChange(handler: AgentStateChangeHandler): void {
    this.context.proxy.unsubscribe({ key: AgentTopic.STATE_CHANGE }, handler);
  }
}
