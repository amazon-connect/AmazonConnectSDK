/* eslint-disable @typescript-eslint/no-redundant-type-constituents */
import { SubscriptionHandler } from "@amazon-connect/core";

export interface AgentState {
  agentStateARN?: AgentStateARN;
  type: AgentStateType;
  name: AgentStateName;
  startTimestamp?: Timestamp;
}
export type AgentStateARN = string;
export type AgentStateName = string;
export type AgentStateType =
  | "routable"
  | "not_routable"
  | "after_call_work"
  | "system"
  | "error"
  | "offline"
  | string;
export type Timestamp = Date;

export type AgentChannelConcurrency = Record<string, number>;

export type AgentRoutingProfile = {
  channelConcurrencyMap: AgentChannelConcurrency;
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

export type AgentStateChanged = {
  state: AgentState;
  previous?: {
    state: AgentState;
  };
};

export type AgentStateChangedHandler = SubscriptionHandler<AgentStateChanged>;

export type ContactAttributeKey = string;

export type AllContactAttributes = "*";
export type ContactAttributeFilter =
  | ContactAttributeKey[]
  | AllContactAttributes;

export type GetAttributesRequest = {
  contactId: string;
  attributes?: ContactAttributeFilter;
};

export type ContactType = string;

export interface BaseContactLifecycleEvent {
  contactId: string;
  initialContactId: string | undefined;
}

export type ContactStartingAcw = BaseContactLifecycleEvent;
export type ContactStartingAcwHandler = SubscriptionHandler<ContactStartingAcw>;

export type ContactDestroyed = BaseContactLifecycleEvent;
export type ContactDestroyedHandler = SubscriptionHandler<ContactDestroyed>;

export type ContactMissed = BaseContactLifecycleEvent;
export type ContactMissedHandler = SubscriptionHandler<ContactMissed>;

export type ContactConnected = BaseContactLifecycleEvent;
export type ContactConnectedHandler = SubscriptionHandler<ContactConnected>;
