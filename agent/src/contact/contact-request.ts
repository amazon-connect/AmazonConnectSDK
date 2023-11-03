export type ContactAttributeKey = string;

export type AllContactAttributes = "*";
export type ContactAttributeFilter =
  | ContactAttributeKey[]
  | AllContactAttributes;

const contactRoutePrefix = "contact/";

export enum ContactRequests {
  getAttributes = contactRoutePrefix + "getAttributes",
  getCustomerDetails = contactRoutePrefix + "getCustomerDetails",
  getContactId = contactRoutePrefix + "getContactId",
  getInitialContactId = contactRoutePrefix + "getInitialContactId",
  getType = contactRoutePrefix + "getType",
  getState = contactRoutePrefix + "getState",
  getStateDuration = contactRoutePrefix + "getStateDuration",
  getQueue = contactRoutePrefix + "getQueue",
  getQueueTimestamp = contactRoutePrefix + "getQueueTimestamp",
  getName = contactRoutePrefix + "getName",
  getDescription = contactRoutePrefix + "getDescription",
  getReferences = contactRoutePrefix + "getReferences",
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
