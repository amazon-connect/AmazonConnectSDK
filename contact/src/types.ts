import { SubscriptionHandler } from "@amazon-connect/core";

export type AgentStateType = "init" | "routable" | "not_routable" | "offline";

export type AgentState = {
  agentStateARN: string | null;
  name: string;
  startTimestamp: Date;
  type: AgentStateType;
};

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
  state: string;
  previous: {
    state: string;
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

export type ContactStateValue =
  | "init"
  | "incoming"
  | "pending"
  | "connecting"
  | "connected"
  | "missed"
  | "rejected"
  | "error";

export type ContactState = {
  type: ContactStateValue;
  timestamp: Date;
};

type BaseContactLifecycleEvent = {
  contactId: string;
};

export type ContactAccepted = BaseContactLifecycleEvent;
export type ContactAcceptedHandler = SubscriptionHandler<ContactAccepted>;

export type ContactStartingAcw = BaseContactLifecycleEvent;
export type ContactStartingAcwHandler = SubscriptionHandler<ContactStartingAcw>;

export type ContactConnected = BaseContactLifecycleEvent;
export type ContactConnectedHandler = SubscriptionHandler<ContactConnected>;

export type ContactConnecting = BaseContactLifecycleEvent;
export type ContactConnectingHandler = SubscriptionHandler<ContactConnecting>;

export type ContactDestroyed = BaseContactLifecycleEvent;
export type ContactDestroyedHandler = SubscriptionHandler<ContactDestroyed>;

export type ContactError = BaseContactLifecycleEvent;
export type ContactErrorHandler = SubscriptionHandler<ContactError>;

export type ContactIncoming = BaseContactLifecycleEvent;
export type ContactIncomingHandler = SubscriptionHandler<ContactIncoming>;

export type ContactMissed = BaseContactLifecycleEvent;
export type ContactMissedHandler = SubscriptionHandler<ContactMissed>;

export type ContactPending = BaseContactLifecycleEvent;
export type ContactPendingHandler = SubscriptionHandler<ContactPending>;
