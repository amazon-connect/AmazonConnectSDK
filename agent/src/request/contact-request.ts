export type ContactAttributeKey = string;

export type AllContactAttributes = "*";
export type ContactAttributeFilter =
  | ContactAttributeKey[]
  | AllContactAttributes;

export enum ContactRequests {
  getAttributes = "contact/getAttributes",
  getCustomerDetails = "contact/getCustomerDetails",
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
  phoneNumber?: string;
  customerName?: string;
  name?: string;
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
  type: ContactStateType;
  timestamp: Date;
};

export enum ReferenceType {
  URL = "URL",
}

export type ReferenceDictionary = {
  [key: string]: {
    type: ReferenceType;
    value: string;
  };
};
