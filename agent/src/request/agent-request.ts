import { Queue } from "./contact-request";

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
  readonly endpointARN: string;
  readonly endpointId: string;
  readonly type: EndpointType;
  readonly name: string;
  readonly phoneNumber: string;
  readonly agentLogin: string;
  readonly queue: string;
};

export enum AgentStateType {
  INIT = "init",
  ROUTABLE = "routable",
  NOT_ROUTABLE = "not_routable",
  OFFLINE = "offline",
}

export type AgentState = {
  readonly agentStateARN: string | null;
  readonly name: string;
  readonly startTimestamp: Date;
  readonly type: AgentStateType;
};

export enum ChannelType {
  VOICE = "VOICE",
  CHAT = "CHAT",
  TASK = "TASK",
}

export type AgentChannelConcurrencyMap = {
  readonly [key: string]: number;
};

export type AgentRoutingProfile = {
  readonly channelConcurrencyMap: AgentChannelConcurrencyMap;
  readonly defaultOutboundQueue: Queue;
  readonly name: string;
  readonly queues: Queue[];
  readonly routingProfileARN: string;
  readonly routingProfileId: string;
};
