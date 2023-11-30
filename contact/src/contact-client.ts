import { ConnectClient, ConnectClientConfig } from "@amazon-connect/core";

import { Queue } from "./agent-request";
import {
  ContactAcceptedHandler,
  ContactAcwHandler,
  ContactConnectedHandler,
  ContactConnectingHandler,
  ContactDestroyHandler,
  ContactErrorHandler,
  ContactIncomingHandler,
  ContactLifecycleTopic,
  ContactMissedHandler,
  ContactPendingHandler,
} from "./contact-events";
import {
  ContactAttributeFilter,
  ContactRequests,
  ContactState,
  ContactType,
  GetAttributesRequest,
  ReferenceDictionary,
} from "./contact-request";
import { contactNamespace } from "./namespace";

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

    return this.context.proxy.request(
      ContactRequests.getAttributes,
      requestData,
    );
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
      ContactRequests.getInitialContactId,
      { contactId },
    );
    return data.initialContactId;
  }

  async getType(contactId: string): Promise<ContactType> {
    const data: Record<string, ContactType> = await this.context.proxy.request(
      ContactRequests.getType,
      { contactId },
    );
    return data.type;
  }

  async getState(contactId: string): Promise<ContactState> {
    const data: ContactState = await this.context.proxy.request(
      ContactRequests.getState,
      {
        contactId,
      },
    );
    return data;
  }

  async getStateDuration(contactId: string): Promise<number> {
    const data: Record<string, number> = await this.context.proxy.request(
      ContactRequests.getStateDuration,
      { contactId },
    );
    return data.stateDuration;
  }

  async getQueue(contactId: string): Promise<Queue> {
    const data: Queue = await this.context.proxy.request(
      ContactRequests.getQueue,
      {
        contactId,
      },
    );
    return data;
  }

  async getQueueTimestamp(contactId: string): Promise<Date | undefined> {
    const data: Record<string, Date> = await this.context.proxy.request(
      ContactRequests.getQueueTimestamp,
      { contactId },
    );
    return data.queueTimestamp;
  }

  async getName(contactId: string): Promise<string | undefined> {
    const data: Record<string, string> = await this.context.proxy.request(
      ContactRequests.getName,
      { contactId },
    );
    return data.name;
  }

  async getDescription(contactId: string): Promise<string | undefined> {
    const data: Record<string, string> = await this.context.proxy.request(
      ContactRequests.getDescription,
      { contactId },
    );
    return data.description;
  }

  async getReferences(
    contactId: string,
  ): Promise<ReferenceDictionary | undefined> {
    const data: ReferenceDictionary | undefined =
      await this.context.proxy.request(ContactRequests.getReferences, {
        contactId,
      });
    return data;
  }

  // lifecycle

  onAccepted(handler: ContactAcceptedHandler, contactId?: string): void {
    this.context.proxy.subscribe(
      { key: ContactLifecycleTopic.ACCEPTED, parameter: contactId },
      handler,
    );
  }

  onAcw(handler: ContactAcwHandler, contactId?: string) {
    this.context.proxy.subscribe(
      { key: ContactLifecycleTopic.ACW, parameter: contactId },
      handler,
    );
  }

  onConnected(handler: ContactConnectedHandler, contactId?: string): void {
    this.context.proxy.subscribe(
      { key: ContactLifecycleTopic.CONNECTED, parameter: contactId },
      handler,
    );
  }

  onConnecting(handler: ContactConnectingHandler, contactId?: string): void {
    this.context.proxy.subscribe(
      { key: ContactLifecycleTopic.CONNECTING, parameter: contactId },
      handler,
    );
  }

  onDestroy(handler: ContactDestroyHandler, contactId?: string): void {
    this.context.proxy.subscribe(
      { key: ContactLifecycleTopic.DESTROY, parameter: contactId },
      handler,
    );
  }

  onError(handler: ContactErrorHandler, contactId?: string): void {
    this.context.proxy.subscribe(
      { key: ContactLifecycleTopic.ERROR, parameter: contactId },
      handler,
    );
  }

  onIncoming(handler: ContactIncomingHandler): void {
    this.context.proxy.subscribe(
      { key: ContactLifecycleTopic.INCOMING },
      handler,
    );
  }

  onMissed(handler: ContactMissedHandler, contactId?: string): void {
    this.context.proxy.subscribe(
      { key: ContactLifecycleTopic.MISSED, parameter: contactId },
      handler,
    );
  }

  onPending(handler: ContactPendingHandler, contactId?: string): void {
    this.context.proxy.subscribe(
      { key: ContactLifecycleTopic.PENDING, parameter: contactId },
      handler,
    );
  }

  offAccepted(handler: ContactAcceptedHandler, contactId?: string): void {
    this.context.proxy.unsubscribe(
      { key: ContactLifecycleTopic.ACCEPTED, parameter: contactId },
      handler,
    );
  }

  offAcw(handler: ContactAcwHandler, contactId?: string) {
    this.context.proxy.unsubscribe(
      { key: ContactLifecycleTopic.ACW, parameter: contactId },
      handler,
    );
  }

  offConnected(handler: ContactConnectedHandler, contactId?: string): void {
    this.context.proxy.unsubscribe(
      { key: ContactLifecycleTopic.CONNECTED, parameter: contactId },
      handler,
    );
  }

  offConnecting(handler: ContactConnectingHandler, contactId?: string): void {
    this.context.proxy.unsubscribe(
      { key: ContactLifecycleTopic.CONNECTING, parameter: contactId },
      handler,
    );
  }

  offDestroy(handler: ContactDestroyHandler, contactId?: string): void {
    this.context.proxy.unsubscribe(
      { key: ContactLifecycleTopic.DESTROY, parameter: contactId },
      handler,
    );
  }
  offError(handler: ContactErrorHandler, contactId?: string): void {
    this.context.proxy.unsubscribe(
      { key: ContactLifecycleTopic.ERROR, parameter: contactId },
      handler,
    );
  }

  offIncoming(handler: ContactIncomingHandler): void {
    this.context.proxy.unsubscribe(
      { key: ContactLifecycleTopic.INCOMING },
      handler,
    );
  }

  offMissed(handler: ContactMissedHandler, contactId?: string): void {
    this.context.proxy.unsubscribe(
      { key: ContactLifecycleTopic.MISSED, parameter: contactId },
      handler,
    );
  }

  offPending(handler: ContactPendingHandler, contactId?: string): void {
    this.context.proxy.unsubscribe(
      { key: ContactLifecycleTopic.PENDING, parameter: contactId },
      handler,
    );
  }
}
