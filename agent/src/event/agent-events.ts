import { SubscriptionHandler } from "@amazon-connect/core";

export enum AgentTopic {
  STATE_CHANGE = "agent/stateChange",
}

export type AgentStateChangeEventData = {
  state: string;
  previous: {
    state: string;
  };
};

export type AgentStateChangeHandler =
  SubscriptionHandler<AgentStateChangeEventData>;
