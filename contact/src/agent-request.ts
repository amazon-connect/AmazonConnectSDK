export enum AgentRequests {
  getARN = "agent/getARN",
  getName = "agent/getName",
  getState = "agent/getState",
  getRoutingProfile = "agent/getRoutingProfile",
  getChannelConcurrency = "agent/getChannelConcurrency",
  getExtension = "agent/getExtension",
  getDialableCountries = "agent/getDialableCountries",
}

export enum AgentStateType {
  INIT = "init",
  ROUTABLE = "routable",
  NOT_ROUTABLE = "not_routable",
  OFFLINE = "offline",
}

export type AgentState = {
  agentStateARN: string | null;
  name: string;
  startTimestamp: Date;
  type: AgentStateType;
};

export type AgentChannelConcurrencyMap = {
  [key: string]: number;
};

export type AgentRoutingProfile = {
  channelConcurrencyMap: AgentChannelConcurrencyMap;
  defaultOutboundQueue: Queue;
  name: string;
  queues: Queue[];
  routingProfileARN: string;
  routingProfileId: string;
};

export type Queue = {
  name: string;
  queueARN: string;
  queueId: string;
};
