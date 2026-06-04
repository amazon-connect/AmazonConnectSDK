import { SubscriptionHandler } from "@amazon-connect/core";

import { ParticipantState } from "./states";

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

export interface Queue {
  name: string;
  queueARN: string;
  queueId: string;
}

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

export type ContactIncoming = BaseContactLifecycleEvent;
export type ContactIncomingHandler = SubscriptionHandler<ContactIncoming>;

export type ContactConnecting = BaseContactLifecycleEvent;
export type ContactConnectingHandler = SubscriptionHandler<ContactConnecting>;

export type ContactError = BaseContactLifecycleEvent;
export type ContactErrorHandler = SubscriptionHandler<ContactError>;

export type ContactPending = BaseContactLifecycleEvent;
export type ContactPendingHandler = SubscriptionHandler<ContactPending>;

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

/**
 * Result of {@link AgentClient.getAvailabilityState}. The current availability
 * state, plus an optional `nextState` set when the backend has queued a
 * pending state transition until the agent's contacts are cleared.
 */
export type GetAvailabilityStateResult = AgentState & {
  nextState?: AgentState;
};

/**
 * Event payload for availability state change notifications.
 */
export type AgentAvailabilityStateChanged = {
  state: AgentState;
  previous?: {
    state: AgentState;
  };
};

/**
 * Handler function for availability state change events.
 */
export type AvailabilityStateChangedHandler =
  SubscriptionHandler<AgentAvailabilityStateChanged>;

/**
 * Event payload for next-availability-state change notifications.
 * Fires when the agent has a pending state transition queued (e.g. due to
 * active contacts) and that pending state changes.
 */
export type NextAgentAvailabilityStateChanged = {
  nextState: AgentState | null;
  previous?: {
    nextState: AgentState;
  };
};

/**
 * Handler function for next-availability-state change events.
 */
export type NextAvailabilityStateChangedHandler =
  SubscriptionHandler<NextAgentAvailabilityStateChanged>;

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

export type EnabledChannelListChangedHandler =
  SubscriptionHandler<EnabledChannelListChanged>;

export type AgentRoutingProfileChannelTypes = "VOICE" | "CHAT" | "TASK" | "EMAIL";
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

 export type GetPreviewConfigurationResponse = {
    autoDialTimeout: number;
    canDiscardPreview: boolean;
  };

export type InstanceDetails = {
  origin: string;
  region: string;
};


/**
 * Types of participants in a contact.
 */
export type ParticipantType =
  | { value: "agent" }
  | { value: "outbound" }
  | { value: "inbound" }
  | { value: "monitoring" }
  | { value: "other"; actual: string };

/**
 * Information about a participant in a contact.
 */
export interface ParticipantData {
  /** Unique identifier for the participant */
  participantId: string;
  /** Contact this participant belongs to */
  contactId: string;
  /** Type of participant */
  type: ParticipantType;
  /** Whether this is the initial participant */
  isInitial: boolean;
  /** Whether this participant is associated with the current user */
  isSelf: boolean;
}

/**
 * Detailed information about a contact.
 */
export interface ContactData {
  /** Unique identifier for the contact */
  contactId: string;
  /** Type of contact (voice, chat, task) */
  type: ContactType;
  /** Subtype of contact providing additional classification */
  subtype: string;
  /** Initial contact ID for transferred contact */
  initialContactId?: string;
  /** Queue information */
  queue: Queue;
}

/**
 * @deprecated Use ContactData interface instead. This type will be removed in a future version.
 */
export type CoreContactData = Omit<ContactData, "queue">;

// TEMPORARY CHANGE: Using CoreContactData[] instead of ContactData[]
// TODO: This is a temporary measure while module changes are being implemented
// Once the contact module is updated to properly support ContactData type,
// this should be changed back to ContactData[] and CoreContactData (which is
// already marked deprecated) should be removed from the codebase
export type ListContactsResult = CoreContactData[];

/**
 * Event data for participant added notifications.
 */
export interface ParticipantAdded {
  /** The participant that was added */
  participant: ParticipantData;
}

/**
 * Handler function for participant added events.
 */
export type ParticipantAddedHandler = SubscriptionHandler<ParticipantAdded>;

/**
 * Event data for participant disconnected notifications.
 */
export interface ParticipantDisconnected {
  /** The participant that was disconnected */
  participant: ParticipantData;
}

/**
 * Handler function for participant disconnected events.
 */
export type ParticipantDisconnectedHandler = SubscriptionHandler<ParticipantDisconnected>;

/**
 * Event data for participant state change notifications.
 */
export interface ParticipantStateChanged {
  /** The identifier of the participant that changed state */
  participantId: string;
  /** The identifier of the contact the participant belongs to */
  contactId: string;
  /** The new state of the participant */
  state: ParticipantState;
}

/**
 * Handler function for participant state change events.
 */
export type ParticipantStateChangedHandler = SubscriptionHandler<ParticipantStateChanged>;

/**
 * Connection health status indicating the current state of the agent's
 * connection to Amazon Connect backend services.
 */
export type NetworkConnectionStatus =
  | "connected"
  | "connecting"
  | "disconnected"
  | "failed";

/**
 * Event data for network connection status change notifications.
 */
export interface NetworkConnectionStatusChanged {
  /** The new connection health status */
  status: NetworkConnectionStatus;
  /** Epoch milliseconds when the status transition occurred */
  timestamp: number;
}

/**
 * Handler function for network connection status change events.
 */
export type NetworkConnectionStatusChangedHandler =
  SubscriptionHandler<NetworkConnectionStatusChanged>;
