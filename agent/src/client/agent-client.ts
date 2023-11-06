import { ConnectClient, ConnectClientConfig } from "@amazon-connect/core";

import { AgentStateChangeHandler, AgentTopic } from "../event/agent-events";
import { agentNamespace } from "../namespace";

export class AgentClient extends ConnectClient {
  constructor(config?: ConnectClientConfig | undefined) {
    super(agentNamespace, config);
  }

  onStateChange(handler: AgentStateChangeHandler): void {
    this.context.proxy.subscribe({ key: AgentTopic.STATE_CHANGE }, handler);
  }

  offStateChange(handler: AgentStateChangeHandler): void {
    this.context.proxy.unsubscribe({ key: AgentTopic.STATE_CHANGE }, handler);
  }
}
