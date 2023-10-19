import { ConnectClient, ConnectClientConfig } from "@amazon-connect/core";

import { AGENT_APP_NAMESPACE } from "../namespace";
import { AgentRequests } from "./agent-request";

export class AgentClient extends ConnectClient {
  constructor(config?: ConnectClientConfig) {
    super(AGENT_APP_NAMESPACE, config);
  }

  // requests
  async getEndpoints(
    queueARNs: string[] | string,
  ): Promise<Record<string, unknown>[]> {
    const data: Record<string, Record<string, unknown>[]> =
      await this.context.proxy.request(AgentRequests.getEndpoints, {
        queueARNs,
      });
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
    return data.Name;
  }

  async getState(): Promise<Record<string, unknown>> {
    const data: Record<
      string,
      Record<string, unknown>
    > = await this.context.proxy.request(AgentRequests.getState);
    return data.State;
  }

  async getRoutingProfile(): Promise<Record<string, unknown>> {
    const data: Record<
      string,
      Record<string, unknown>
    > = await this.context.proxy.request(AgentRequests.getRoutingProfile);
    return data.RoutingProfile;
  }

  async getChannelConcurrency(): Promise<Record<string, number>> {
    const data: Record<
      string,
      Record<string, number>
    > = await this.context.proxy.request(AgentRequests.getChannelConcurrency);
    return data.ChannelConcurrency;
  }

  async getExtension(): Promise<string | null> {
    const data: Record<string, string> = await this.context.proxy.request(
      AgentRequests.getExtension,
    );
    return data.Extension ?? null;
  }

  async getDialableCountries(): Promise<string[]> {
    const data: Record<string, string[]> = await this.context.proxy.request(
      AgentRequests.getDialableCountries,
    );
    return data.DialableCountries;
  }

  async getAllQueueARNs(): Promise<string[]> {
    const data: Record<string, string[]> = await this.context.proxy.request(
      AgentRequests.getAllQueueARNs,
    );
    return data.AllQueueARNs;
  }

  async getPermissions(): Promise<string[]> {
    const data: Record<string, string[]> = await this.context.proxy.request(
      AgentRequests.getPermissions,
    );
    return data.Permissions;
  }
}
