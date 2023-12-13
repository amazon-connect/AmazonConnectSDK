import { ConnectClient, ConnectClientConfig } from "@amazon-connect/core";

import { contactNamespace } from "./namespace";
import { AgentRoutes } from "./routes";
import { AgentTopicKey } from "./topic-keys";
import {
  AgentChannelConcurrency,
  AgentRoutingProfile,
  AgentState,
  AgentStateChangedHandler,
} from "./types";

export class AgentClient extends ConnectClient {
  constructor(config?: ConnectClientConfig) {
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

  async getDialableCountries(): Promise<string[]> {
    const { dialableCountries } = await this.context.proxy.request<{
      dialableCountries: string[];
    }>(AgentRoutes.getDialableCountries);

    return dialableCountries;
  }

  onStateChange(handler: AgentStateChangedHandler): void {
    this.context.proxy.subscribe({ key: AgentTopicKey.StateChanged }, handler);
  }

  offStateChange(handler: AgentStateChangedHandler): void {
    this.context.proxy.unsubscribe(
      { key: AgentTopicKey.StateChanged },
      handler,
    );
  }
}
