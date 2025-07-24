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

export type VoiceEnhancementMode =
  | "VOICE_ISOLATION"
  | "NOISE_SUPPRESSION"
  | "NONE";

export interface VoiceEnhancementPaths {
  processors: string;
  workers: string;
  wasm: string;
  models: string;
}
