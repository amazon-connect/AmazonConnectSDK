import {
  ConnectClientConfig,
  ConnectClientConfigDeprecated,
  ConnectClientConfigOptional,
  ConnectClientWithOptionalConfig,
} from "@amazon-connect/core";

import { contactNamespace } from "./namespace";
import { ContactRoutes } from "./routes";
import { ParticipantState } from "./states";
import { ContactLifecycleTopicKey, ContactTopicKey } from "./topic-keys";
import {
  AddParticipantResult,
  AgentQuickConnect,
  ContactAttributeFilter,
  ContactChannelType,
  ContactClearedHandler,
  ContactConnectedHandler,
  ContactData,
  ContactDestroyedHandler,
  ContactIncomingHandler,
  ContactMissedHandler,
  ContactStartingAcwHandler,
  ContactType,
  GetAttributesRequest,
  GetPreviewConfigurationResponse,
  InstanceDetails,
  ListContactsResult,
  ParticipantAddedHandler,
  ParticipantData,
  ParticipantDisconnectedHandler,
  ParticipantStateChangedHandler,
  Queue,
  QueueQuickConnect,
  QuickConnect,
} from "./types";

export class ContactClient extends ConnectClientWithOptionalConfig {
  /**
   * Creates a new ContactClient instance with the specified configuration.
   *
   * @param config - The configuration for the client. Can be provided as:
   *   - An AmazonConnectProvider instance directly: `new ContactClient(provider)`
   *   - An object with provider: `new ContactClient({ provider })`
   *
   * @example
   * ```typescript
   * // Recommended: Pass provider directly
   * const client = new ContactClient(provider);
   *
   * // Alternative: Pass as object
   * const client = new ContactClient({ provider });
   * ```
   */
  constructor(config: ConnectClientConfig);

  /**
   * @deprecated Calling ContactClient without AmazonConnectProvider is deprecated and will be removed in a future version.
   * Please provide an AmazonConnectProvider instance: `new ContactClient(provider)`
   */
  constructor(config?: ConnectClientConfigDeprecated);

  constructor(config: ConnectClientConfigOptional) {
    super(contactNamespace, config);
  }

  // requests
  getAttributes(
    contactId: string,
    attributes: ContactAttributeFilter,
  ): Promise<Record<string, string>> {
    const requestData: GetAttributesRequest = {
      contactId,
      attributes,
    };

    return this.context.proxy.request(ContactRoutes.getAttributes, requestData);
  }

  async getAttribute(
    contactId: string,
    attribute: string,
  ): Promise<string | undefined> {
    const result = await this.getAttributes(contactId, [attribute]);
    return result[attribute];
  }

  async getInitialContactId(contactId: string): Promise<string | undefined> {
    const data: Record<string, string> = await this.context.proxy.request(
      ContactRoutes.getInitialContactId,
      { contactId },
    );
    return data.initialContactId;
  }

  /**
   * @deprecated Use `getChannelType` instead.
   */
  async getType(contactId: string): Promise<ContactType> {
    const data: Record<string, ContactType> = await this.context.proxy.request(
      ContactRoutes.getType,
      { contactId },
    );
    return data.type;
  }

  async getStateDuration(contactId: string): Promise<number> {
    const data: Record<string, number> = await this.context.proxy.request(
      ContactRoutes.getStateDuration,
      { contactId },
    );
    return data.stateDuration;
  }

  getQueue(contactId: string): Promise<Queue> {
    return this.context.proxy.request(ContactRoutes.getQueue, {
      contactId,
    });
  }

  async getQueueTimestamp(contactId: string): Promise<Date | undefined> {
    const data: Record<string, Date> = await this.context.proxy.request(
      ContactRoutes.getQueueTimestamp,
      { contactId },
    );
    return data.queueTimestamp;
  }

  onStartingAcw(handler: ContactStartingAcwHandler, contactId?: string) {
    this.context.proxy.subscribe(
      { key: ContactLifecycleTopicKey.StartingACW, parameter: contactId },
      handler,
    );
  }
  /**
   * @deprecated Use `onCleared` instead.
   */
  onDestroyed(handler: ContactDestroyedHandler, contactId?: string): void {
    this.context.proxy.subscribe(
      { key: ContactLifecycleTopicKey.Destroyed, parameter: contactId },
      handler,
    );
  }
  onConnected(handler: ContactConnectedHandler, contactId?: string): void {
    this.context.proxy.subscribe(
      { key: ContactLifecycleTopicKey.Connected, parameter: contactId },
      handler,
    );
  }

  onMissed(handler: ContactMissedHandler, contactId?: string): void {
    this.context.proxy.subscribe(
      { key: ContactLifecycleTopicKey.Missed, parameter: contactId },
      handler,
    );
  }

  onIncoming(handler: ContactIncomingHandler, contactId?: string): void {
    this.context.proxy.subscribe(
      { key: ContactLifecycleTopicKey.Incoming, parameter: contactId },
      handler,
    );
  }
  offStartingAcw(handler: ContactStartingAcwHandler, contactId?: string) {
    this.context.proxy.unsubscribe(
      { key: ContactLifecycleTopicKey.StartingACW, parameter: contactId },
      handler,
    );
  }
  /**
   * @deprecated Use `offCleared` instead.
   */
  offDestroyed(handler: ContactDestroyedHandler, contactId?: string): void {
    this.context.proxy.unsubscribe(
      { key: ContactLifecycleTopicKey.Destroyed, parameter: contactId },
      handler,
    );
  }
  offMissed(handler: ContactMissedHandler, contactId?: string): void {
    this.context.proxy.unsubscribe(
      { key: ContactLifecycleTopicKey.Missed, parameter: contactId },
      handler,
    );
  }

  offIncoming(handler: ContactIncomingHandler, contactId?: string): void {
    this.context.proxy.unsubscribe(
      { key: ContactLifecycleTopicKey.Incoming, parameter: contactId },
      handler,
    );
  }
  offConnected(handler: ContactConnectedHandler, contactId?: string): void {
    this.context.proxy.unsubscribe(
      { key: ContactLifecycleTopicKey.Connected, parameter: contactId },
      handler,
    );
  }

  async getChannelType(contactId: string): Promise<ContactChannelType> {
    return await this.context.proxy.request(ContactRoutes.getChannelType, {
      contactId,
    });
  }

  addParticipant(
    contactId: string,
    quickConnect: QuickConnect,
  ): Promise<AddParticipantResult> {
    return this.context.proxy.request(ContactRoutes.addParticipant, {
      contactId,
      quickConnect,
    });
  }

  transfer(
    contactId: string,
    quickConnect: AgentQuickConnect | QueueQuickConnect,
  ): Promise<void> {
    return this.context.proxy.request(ContactRoutes.transfer, {
      contactId,
      quickConnect,
    });
  }

  onCleared(handler: ContactClearedHandler, contactId?: string): void {
    this.context.proxy.subscribe(
      { key: ContactLifecycleTopicKey.Cleared, parameter: contactId },
      handler,
    );
  }

  offCleared(handler: ContactClearedHandler, contactId?: string): void {
    this.context.proxy.unsubscribe(
      { key: ContactLifecycleTopicKey.Cleared, parameter: contactId },
      handler,
    );
  }

  accept(contactId: string): Promise<void> {
    return this.context.proxy.request(ContactRoutes.accept, {
      contactId,
    });
  }

  clear(contactId: string): Promise<void> {
    return this.context.proxy.request(ContactRoutes.clear, {
      contactId,
    });
  }
  
  async isPreviewMode(contactId: string): Promise<boolean> {
    const response: Record<string, boolean> = await this.context.proxy.request(
      ContactRoutes.isPreviewMode,
      { contactId },
    );

    return response.isPreviewMode;
  }

  async getPreviewConfiguration(
    contactId: string,
  ): Promise<GetPreviewConfigurationResponse> {
    const response: GetPreviewConfigurationResponse =
      await this.context.proxy.request(ContactRoutes.getPreviewConfiguration, {
        contactId,
      });

    return response;
  }

  async engagePreviewContact(contactId: string): Promise<AddParticipantResult> {
    return this.context.proxy.request(ContactRoutes.engagePreviewContact, {
      contactId,
    });
  }

  async getContactRegion(contactId: string): Promise<string> {
    const { region } = await this.context.proxy.request<{
      region: string;
    }>(ContactRoutes.getContactRegion, {
      contactId,
    });
    return region;
  }

  async getInstanceDetails(contactId: string): Promise<InstanceDetails> {
    return await this.context.proxy.request(ContactRoutes.getInstanceDetails, {
      contactId,
    });
  }

  /**
   * Retrieves all participants associated with a specific contact.
   * @param contactId - The unique identifier for the contact
   * @returns Promise resolving to array of participant information
   */
  listParticipants(contactId: string): Promise<ParticipantData[]> {
    return this.context.proxy.request(ContactRoutes.listParticipants, {
      contactId,
    });
  }

  /**
   * Retrieves information for a specific participant.
   * @param participantId - The unique identifier for the participant
   * @returns Promise resolving to participant information
   */
  getParticipant(participantId: string): Promise<ParticipantData> {
    return this.context.proxy.request(ContactRoutes.getParticipant, {
      participantId,
    });
  }

  /**
   * Retrieves the current state of a specific participant.
   * @param participantId - The unique identifier for the participant
   * @returns Promise resolving to current participant state
   */
  getParticipantState(participantId: string): Promise<ParticipantState> {
    return this.context.proxy.request(ContactRoutes.getParticipantState, {
      participantId,
    });
  }

  /**
   * Disconnects a specific participant from the contact.
   * @param participantId - The unique identifier for the participant to disconnect
   * @returns Promise resolving when the participant is disconnected
   */
  disconnectParticipant(participantId: string): Promise<void> {
    return this.context.proxy.request(ContactRoutes.disconnectParticipant, {
      participantId,
    });
  }

  /**
   * Retrieves detailed information for a specific contact by its ID.
   * @param contactId - The unique identifier for the contact
   * @returns Promise resolving to detailed contact information
   */
  getContact(contactId: string): Promise<ContactData> {
    return this.context.proxy.request(ContactRoutes.getContact, {
      contactId,
    });
  }

  /**
   * Lists all contacts for the current agent.
   * @returns Promise resolving to array of contact information
   */
  listContacts(): Promise<ListContactsResult> {
    return this.context.proxy.request(ContactRoutes.listContacts);
  }

  /**
   * Subscribes to participant added events.
   * @param handler - Event handler function to call when participants are added
   * @param contactId - Optional contact ID to filter events for a specific contact
   */
  onParticipantAdded(
    handler: ParticipantAddedHandler,
    contactId?: string,
  ): void {
    this.context.proxy.subscribe(
      { key: ContactTopicKey.ParticipantAdded, parameter: contactId },
      handler,
    );
  }

  /**
   * Unsubscribes from participant added events.
   * @param handler - Event handler function to remove
   * @param contactId - Optional contact ID to unsubscribe from specific contact events
   */
  offParticipantAdded(
    handler: ParticipantAddedHandler,
    contactId?: string,
  ): void {
    this.context.proxy.unsubscribe(
      { key: ContactTopicKey.ParticipantAdded, parameter: contactId },
      handler,
    );
  }

  /**
   * Subscribes to participant disconnected events.
   * @param handler - Event handler function to call when participants disconnect
   * @param contactId - Optional contact ID to filter events for a specific contact
   */
  onParticipantDisconnected(
    handler: ParticipantDisconnectedHandler,
    contactId?: string,
  ): void {
    this.context.proxy.subscribe(
      {
        key: ContactTopicKey.ParticipantDisconnected,
        parameter: contactId,
      },
      handler,
    );
  }

  /**
   * Unsubscribes from participant disconnected events.
   * @param handler - Event handler function to remove
   * @param contactId - Optional contact ID to unsubscribe from specific contact events
   */
  offParticipantDisconnected(
    handler: ParticipantDisconnectedHandler,
    contactId?: string,
  ): void {
    this.context.proxy.unsubscribe(
      {
        key: ContactTopicKey.ParticipantDisconnected,
        parameter: contactId,
      },
      handler,
    );
  }

  /**
   * Subscribes to participant state change events.
   * @param handler - Event handler function to call when participant state changes
   * @param participantId - Optional participant ID to filter events for a specific participant
   */
  onParticipantStateChanged(
    handler: ParticipantStateChangedHandler,
    participantId?: string,
  ): void {
    this.context.proxy.subscribe(
      {
        key: ContactTopicKey.ParticipantStateChanged,
        parameter: participantId,
      },
      handler,
    );
  }

  /**
   * Unsubscribes from participant state change events.
   * @param handler - Event handler function to remove
   * @param participantId - Optional participant ID to unsubscribe from specific participant events
   */
  offParticipantStateChanged(
    handler: ParticipantStateChangedHandler,
    participantId?: string,
  ): void {
    this.context.proxy.unsubscribe(
      {
        key: ContactTopicKey.ParticipantStateChanged,
        parameter: participantId,
      },
      handler,
    );
  }
}
