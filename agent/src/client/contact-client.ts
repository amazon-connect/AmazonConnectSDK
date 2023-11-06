import { ConnectClient, ConnectClientConfig } from "@amazon-connect/core";

import {
  ContactAcceptedHandler,
  ContactAcwHandler,
  ContactConnectedHandler,
  ContactConnectingHandler,
  ContactDestroyHandler,
  ContactEndedHandler,
  ContactErrorHandler,
  ContactIncomingHandler,
  ContactLifecycleTopic,
  ContactMissedHandler,
  ContactPendingHandler,
} from "../event/contact-events";
import { agentNamespace } from "../namespace";

export class ContactClient extends ConnectClient {
  constructor(config?: ConnectClientConfig | undefined) {
    super(agentNamespace, config);
  }

  onAccepted(handler: ContactAcceptedHandler, contactId: string): void {
    this.context.proxy.subscribe(
      { key: ContactLifecycleTopic.ACCEPTED, parameter: contactId },
      handler,
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
