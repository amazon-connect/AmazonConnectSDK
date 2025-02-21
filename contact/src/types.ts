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

export type SetAvailabilityStateOptions = MutableOperationOptions;

export type SetAvailabilityStateResult =
  | {
      /**
       * Means PutAgentState API succeeded and the agent state change has been reflected in the agent snapshot. Only applicable if resolveBeforeConfirmation is false.
       */
      status: "updated";
      current: AgentState;
    }
  | {
      /**
       * Means PutAgentState API succeeded but the target agent state has been queued as next agent state because the agent is handling a contact. The agent state will change when all contacts are cleared. Only applicable if resolveBeforeConfirmation is false.
       */
      status: "queued";
      current: AgentState;
      next: AgentState;
    }
  | {
      /**
       * Means PutAgentState API has just succeeded but the agent state change hasn't been reflected in the agent snapshot yet. Only applicable if resolveBeforeConfirmation is true.
       */
      status: "in_progress";
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

export type ConnectionType = string;

export type AssociatedContact = {
  contactId: string;
  contactArn: string;
  contactType: string;

  previousContactId?: string;
  initialContactId?: string;
  relatedContactId?: string;

  initiationMethod: string;

  initiationTimestamp: Date;
  disconnectTimestamp: Date | undefined;
};

export type ListAssociatedContactsOptions = {
  /**
   * The max number of related contacts to return.
   *
   * Default maxResults is 25.
   */
  maxResults?: number;

  nextToken?: string;
};

export type ListAssociatedContactsResponse = {
  associatedContacts: AssociatedContact[];

  nextToken?: string;
};

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

export type CoreContactData = {
  type: ContactChannelType["type"];
  subtype: ContactChannelType["subtype"];
  contactId: string;
  initialContactId?: string;
};

export type ListContactsResult = CoreContactData[];

export type AcceptOptions = MutableOperationOptions;
export type RejectOptions = MutableOperationOptions;
export type DisconnectSelfOptions = MutableOperationOptions;
export type ClearOptions = MutableOperationOptions;

export type AddParticipantOptions = MutableOperationOptions;
export type AddParticipantResult = {
  participantId?: string;
};

export type DisconnectOptions = MutableOperationOptions;
export type TransferOptions = MutableOperationOptions;

export type ContactCleared = BaseContactLifecycleEvent;
export type ContactClearedHandler = SubscriptionHandler<ContactCleared>;

export type ContactConnecting = BaseContactLifecycleEvent;
export type ContactConnectingHandler = SubscriptionHandler<ContactConnecting>;

export type ContactError = BaseContactLifecycleEvent;
export type ContactErrorHandler = SubscriptionHandler<ContactError>;

export type ContactIncoming = BaseContactLifecycleEvent;
export type ContactIncomingHandler = SubscriptionHandler<ContactIncoming>;

export type ContactPending = BaseContactLifecycleEvent;
export type ContactPendingHandler = SubscriptionHandler<ContactPending>;

export type AvailabilityStateChangedHandler =
  SubscriptionHandler<AgentAvailabilityStateChanged>;
export type NextAvailabilityStateChangedHandler =
  SubscriptionHandler<NextAgentAvailabilityStateChanged>;
export type AgentAvailabilityStateChanged = {
  state: AgentState;
  previous?: {
    state: AgentState;
  };
};
export type NextAgentAvailabilityStateChanged = {
  nextState: AgentState | null;
  previous?: {
    nextState: AgentState;
  };
};

export type EnabledChannelListChangedHandler =
  SubscriptionHandler<EnabledChannelListChanged>;

export type AgentRoutingProfileChannelTypes =
  | "voice"
  | "chat"
  | "task"
  | "email";
export interface EnabledChannelListChanged {
  enabledChannels: AgentRoutingProfileChannelTypes[];
  previous?: {
    enabledChannels: AgentRoutingProfileChannelTypes[];
  };
}

export type RoutingProfileChangedHandler =
  SubscriptionHandler<AgentRoutingProfileChanged>;
export interface AgentRoutingProfileChanged {
  routingProfile: AgentRoutingProfile;
  previous?: {
    routingProfile: AgentRoutingProfile;
  };
}
export interface MutableOperationOptions {
  /**
   * Default is false. If false, the returned promise will be resolved only after the backend returns a new agent snapshot in a desired state. If true, the returned promise will be resolved as soon as the backend API call succeeds, which is the StreamsJS' behavior. The promise will be immediately rejected if the backend API call fails in both cases.
   * */
  resolveBeforeConfirmation?: boolean;
}
