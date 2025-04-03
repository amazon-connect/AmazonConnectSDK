import { ConnectClient, ConnectClientConfig } from "@amazon-connect/core";

import { contactNamespace } from "./namespace";
import { ContactRoutes } from "./routes";
import { ContactLifecycleTopicKey } from "./topic-keys";
import {
  AddParticipantResult,
  AgentQuickConnect,
  ContactAttributeFilter,
  ContactChannelType,
  ContactClearedHandler,
  ContactConnectedHandler,
  ContactDestroyedHandler,
  ContactMissedHandler,
  ContactStartingAcwHandler,
  ContactType,
  GetAttributesRequest,
  Queue,
  QueueQuickConnect,
  QuickConnect,
} from "./types";

export class ContactClient extends ConnectClient {
  constructor(config?: ConnectClientConfig) {
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
}
