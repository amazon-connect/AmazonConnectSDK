export enum AgentRequests {
  getEndpoints = "agent/getEndpoints",
  getARN = "agent/getARN",
  getName = "agent/getName",
  getState = "agent/getState",
  getRoutingProfile = "agent/getRoutingProfile",
  getChannelConcurrency = "agent/getChannelConcurrency",
  getExtension = "agent/getExtension",
  getDialableCountries = "agent/getDialableCountries",
  getAllQueueARNs = "agent/getAllQueueARNs",
  getPermissions = "agent/getPermissions",
}

export enum EndpointType {
  PHONE_NUMBER = "phone_number",
  AGENT = "agent",
  QUEUE = "queue",
}

export type Endpoint = {
  endpointARN: string;
  endpointId: string;
  type: EndpointType;
  name: string;
  phoneNumber: string;
  queue: string;
};

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

export enum ChannelType {
  VOICE = "VOICE",
  CHAT = "CHAT",
  TASK = "TASK",
}

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
