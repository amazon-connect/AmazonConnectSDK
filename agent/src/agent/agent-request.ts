import { Queue } from "../contact/contact-request";

const agentRoutePrefix = "agent/";

export enum AgentRequests {
  getEndpoints = agentRoutePrefix + "getEndpoints",
  getARN = agentRoutePrefix + "getARN",
  getName = agentRoutePrefix + "getName",
  getState = agentRoutePrefix + "getState",
  getRoutingProfile = agentRoutePrefix + "getRoutingProfile",
  getChannelConcurrency = agentRoutePrefix + "getChannelConcurrency",
  getExtension = agentRoutePrefix + "getExtension",
  getDialableCountries = agentRoutePrefix + "getDialableCountries",
  getAllQueueARNs = agentRoutePrefix + "getAllQueueARNs",
  getPermissions = agentRoutePrefix + "getPermissions",
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
