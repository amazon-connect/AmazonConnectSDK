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

export type VisualMode = "light" | "dark" | "auto";

export type VisualModeChanged = {
  visualMode: VisualMode;
  previous: {
    visualMode: VisualMode | null;
  };
};

export type VisualModeChangedHandler = SubscriptionHandler<VisualModeChanged>;
