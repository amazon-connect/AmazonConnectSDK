import {
  ConnectClientConfig,
  ConnectClientConfigDeprecated,
  ConnectClientConfigOptional,
  ConnectClientWithOptionalConfig,
} from "@amazon-connect/core";

import { voiceNamespace } from "./namespace";
import { VoiceRoutes } from "./routes";
import { VoiceTopicKeys } from "./topic-keys";
import {
  CanResumeParticipantChangedHandler,
  CreateOutboundCallOptions,
  CreateOutboundCallResult,
  DialableCountry,
  ParticipantHoldHandler,
  ParticipantResumeHandler,
  VoiceEnhancementMode,
  VoiceEnhancementModeChangedHandler,
  VoiceEnhancementPaths,
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

  onVoiceEnhancementModeChanged(
    handler: VoiceEnhancementModeChangedHandler,
  ): void {
    this.context.proxy.subscribe(
      { key: VoiceTopicKeys.VoiceEnhancementModeChanged },
      handler,
    );
  }

  offVoiceEnhancementModeChanged(
    handler: VoiceEnhancementModeChangedHandler,
  ): void {
    this.context.proxy.unsubscribe(
      { key: VoiceTopicKeys.VoiceEnhancementModeChanged },
      handler,
    );
  }

  async getVoiceEnhancementMode(): Promise<VoiceEnhancementMode> {
    const { voiceEnhancementMode } = await this.context.proxy.request<{
      voiceEnhancementMode: VoiceEnhancementMode;
    }>(VoiceRoutes.getVoiceEnhancementMode);
    return voiceEnhancementMode;
  }

  setVoiceEnhancementMode(
    voiceEnhancementMode: VoiceEnhancementMode,
  ): Promise<void> {
    return this.context.proxy.request(VoiceRoutes.setVoiceEnhancementMode, {
      voiceEnhancementMode,
    });
  }

  async getVoiceEnhancementPaths(): Promise<VoiceEnhancementPaths> {
    const { voiceEnhancementPaths } = await this.context.proxy.request<{
      voiceEnhancementPaths: VoiceEnhancementPaths;
    }>(VoiceRoutes.getVoiceEnhancementPaths);
    return voiceEnhancementPaths;
  }

  async conferenceParticipants(contactId: string): Promise<void> {
    return this.context.proxy.request(VoiceRoutes.conferenceParticipants, {
      contactId,
    });
  }

  async holdParticipant(participantId: string): Promise<void> {
    return this.context.proxy.request(VoiceRoutes.holdParticipant, {
      participantId,
    });
  }

  async resumeParticipant(participantId: string): Promise<void> {
    return this.context.proxy.request(VoiceRoutes.resumeParticipant, {
      participantId,
    });
  }

  async holdSelf(contactId: string): Promise<void> {
    return this.context.proxy.request(VoiceRoutes.holdSelf, {
      contactId,
    });
  }

  async resumeSelf(contactId: string): Promise<void> {
    return this.context.proxy.request(VoiceRoutes.resumeSelf, {
      contactId,
    });
  }

  async isParticipantOnHold(participantId: string): Promise<boolean> {
    const { isOnHold } = await this.context.proxy.request<{
      isOnHold: boolean;
    }>(VoiceRoutes.isParticipantOnHold, { participantId });
    return isOnHold;
  }

  async isSelfOnHold(contactId: string): Promise<boolean> {
    const { isOnHold } = await this.context.proxy.request<{
      isOnHold: boolean;
    }>(VoiceRoutes.isSelfOnHold, { contactId });
    return isOnHold;
  }

  async canResumeSelf(contactId: string): Promise<boolean> {
    const response: Record<string, boolean> = await this.context.proxy.request(
      VoiceRoutes.canResumeSelf,
      {
        contactId,
      },
    );

    return response.canResumeSelf;
  }

  async canResumeParticipant(participantId: string): Promise<boolean> {
    const response: Record<string, boolean> = await this.context.proxy.request(
      VoiceRoutes.canResumeParticipant,
      { participantId },
    );

    return response.canResumeParticipant;
  }

  /**
   * Subscribes to events when any participant is put on hold on a contact.
   * Each contact has multiple participants, and any given participant can be put on hold or resumed.
   *
   * @param handler - Event handler function to call when participants are put on hold
   * @param participantId - Optional participant ID to filter events for a specific participant
   */
  onParticipantHold(
    handler: ParticipantHoldHandler,
    participantId?: string,
  ): void {
    this.context.proxy.subscribe(
      { key: VoiceTopicKeys.ParticipantHold, parameter: participantId },
      handler,
    );
  }

  /**
   * Unsubscribes from events when any participant is put on hold.
   * Removes the specified handler from receiving notifications about participant hold events.
   *
   * @param handler - Event handler function to remove
   * @param participantId - Optional participant ID to unsubscribe from specific participant events
   */
  offParticipantHold(
    handler: ParticipantHoldHandler,
    participantId?: string,
  ): void {
    this.context.proxy.unsubscribe(
      { key: VoiceTopicKeys.ParticipantHold, parameter: participantId },
      handler,
    );
  }

  /**
   * Subscribes to events when any participant is taken off hold on a contact.
   * Each contact has multiple participants, and any given participant can be put on hold or taken off hold.
   *
   * @param handler - Event handler function to call when participants are taken off hold
   * @param participantId - Optional participant ID to filter events for a specific participant
   */
  onParticipantResume(
    handler: ParticipantResumeHandler,
    participantId?: string,
  ): void {
    this.context.proxy.subscribe(
      { key: VoiceTopicKeys.ParticipantResume, parameter: participantId },
      handler,
    );
  }

  /**
   * Unsubscribes from events when any participant is taken off hold.
   * Removes the specified handler from receiving notifications about participants being taken off hold.
   *
   * @param handler - Event handler function to remove
   * @param participantId - Optional participant ID to unsubscribe from specific participant events
   */
  offParticipantResume(
    handler: ParticipantResumeHandler,
    participantId?: string,
  ): void {
    this.context.proxy.unsubscribe(
      { key: VoiceTopicKeys.ParticipantResume, parameter: participantId },
      handler,
    );
  }

  /**
   * Subscribes to events when the current user's participant is put on hold on a contact.
   * Each contact has multiple participants, and this event fires specifically when the participant
   * associated with the current user is put on hold, allowing specification by contact rather than participant ID.
   *
   * @param handler - Event handler function to call when the current user's participant is put on hold
   * @param contactId - Optional contact ID to filter events for a specific contact
   */
  onSelfHold(handler: ParticipantHoldHandler, contactId?: string): void {
    this.context.proxy.subscribe(
      { key: VoiceTopicKeys.SelfHold, parameter: contactId },
      handler,
    );
  }

  /**
   * Unsubscribes from events when the current user's participant is put on hold.
   * Removes the specified handler from receiving notifications about the current user's participant hold events.
   *
   * @param handler - Event handler function to remove
   * @param contactId - Optional contact ID to unsubscribe from specific contact events
   */
  offSelfHold(handler: ParticipantHoldHandler, contactId?: string): void {
    this.context.proxy.unsubscribe(
      { key: VoiceTopicKeys.SelfHold, parameter: contactId },
      handler,
    );
  }

  /**
   * Subscribes to events when the current user's participant is taken off hold on a contact.
   * Each contact has multiple participants, and this event fires specifically when the participant
   * associated with the current user is taken off hold, allowing specification by contact rather than participant ID.
   *
   * @param handler - Event handler function to call when the current user's participant is taken off hold
   * @param contactId - Optional contact ID to filter events for a specific contact
   */
  onSelfResume(handler: ParticipantResumeHandler, contactId?: string): void {
    this.context.proxy.subscribe(
      { key: VoiceTopicKeys.SelfResume, parameter: contactId },
      handler,
    );
  }

  /**
   * Unsubscribes from events when the current user's participant is taken off hold.
   * Removes the specified handler from receiving notifications about the current user's participant being taken off hold.
   *
   * @param handler - Event handler function to remove
   * @param contactId - Optional contact ID to unsubscribe from specific contact events
   */
  offSelfResume(handler: ParticipantResumeHandler, contactId?: string): void {
    this.context.proxy.unsubscribe(
      { key: VoiceTopicKeys.SelfResume, parameter: contactId },
      handler,
    );
  }

  /**
   * Subscribes to events when the current user's participant capability to be taken off hold changes on a contact.
   * Each contact has multiple participants, and this event fires specifically when the participant
   * associated with the current user's capability to be taken off hold changes, allowing specification by contact rather than participant ID.
   *
   * @param handler - Event handler function to call when the current user's participant capability to be taken off hold changes
   * @param contactId - Optional contact ID to filter events for a specific contact
   */
  onCanResumeSelfChanged(
    handler: CanResumeParticipantChangedHandler,
    contactId?: string,
  ): void {
    this.context.proxy.subscribe(
      { key: VoiceTopicKeys.CanResumeSelfChanged, parameter: contactId },
      handler,
    );
  }

  /**
   * Unsubscribes from events when the current user's participant capability to be taken off hold changes.
   * Removes the specified handler from receiving notifications about the current user's participant capability to be taken off hold changes.
   *
   * @param handler - Event handler function to remove
   * @param contactId - Optional contact ID to unsubscribe from specific contact events
   */
  offCanResumeSelfChanged(
    handler: CanResumeParticipantChangedHandler,
    contactId?: string,
  ): void {
    this.context.proxy.unsubscribe(
      { key: VoiceTopicKeys.CanResumeSelfChanged, parameter: contactId },
      handler,
    );
  }

  /**
   * Subscribes to events when a participant's capability to be taken off hold changes.
   * This event fires when the ability to resume a participant from hold changes,
   * which can happen due to various factors such as permissions or system state.
   *
   * @param handler - Event handler function to call when a participant's capability to be taken off hold changes
   * @param participantId - Optional participant ID to filter events for a specific participant
   */
  onCanResumeParticipantChanged(
    handler: CanResumeParticipantChangedHandler,
    participantId?: string,
  ): void {
    this.context.proxy.subscribe(
      { key: VoiceTopicKeys.CanResumeParticipantChanged, parameter: participantId },
      handler,
    );
  }

  /**
   * Unsubscribes from events when a participant's capability to be taken off hold changes.
   * Removes the specified handler from receiving notifications about participant capability to be taken off hold changes.
   *
   * @param handler - Event handler function to remove
   * @param participantId - Optional participant ID to unsubscribe from specific participant events
   */
  offCanResumeParticipantChanged(
    handler: CanResumeParticipantChangedHandler,
    participantId?: string,
  ): void {
    this.context.proxy.unsubscribe(
      { key: VoiceTopicKeys.CanResumeParticipantChanged, parameter: participantId },
      handler,
    );
  }
}
