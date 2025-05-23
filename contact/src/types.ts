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
  state: AgentStateName;
  previous?: {
    state: AgentStateName;
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
  type: ContactChannelType["type"];
  subtype: ContactChannelType["subtype"];
}

export type ContactStartingAcw = BaseContactLifecycleEvent;
export type ContactStartingAcwHandler = SubscriptionHandler<ContactStartingAcw>;

export type ContactDestroyed = BaseContactLifecycleEvent;
export type ContactDestroyedHandler = SubscriptionHandler<ContactDestroyed>;

export type ContactMissed = BaseContactLifecycleEvent;
export type ContactMissedHandler = SubscriptionHandler<ContactMissed>;

export type ContactConnected = BaseContactLifecycleEvent;
export type ContactConnectedHandler = SubscriptionHandler<ContactConnected>;

export type SetAvailabilityStateResult =
  | {
      /**
       * Means PutAgentState API succeeded and the agent state change has been reflected in the agent snapshot.
       */
      status: "updated";
      current: AgentState;
    }
  | {
      /**
       * Means PutAgentState API succeeded but the target agent state has been queued as next agent state because the agent is handling a contact. The agent state will change when all contacts are cleared.
       */
      status: "queued";
      current: AgentState;
      next: AgentState;
    };

export type VoiceChannelType = {
  type: "voice";
  subtype: "connect:Telephony" | "connect:WebRTC";
};

export type QueueCallbackChannelType = {
  type: "queue_callback";
  subtype: "connect:Telephony" | "connect:WebRTC";
};

export type ChatChannelType = {
  type: "chat";
  subtype: "connect:Chat" | "connect:SMS" | "connect:Apple" | "connect:Guide";
};

export type TaskChannelType = {
  type: "task";
  subtype: "connect:Task";
};

export type EmailChannelType = {
  type: "email";
  subtype: "connect:Email";
};

export type ContactChannelType =
  | VoiceChannelType
  | QueueCallbackChannelType
  | ChatChannelType
  | TaskChannelType
  | EmailChannelType;

export type ListQuickConnectsOptions = {
  /**
   * The max number of quick connects to return.
   * Default maxResults is 500.
   */
  maxResults?: number;
  nextToken?: string;
};

export type ListQuickConnectsResult = {
  quickConnects: QuickConnect[];
  nextToken: string | null;
};

export type QueueARN = string;

export type QuickConnect =
  | AgentQuickConnect
  | QueueQuickConnect
  | PhoneNumberQuickConnect;

export type AgentQuickConnect = {
  type: "agent";
  endpointARN: string;
  name: string;
};

export type QueueQuickConnect = {
  type: "queue";
  endpointARN: string;
  name: string;
};

export type PhoneNumberQuickConnect = {
  type: "phone_number";
  endpointARN: string;
  name: string;
  phoneNumber: string;
};

export type AddParticipantResult = {
  participantId: string;
};

export type ContactCleared = BaseContactLifecycleEvent;
export type ContactClearedHandler = SubscriptionHandler<ContactCleared>;
