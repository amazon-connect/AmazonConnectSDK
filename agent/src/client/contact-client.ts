import { ConnectClient, ConnectClientConfig } from "@amazon-connect/core";

import { agentNamespace } from "../namespace";
import { Queue } from "../request/agent-request";
import {
  ContactAttributeFilter,
  ContactRequests,
  ContactState,
  ContactType,
  CustomerDetails,
  GetAttributesRequest,
  ReferenceDictionary,
} from "../request/contact-request";
import { ContactAcceptedHandler, ContactLifecycleTopic, ContactAcwHandler, ContactConnectedHandler, ContactConnectingHandler, ContactDestroyHandler, ContactEndedHandler, ContactErrorHandler, ContactIncomingHandler, ContactMissedHandler, ContactPendingHandler } from "../event/contact-events";

export class ContactClient extends ConnectClient {
  constructor(config?: ConnectClientConfig) {
    super(agentNamespace, config);
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
  ): Promise<string | null> {
    const result = await this.getAttributes(contactId, [attribute]);
    return result[attribute] ?? null;
  }

  async getCustomerDetails(contactId: string): Promise<CustomerDetails> {
    const data: CustomerDetails = await this.context.proxy.request(
      ContactRequests.getCustomerDetails,
      {
        contactId,
      },
    );
    return data;
  }

  async getInitialContactId(contactId: string): Promise<string | null> {
    const data: Record<string, string> = await this.context.proxy.request(
      ContactRequests.getInitialContactId,
      { contactId },
    );
    return data.initialContactId ?? null;
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

  async getQueueTimestamp(contactId: string): Promise<Date | null> {
    const data: Record<string, Date> = await this.context.proxy.request(
      ContactRequests.getQueueTimestamp,
      { contactId },
    );
    return data.queueTimestamp ?? null;
  }

  async getName(contactId: string): Promise<string | null> {
    const data: Record<string, string> = await this.context.proxy.request(
      ContactRequests.getName,
      { contactId },
    );
    return data.name ?? null;
  }

  async getDescription(contactId: string): Promise<string | null> {
    const data: Record<string, string> = await this.context.proxy.request(
      ContactRequests.getDescription,
      { contactId },
    );
    return data.description ?? null;
  }

  async getReferences(contactId: string): Promise<ReferenceDictionary | null> {
    const data: ReferenceDictionary | void = await this.context.proxy.request(
      ContactRequests.getReferences,
      {
        contactId,
      },
    );
    return data ?? null;
  }

  // lifecycle

  onAccepted(handler: ContactAcceptedHandler, contactId: string): void {
    this.context.proxy.subscribe(
      { key: ContactLifecycleTopic.ACCEPTED, parameter: contactId },
      handler
    );
  }

  onAcw(handler: ContactAcwHandler, contactId: string) {
    this.context.proxy.subscribe(
      { key: ContactLifecycleTopic.ACW, parameter: contactId },
      handler,
    );
  }

  onConnected(handler: ContactConnectedHandler, contactId: string): void {
    this.context.proxy.subscribe(
      { key: ContactLifecycleTopic.CONNECTED, parameter: contactId },
      handler,
    );
  }

  onConnecting(handler: ContactConnectingHandler, contactId: string): void {
    this.context.proxy.subscribe(
      { key: ContactLifecycleTopic.CONNECTING, parameter: contactId },
      handler,
    );
  }

  onDestroy(handler: ContactDestroyHandler, contactId: string): void {
    this.context.proxy.subscribe(
      { key: ContactLifecycleTopic.DESTROY, parameter: contactId },
      handler,
    );
  }

  onEnded(handler: ContactEndedHandler, contactId: string) {
    this.context.proxy.subscribe(
      { key: ContactLifecycleTopic.ENDED, parameter: contactId },
      handler,
    );
  }

  onError(handler: ContactErrorHandler, contactId: string): void {
    this.context.proxy.subscribe(
      { key: ContactLifecycleTopic.ERROR, parameter: contactId },
      handler,
    );
  }

  onIncoming(handler: ContactIncomingHandler, contactId: string): void {
    this.context.proxy.subscribe(
      { key: ContactLifecycleTopic.INCOMING, parameter: contactId },
      handler,
    );
  }

  onMissed(handler: ContactMissedHandler, contactId: string): void {
    this.context.proxy.subscribe(
      { key: ContactLifecycleTopic.MISSED, parameter: contactId },
      handler,
    );
  }

  onPending(handler: ContactPendingHandler, contactId: string): void {
    this.context.proxy.subscribe(
      { key: ContactLifecycleTopic.PENDING, parameter: contactId },
      handler,
    );
  }

  offAccepted(handler: ContactAcceptedHandler, contactId: string): void {
    this.context.proxy.unsubscribe(
      { key: ContactLifecycleTopic.ACCEPTED, parameter: contactId },
      handler,
    );
  }

  offAcw(handler: ContactAcwHandler, contactId: string) {
    this.context.proxy.unsubscribe(
      { key: ContactLifecycleTopic.ACW, parameter: contactId },
      handler,
    );
  }

  offConnected(handler: ContactConnectedHandler, contactId: string): void {
    this.context.proxy.unsubscribe(
      { key: ContactLifecycleTopic.CONNECTED, parameter: contactId },
      handler,
    );
  }

  offConnecting(handler: ContactConnectingHandler, contactId: string): void {
    this.context.proxy.unsubscribe(
      { key: ContactLifecycleTopic.CONNECTING, parameter: contactId },
      handler,
    );
  }

  offDestroy(handler: ContactDestroyHandler, contactId: string): void {
    this.context.proxy.unsubscribe(
      { key: ContactLifecycleTopic.DESTROY, parameter: contactId },
      handler,
    );
  }

  offEnded(handler: ContactEndedHandler, contactId: string) {
    this.context.proxy.unsubscribe(
      { key: ContactLifecycleTopic.ENDED, parameter: contactId },
      handler,
    );
  }

  offError(handler: ContactErrorHandler, contactId: string): void {
    this.context.proxy.unsubscribe(
      { key: ContactLifecycleTopic.ERROR, parameter: contactId },
      handler,
    );
  }

  offIncoming(handler: ContactIncomingHandler, contactId: string): void {
    this.context.proxy.unsubscribe(
      { key: ContactLifecycleTopic.INCOMING, parameter: contactId },
      handler,
    );
  }

  offMissed(handler: ContactMissedHandler, contactId: string): void {
    this.context.proxy.unsubscribe(
      { key: ContactLifecycleTopic.MISSED, parameter: contactId },
      handler,
    );
  }

  offPending(handler: ContactPendingHandler, contactId: string): void {
    this.context.proxy.unsubscribe(
      { key: ContactLifecycleTopic.PENDING, parameter: contactId },
      handler,
    );
  }
}
