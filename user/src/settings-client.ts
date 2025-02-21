import { ConnectClient, ConnectClientConfig } from "@amazon-connect/core";

import { userNamespace } from "./namespace";
import { SettingsRoutes, UserRoutes } from "./routes";
import { UserTopicKey } from "./topic-keys";
import {
  Locale,
  SetLanguageOptions,
  SetLanguageResult,
  UserLanguageChangedHandler,
} from "./types";

export class SettingsClient extends ConnectClient {
  constructor(config?: ConnectClientConfig) {
    super(userNamespace, config);
  }

  async getLanguage(): Promise<Locale | null> {
    const { language } = await this.context.proxy.request<{
      language: Locale | null;
    }>(UserRoutes.getLanguage);

    return language;
  }

  onLanguageChanged(handler: UserLanguageChangedHandler): void {
    this.context.proxy.subscribe(
      { key: UserTopicKey.LanguageChanged },
      handler,
    );
  }

  offLanguageChanged(handler: UserLanguageChangedHandler): void {
    this.context.proxy.unsubscribe(
      { key: UserTopicKey.LanguageChanged },
      handler,
    );
  }

  setLanguage(
    language: Locale,
    options?: SetLanguageOptions,
  ): Promise<SetLanguageResult> {
    return this.context.proxy.request<SetLanguageResult>(
      SettingsRoutes.setLanguage,
      {
        language,
        options,
      },
    );
  }
}
