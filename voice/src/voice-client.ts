import { ConnectClient, ConnectClientConfig } from "@amazon-connect/core";

import { voiceNamespace } from "./namespace";
import { VoiceRoutes } from "./routes";

export class VoiceClient extends ConnectClient {
  constructor(config?: ConnectClientConfig) {
    super(voiceNamespace, config);
  }

  async getPhoneNumber(contactId: string): Promise<string> {
    const { phoneNumber } = await this.context.proxy.request<{
      phoneNumber: string;
    }>(VoiceRoutes.getPhoneNumber, {
      contactId,
    });
    return phoneNumber;
  }
}
