import {
  ConnectClientConfig,
  ConnectClientConfigDeprecated,
  ConnectClientConfigOptional,
  ConnectClientWithOptionalConfig,
} from "@amazon-connect/core";

import { voiceNamespace } from "./namespace";
import { VoiceRoutes } from "./routes";
import {
  CreateOutboundCallOptions,
  CreateOutboundCallResult,
  DialableCountry,
} from "./types";

export class VoiceClient extends ConnectClientWithOptionalConfig {
  /**
   * Creates a new VoiceClient instance with the specified configuration.
   *
   * @param config - The configuration for the client. Can be provided as:
   *   - An AmazonConnectProvider instance directly: `new VoiceClient(provider)`
   *   - An object with provider: `new VoiceClient({ provider })`
   *
   * @example
   * ```typescript
   * // Recommended: Pass provider directly
   * const client = new VoiceClient(provider);
   *
   * // Alternative: Pass as object
   * const client = new VoiceClient({ provider });
   * ```
   */
  constructor(config: ConnectClientConfig);

  /**
   * @deprecated Calling VoiceClient without AmazonConnectProvider is deprecated and will be removed in a future version.
   * Please provide an AmazonConnectProvider instance: `new VoiceClient(provider)`
   */
  constructor(config?: ConnectClientConfigDeprecated);

  constructor(config: ConnectClientConfigOptional) {
    super(voiceNamespace, config);
  }
  /**
   * @deprecated Use `getInitialCustomerPhoneNumber` instead.
   */
  async getPhoneNumber(contactId: string): Promise<string> {
    const { phoneNumber } = await this.context.proxy.request<{
      phoneNumber: string;
    }>(VoiceRoutes.getPhoneNumber, {
      contactId,
    });
    return phoneNumber;
  }

  async getInitialCustomerPhoneNumber(contactId: string): Promise<string> {
    const { phoneNumber } = await this.context.proxy.request<{
      phoneNumber: string;
    }>(VoiceRoutes.getInitialCustomerPhoneNumber, {
      contactId,
    });
    return phoneNumber;
  }

  listDialableCountries(): Promise<DialableCountry[]> {
    return this.context.proxy.request(VoiceRoutes.listDialableCountries);
  }

  async getOutboundCallPermission(): Promise<boolean> {
    const { outboundCallPermission } = await this.context.proxy.request<{
      outboundCallPermission: boolean;
    }>(VoiceRoutes.getOutboundCallPermission);
    return outboundCallPermission;
  }

  /**
   * @param phoneNumber phone number string in E.164 format
   */
  createOutboundCall(
    phoneNumber: string,
    options?: CreateOutboundCallOptions,
  ): Promise<CreateOutboundCallResult> {
    return this.context.proxy.request<CreateOutboundCallResult>(
      VoiceRoutes.createOutboundCall,
      {
        phoneNumber,
        options,
      },
    );
  }
}
