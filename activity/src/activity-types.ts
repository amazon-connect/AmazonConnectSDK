import { SubscriptionHandler } from "@amazon-connect/core";

 
export interface ExpirationWarningClearedData {}

export type SessionExpirationInformation = {
  expiration: number;
};

export type SessionExtensionErrorData = {
  isWarningActive: boolean;
  errorDetails: Record<string, unknown>;
};

export type ExpirationWarningHandler =
  SubscriptionHandler<SessionExpirationInformation>;
export type ExpirationWarningClearedHandler =
  SubscriptionHandler<ExpirationWarningClearedData>;
export type SessionExtensionErrorHandler =
  SubscriptionHandler<SessionExtensionErrorData>;
