import { ConnectClient, ConnectClientConfig } from "@amazon-connect/core";

import { voiceNamespace } from "./namespace";
import { VoiceRoutes } from "./routes";
import {
  CreateOutboundCallOptions,
  CreateOutboundCallResult,
  DialableCountry,
} from "./types";

export class VoiceClient extends ConnectClient {
  constructor(config?: ConnectClientConfig) {
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
