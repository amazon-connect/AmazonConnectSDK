import { SubscriptionHandler } from "@amazon-connect/core";

export enum ContactLifecycleTopic {
  ACCEPTED = "contact/accepted",
  ACW = "contact/acw",
  CONNECTED = "contact/connected",
  CONNECTING = "contact/connecting",
  DESTROY = "contact/destroy",
  ENDED = "contact/ended",
  ERROR = "contact/error",
  INCOMING = "contact/incoming",
  MISSED = "contact/missed",
  PENDING = "contact/pending",
}

type BaseContactLifecycleEventData = {
  contactId: string;
};

export type ContactAcceptedEventData = BaseContactLifecycleEventData;
export type ContactAcceptedHandler =
  SubscriptionHandler<ContactAcceptedEventData>;

export type ContactAcwEventData = BaseContactLifecycleEventData;
export type ContactAcwHandler = SubscriptionHandler<ContactAcwEventData>;

export type ContactConnectedEventData = BaseContactLifecycleEventData;
export type ContactConnectedHandler =
  SubscriptionHandler<ContactConnectedEventData>;

export type ContactConnectingEventData = BaseContactLifecycleEventData;
export type ContactConnectingHandler =
  SubscriptionHandler<ContactConnectingEventData>;

export type ContactDestroyEventData = BaseContactLifecycleEventData;
export type ContactDestroyHandler =
  SubscriptionHandler<ContactDestroyEventData>;

export type ContactEndedEventData = BaseContactLifecycleEventData;
export type ContactEndedHandler = SubscriptionHandler<ContactEndedEventData>;

export type ContactErrorEventData = BaseContactLifecycleEventData;
export type ContactErrorHandler = SubscriptionHandler<ContactErrorEventData>;

export type ContactIncomingEventData = BaseContactLifecycleEventData;
export type ContactIncomingHandler =
  SubscriptionHandler<ContactIncomingEventData>;

export type ContactMissedEventData = BaseContactLifecycleEventData;
export type ContactMissedHandler = SubscriptionHandler<ContactMissedEventData>;

export type ContactPendingEventData = BaseContactLifecycleEventData;
export type ContactPendingHandler =
  SubscriptionHandler<ContactPendingEventData>;
