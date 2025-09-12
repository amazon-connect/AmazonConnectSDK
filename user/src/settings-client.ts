import {
  ConnectClientConfig,
  ConnectClientConfigDeprecated,
  ConnectClientConfigOptional,
  ConnectClientWithOptionalConfig,
} from "@amazon-connect/core";

import { userNamespace } from "./namespace";
import { UserRoutes } from "./routes";
import { UserTopicKey } from "./topic-keys";
import { Locale, UserLanguageChangedHandler } from "./types";

export class SettingsClient extends ConnectClientWithOptionalConfig {
  /**
   * Creates a new SettingsClient instance with the specified configuration.
   *
   * @param config - The configuration for the client. Can be provided as:
   *   - An AmazonConnectProvider instance directly: `new SettingsClient(provider)`
   *   - An object with provider: `new SettingsClient({ provider })`
   *
   * @example
   * ```typescript
   * // Recommended: Pass provider directly
   * const client = new SettingsClient(provider);
   *
   * // Alternative: Pass as object
   * const client = new SettingsClient({ provider });
   * ```
   */
  constructor(config: ConnectClientConfig);

  /**
   * @deprecated Calling SettingsClient without AmazonConnectProvider is deprecated and will be removed in a future version.
   * Please provide an AmazonConnectProvider instance: `new SettingsClient(provider)`
   */
  constructor(config?: ConnectClientConfigDeprecated);

  constructor(config: ConnectClientConfigOptional) {
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
}
