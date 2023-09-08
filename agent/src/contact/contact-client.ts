import { ConnectClient, ConnectClientConfig } from "@amazon-connect/core";

import { agentNamespace } from "../namespace";
import {
  ContactLifecycleHandler,
  ContactLifecycleTopics,
} from "./contact-lifecycle";
import {
  ContactAttributeFilter,
  ContactAttributeKey,
  ContactAttributeValue,
  ContactCommands,
  ContactData,
  GetContactAttributesRequest,
  GetContactRequest,
} from "./contact-request";

export class ContactClient extends ConnectClient {
  constructor(config?: ConnectClientConfig) {
    super(agentNamespace, config);
  }

  getContactData(contactId: string): Promise<ContactData> {
    const requestData: GetContactRequest = {
      contactId,
    };
    return this.context.proxy.request(ContactCommands.getData, requestData);
  }

  getContactAttributes(
    contactId: string,
    attributes?: ContactAttributeFilter,
  ): Promise<Record<ContactAttributeKey, ContactAttributeValue>> {
    const requestData: GetContactAttributesRequest = {
      contactId,
      attributes: attributes ?? "*",
    };

    return this.context.proxy.request(
      ContactCommands.getAttributes,
      requestData,
    );
  }

  async getContactAttribute(
    contactId: string,
    attribute: ContactAttributeKey,
  ): Promise<ContactAttributeValue | null> {
    contactId;
    attribute;
    const result = await this.getContactAttributes(contactId, [attribute]);
    return result[attribute] ?? null;
  }

  onIncoming(handler: ContactLifecycleHandler, contactId?: string): void {
    return this.onLifecycleEvent(
      ContactLifecycleTopics.incoming,
      handler,
      contactId,
    );
  }
  offIncoming(handler: ContactLifecycleHandler, contactId?: string): void {
    return this.offLifecycleEvent(
      ContactLifecycleTopics.incoming,
      handler,
      contactId,
    );
  }

  onPending(handler: ContactLifecycleHandler, contactId?: string): void {
    return this.onLifecycleEvent(
      ContactLifecycleTopics.pending,
      handler,
      contactId,
    );
  }
  offPending(handler: ContactLifecycleHandler, contactId?: string): void {
    return this.offLifecycleEvent(
      ContactLifecycleTopics.pending,
      handler,
      contactId,
    );
  }

  onConnecting(handler: ContactLifecycleHandler, contactId?: string): void {
    return this.onLifecycleEvent(
      ContactLifecycleTopics.connecting,
      handler,
      contactId,
    );
  }
  offConnecting(handler: ContactLifecycleHandler, contactId?: string): void {
    return this.offLifecycleEvent(
      ContactLifecycleTopics.connecting,
      handler,
      contactId,
    );
  }

  onConnected(handler: ContactLifecycleHandler, contactId?: string): void {
    return this.onLifecycleEvent(
      ContactLifecycleTopics.connected,
      handler,
      contactId,
    );
  }
  offConnected(handler: ContactLifecycleHandler, contactId?: string): void {
    return this.offLifecycleEvent(
      ContactLifecycleTopics.connected,
      handler,
      contactId,
    );
  }

  onMissed(handler: ContactLifecycleHandler, contactId?: string): void {
    return this.onLifecycleEvent(
      ContactLifecycleTopics.missed,
      handler,
      contactId,
    );
  }
  offMissed(handler: ContactLifecycleHandler, contactId?: string): void {
    return this.offLifecycleEvent(
      ContactLifecycleTopics.missed,
      handler,
      contactId,
    );
  }

  onAccepted(handler: ContactLifecycleHandler, contactId?: string): void {
    return this.onLifecycleEvent(
      ContactLifecycleTopics.accepted,
      handler,
      contactId,
    );
  }
  offAccepted(handler: ContactLifecycleHandler, contactId?: string): void {
    return this.offLifecycleEvent(
      ContactLifecycleTopics.accepted,
      handler,
      contactId,
    );
  }

  onAfterContactWork(
    handler: ContactLifecycleHandler,
    contactId?: string,
  ): void {
    return this.onLifecycleEvent(
      ContactLifecycleTopics.afterContactWork,
      handler,
      contactId,
    );
  }
  offAfterContactWork(
    handler: ContactLifecycleHandler,
    contactId?: string,
  ): void {
    return this.offLifecycleEvent(
      ContactLifecycleTopics.afterContactWork,
      handler,
      contactId,
    );
  }

  onDestroy(handler: ContactLifecycleHandler, contactId?: string): void {
    return this.onLifecycleEvent(
      ContactLifecycleTopics.destroy,
      handler,
      contactId,
    );
  }
  offDestroy(handler: ContactLifecycleHandler, contactId?: string): void {
    return this.offLifecycleEvent(
      ContactLifecycleTopics.destroy,
      handler,
      contactId,
    );
  }

  onEnded(handler: ContactLifecycleHandler, contactId?: string): void {
    return this.onLifecycleEvent(
      ContactLifecycleTopics.ended,
      handler,
      contactId,
    );
  }
  offEnded(handler: ContactLifecycleHandler, contactId?: string): void {
    return this.offLifecycleEvent(
      ContactLifecycleTopics.ended,
      handler,
      contactId,
    );
  }

  onError(handler: ContactLifecycleHandler, contactId?: string): void {
    return this.onLifecycleEvent(
      ContactLifecycleTopics.error,
      handler,
      contactId,
    );
  }
  offError(handler: ContactLifecycleHandler, contactId?: string): void {
    return this.offLifecycleEvent(
      ContactLifecycleTopics.error,
      handler,
      contactId,
    );
  }

  onRefresh(handler: ContactLifecycleHandler, contactId?: string): void {
    return this.onLifecycleEvent(
      ContactLifecycleTopics.refresh,
      handler,
      contactId,
    );
  }
  offRefresh(handler: ContactLifecycleHandler, contactId?: string): void {
    return this.offLifecycleEvent(
      ContactLifecycleTopics.refresh,
      handler,
      contactId,
    );
  }

  private onLifecycleEvent(
    key: ContactLifecycleTopics,
    handler: ContactLifecycleHandler,
    contactId: string | undefined,
  ) {
    this.context.proxy.subscribe(
      {
        key,
        parameter: contactId,
      },
      handler,
    );
  }

  private offLifecycleEvent(
    key: ContactLifecycleTopics,
    handler: ContactLifecycleHandler,
    contactId: string | undefined,
  ) {
    this.context.proxy.unsubscribe(
      {
        key,
        parameter: contactId,
      },
      handler,
    );
  }
}
