import { SubscriptionHandler } from "@amazon-connect/core";

export const contactLifecyclePrefix = "contact/lifecycle/";

export enum ContactLifecycleTopics {
  incoming = contactLifecyclePrefix + "incoming",
  pending = contactLifecyclePrefix + "pending",
  connecting = contactLifecyclePrefix + "connecting",
  connected = contactLifecyclePrefix + "connected",
  missed = contactLifecyclePrefix + "missed",
  accepted = contactLifecyclePrefix + "accepted",
  afterContactWork = contactLifecyclePrefix + "afterContactWork",
  destroy = contactLifecyclePrefix + "destroy",
  ended = contactLifecyclePrefix + "ended",
  error = contactLifecyclePrefix + "error",
  refresh = contactLifecyclePrefix + "refresh",
}

export type ContactLifecycleEventData = {
  contactId: string;
  // What other events should be added here?
};

// QUESTION - Does one result handler work for all lifecycle
// events or do we need handler per lifecycle event. This will
// be decided by if different events need a different ContactLifecycleEventData
export type ContactLifecycleHandler =
  SubscriptionHandler<ContactLifecycleEventData>;
