import { ConnectClient, ConnectClientConfig } from "@amazon-connect/core";
import { voiceNamespace } from "../namespace";
import {PhoneNumber, VoiceRequests} from "../request/voice-request";

export class VoiceClient extends ConnectClient {
  constructor(config?: ConnectClientConfig) {
    super(voiceNamespace, config);
  }

  // requests

  async getPhoneNumber(contactId: string): Promise<PhoneNumber | null> {
    const data: Record<string, PhoneNumber> = await this.context.proxy.request(
        VoiceRequests.getPhoneNumber,
      {
        contactId,
      },
    );
    return data.phoneNumber;
  }

}
