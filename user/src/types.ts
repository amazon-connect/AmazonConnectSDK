import { SubscriptionHandler } from "@amazon-connect/core";

export type UserLanguageChanged = {
  language: string;
  previous: {
    language: string;
  };
};

export type UserLanguageChangedHandler =
  SubscriptionHandler<UserLanguageChanged>;
