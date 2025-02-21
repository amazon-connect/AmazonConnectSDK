import { SubscriptionHandler } from "@amazon-connect/core";

export type Locale =
  | "en_US"
  | "de_DE"
  | "es_ES"
  | "fr_FR"
  | "ja_JP"
  | "it_IT"
  | "ko_KR"
  | "pt_BR"
  | "zh_CN"
  | "zh_TW";

export type UserLanguageChanged = {
  language: Locale;
  previous: {
    language: Locale | null;
  };
};

export type UserLanguageChangedHandler =
  SubscriptionHandler<UserLanguageChanged>;

export type SetLanguageResult = {
  language?: Locale;
};

export type SetLanguageOptions = MutableOperationOptions;

export interface MutableOperationOptions {
  /**
   * Default is false. If false, the returned promise will be resolved only after the backend returns a new agent configuration in a desired state. If true, the returned promise will be resolved as soon as the backend API call succeeds, which is the StreamsJS' behavior. The promise will be immediately rejected if the backend API call fails in both cases.
   * */
  resolveBeforeConfirmation?: boolean;
}
