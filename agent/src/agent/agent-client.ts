import { ConnectClient, ConnectClientConfig } from "@amazon-connect/core";

import { AGENT_APP_NAMESPACE } from "../namespace";
import {
  AgentChannelConcurrencyMap,
  AgentRequests,
  AgentRoutingProfile,
  AgentState,
  Endpoint,
} from "./agent-request";

export class AgentClient extends ConnectClient {
  constructor(config?: ConnectClientConfig) {
    super(AGENT_APP_NAMESPACE, config);
  }

  // requests
  async getEndpoints(queueARNs: string[] | string): Promise<Endpoint[]> {
    const data: Record<string, Endpoint[]> = await this.context.proxy.request(
      AgentRequests.getEndpoints,
      {
        queueARNs,
      },
    );
    return data.endpoints;
  }

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

  async getExtension(): Promise<string | null> {
    const data: Record<string, string> = await this.context.proxy.request(
      AgentRequests.getExtension,
    );
    return data.extension ?? null;
  }

  async getDialableCountries(): Promise<string[]> {
    const data: Record<string, string[]> = await this.context.proxy.request(
      AgentRequests.getDialableCountries,
    );
    return data.dialableCountries;
  }

  async getAllQueueARNs(): Promise<string[]> {
    const data: Record<string, string[]> = await this.context.proxy.request(
      AgentRequests.getAllQueueARNs,
    );
    return data.allQueueARNs;
  }

  async getPermissions(): Promise<string[]> {
    const data: Record<string, string[]> = await this.context.proxy.request(
      AgentRequests.getPermissions,
    );
    return data.permissions;
  }
}
