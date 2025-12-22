import { SubscriptionHandler } from "@amazon-connect/core";

export interface CreateOutboundCallOptions {
  queueARN?: string;
  relatedContactId?: string;
}

export type CreateOutboundCallResult = {
  contactId?: string;
};

export type DialableCountry = {
  countryCode: string;
  callingCode: string;
  label: string;
};

/** Base event data for participant hold status changes */
export interface ParticipantHoldStatusChanged {
  /** The participant identifier */
  participantId: string;
  /** The contact identifier */
  contactId: string;
  /** Whether the participant is on hold */
  isOnHold: boolean;
}

/** Event data for participant hold */
export interface ParticipantHold extends ParticipantHoldStatusChanged {
  /** Whether the participant is on hold - always true for this event */
  isOnHold: true;
}

/** Event data for participant resume */
export interface ParticipantResume extends ParticipantHoldStatusChanged {
  /** Whether the participant is on hold - always false for this event */
  isOnHold: false;
}

/** Handler for participant hold events */
export type ParticipantHoldHandler = SubscriptionHandler<ParticipantHold>;

/** Handler for participant resume events */
export type ParticipantResumeHandler = SubscriptionHandler<ParticipantResume>;

/** Event data for participant resume capability changes */
export interface CanResumeParticipantChanged {
  /** The participant identifier */
  participantId: string;
  /** The contact identifier */
  contactId: string;
  /** Whether the participant can be resumed from hold */
  canResumeConnection: boolean;
}

/** Handler for participant resume capability change events */
export type CanResumeParticipantChangedHandler =
  SubscriptionHandler<CanResumeParticipantChanged>;
