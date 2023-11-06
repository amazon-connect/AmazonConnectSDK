export type ContactAttributeKey = string;

export type AllContactAttributes = "*";
export type ContactAttributeFilter =
  | ContactAttributeKey[]
  | AllContactAttributes;

export enum ContactRequests {
  getAttributes = "contact/getAttributes",
  getCustomerDetails = "contact/getCustomerDetails",
  getContactId = "contact/getContactId",
  getInitialContactId = "contact/getInitialContactId",
  getType = "contact/getType",
  getState = "contact/getState",
  getStateDuration = "contact/getStateDuration",
  getQueue = "contact/getQueue",
  getQueueTimestamp = "contact/getQueueTimestamp",
  getName = "contact/getName",
  getDescription = "contact/getDescription",
  getReferences = "contact/getReferences",
}

export type ContactRequestRequest = {
  contactId: string;
};

export type GetAttributesRequest = ContactRequestRequest & {
  attributes?: ContactAttributeFilter;
};

export type CustomerDetails = {
  readonly phoneNumber?: string | void;
  readonly customerName?: string | void;
  readonly name?: string | void;
};

export enum ContactType {
  VOICE = "voice",
  QUEUE_CALLBACK = "queue_callback",
  CHAT = "chat",
  TASK = "task",
}

export enum ContactStateType {
  INIT = "init",
  INCOMING = "incoming",
  PENDING = "pending",
  CONNECTING = "connecting",
  CONNECTED = "connected",
  MISSED = "missed",
  REJECTED = "rejected",
  ERROR = "error",
  ENDED = "ended",
}

export type ContactState = {
  readonly type: ContactStateType;
  readonly timestamp: Date;
};

export type Queue = {
  readonly name: string;
  readonly queueARN: string;
  readonly queueId: string;
};

export enum ReferenceType {
  URL = "URL",
}

export type ReferenceDictionary = {
  readonly [key: string]: {
    type: ReferenceType;
    value: string;
  };
};
