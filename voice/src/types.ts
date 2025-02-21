export type CreateOutboundCallOptions = {
  queueARN?: string;
  relatedContactId?: string;
} & MutableOperationOptions;

export type CreateOutboundCallResult = {
  contactId?: string;
};

export type DialableCountry = {
  countryCode: string;
  callingCode: string;
  label: string;
};

export interface MutableOperationOptions {
  resolveBeforeConfirmation?: boolean; // Default is false. If false, the returned promise will be resolved only after the backend returns a new agent snapshot in a desired state. If true, the returned promise will be resolved as soon as the backend API call succeeds, which is the StreamsJS' behavior. The promise will be immediately rejected if the backend API call fails in both cases.
}
