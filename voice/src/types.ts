export type CreateOutboundCallOptions = {
  queueARN?: string;
  relatedContactId?: string;
};

export type CreateOutboundCallResult = {
  contactId?: string;
};

export type DialableCountry = {
  countryCode: string;
  callingCode: string;
  label: string;
};
