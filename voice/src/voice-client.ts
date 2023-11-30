import { ConnectClient, ConnectClientConfig } from "@amazon-connect/core";

import { voiceNamespace } from "./namespace";
import { VoiceRequests } from "./voice-request";

export class VoiceClient extends ConnectClient {
  constructor(config?: ConnectClientConfig) {
    super(voiceNamespace, config);
  }

  // requests

  async getPhoneNumber(contactId: string): Promise<string> {
    const data: Record<string, string> = await this.context.proxy.request(
      VoiceRequests.getPhoneNumber,
      {
        contactId,
      },
    );
    return data.phoneNumber;
  }
}
