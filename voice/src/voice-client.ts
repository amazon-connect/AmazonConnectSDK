import { ConnectClient, ConnectClientConfig } from "@amazon-connect/core";

import { voiceNamespace } from "./namespace";
import { VoiceRequests } from "./types";

export class VoiceClient extends ConnectClient {
  constructor(config?: ConnectClientConfig) {
    super(voiceNamespace, config);
  }

  async getPhoneNumber(contactId: string): Promise<string> {
    const { phoneNumber } = await this.context.proxy.request<{
      phoneNumber: string;
    }>(VoiceRequests.getPhoneNumber, {
      contactId,
    });
    return phoneNumber;
  }
}
