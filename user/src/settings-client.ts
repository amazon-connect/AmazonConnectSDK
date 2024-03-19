import { ConnectClient, ConnectClientConfig } from "@amazon-connect/core";

import { userNamespace } from "./namespace";
import { UserRoutes } from "./routes";
import { UserTopicKey } from "./topic-keys";
import { UserLanguageChangedHandler } from "./types";

export class SettingsClient extends ConnectClient {
  constructor(config?: ConnectClientConfig) {
    super(userNamespace, config);
  }

  async getLanguage(): Promise<string> {
    const { language } = await this.context.proxy.request<{
      language: string;
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
}
