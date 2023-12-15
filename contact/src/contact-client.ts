import { ConnectClient, ConnectClientConfig } from "@amazon-connect/core";

import { contactNamespace } from "./namespace";
import { ContactRoutes } from "./routes";
import { ContactLifecycleTopicKey } from "./topic-keys";
import {
  ContactAttributeFilter,
  ContactConnectedHandler,
  ContactConnectingHandler,
  ContactDestroyedHandler,
  ContactErrorHandler,
  ContactIncomingHandler,
  ContactMissedHandler,
  ContactPendingHandler,
  ContactStartingAcwHandler,
  ContactType,
  GetAttributesRequest,
  Queue,
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

  onConnected(handler: ContactConnectedHandler, contactId?: string): void {
    this.context.proxy.subscribe(
      { key: ContactLifecycleTopicKey.Connected, parameter: contactId },
      handler,
    );
  }

  onConnecting(handler: ContactConnectingHandler, contactId?: string): void {
    this.context.proxy.subscribe(
      { key: ContactLifecycleTopicKey.Connecting, parameter: contactId },
      handler,
    );
  }

  onDestroyed(handler: ContactDestroyedHandler, contactId?: string): void {
    this.context.proxy.subscribe(
      { key: ContactLifecycleTopicKey.Destroyed, parameter: contactId },
      handler,
    );
  }

  onError(handler: ContactErrorHandler, contactId?: string): void {
    this.context.proxy.subscribe(
      { key: ContactLifecycleTopicKey.Error, parameter: contactId },
      handler,
    );
  }

  onIncoming(handler: ContactIncomingHandler): void {
    this.context.proxy.subscribe(
      { key: ContactLifecycleTopicKey.Incoming },
      handler,
    );
  }

  onMissed(handler: ContactMissedHandler, contactId?: string): void {
    this.context.proxy.subscribe(
      { key: ContactLifecycleTopicKey.Missed, parameter: contactId },
      handler,
    );
  }

  onPending(handler: ContactPendingHandler, contactId?: string): void {
    this.context.proxy.subscribe(
      { key: ContactLifecycleTopicKey.Pending, parameter: contactId },
      handler,
    );
  }

  offStartingAcw(handler: ContactStartingAcwHandler, contactId?: string) {
    this.context.proxy.unsubscribe(
      { key: ContactLifecycleTopicKey.StartingACW, parameter: contactId },
      handler,
    );
  }

  offConnected(handler: ContactConnectedHandler, contactId?: string): void {
    this.context.proxy.unsubscribe(
      { key: ContactLifecycleTopicKey.Connected, parameter: contactId },
      handler,
    );
  }

  offConnecting(handler: ContactConnectingHandler, contactId?: string): void {
    this.context.proxy.unsubscribe(
      { key: ContactLifecycleTopicKey.Connecting, parameter: contactId },
      handler,
    );
  }

  offDestroyed(handler: ContactDestroyedHandler, contactId?: string): void {
    this.context.proxy.unsubscribe(
      { key: ContactLifecycleTopicKey.Destroyed, parameter: contactId },
      handler,
    );
  }
  offError(handler: ContactErrorHandler, contactId?: string): void {
    this.context.proxy.unsubscribe(
      { key: ContactLifecycleTopicKey.Error, parameter: contactId },
      handler,
    );
  }

  offIncoming(handler: ContactIncomingHandler): void {
    this.context.proxy.unsubscribe(
      { key: ContactLifecycleTopicKey.Incoming },
      handler,
    );
  }

  offMissed(handler: ContactMissedHandler, contactId?: string): void {
    this.context.proxy.unsubscribe(
      { key: ContactLifecycleTopicKey.Missed, parameter: contactId },
      handler,
    );
  }

  offPending(handler: ContactPendingHandler, contactId?: string): void {
    this.context.proxy.unsubscribe(
      { key: ContactLifecycleTopicKey.Pending, parameter: contactId },
      handler,
    );
  }
}
