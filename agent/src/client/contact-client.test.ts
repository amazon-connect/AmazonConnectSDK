import { ModuleContext, ModuleProxy } from "@amazon-connect/core";
import { mock } from "jest-mock-extended";

import {
  ContactAcceptedEventData,
  ContactAcceptedHandler,
  ContactAcwEventData,
  ContactAcwHandler,
  ContactConnectedEventData,
  ContactConnectedHandler,
  ContactConnectingEventData,
  ContactConnectingHandler,
  ContactDestroyEventData,
  ContactDestroyHandler,
  ContactEndedEventData,
  ContactEndedHandler,
  ContactErrorEventData,
  ContactErrorHandler,
  ContactIncomingEventData,
  ContactIncomingHandler,
  ContactLifecycleTopic,
  ContactMissedEventData,
  ContactMissedHandler,
  ContactPendingEventData,
  ContactPendingHandler,
} from "../event/contact-events";
import { ContactClient } from "./contact-client";

const currentContact = "CURRENT_CONTACT";

const moduleProxyMock = mock<ModuleProxy>();
const moduleContextMock = mock<ModuleContext>();

Object.defineProperty(moduleContextMock, "proxy", {
  get() {
    return moduleProxyMock;
  },
});

beforeEach(jest.resetAllMocks);

describe("ContactClient", () => {
  const contactClient = new ContactClient({
    context: moduleContextMock,
  });

  describe("Events", () => {
    describe("ACCEPTED", () => {
      const handler: ContactAcceptedHandler =
        createHandler<ContactAcceptedEventData>();

      it("subscribes to event with handler", () => {
        const onSpy = jest.spyOn(moduleProxyMock, "subscribe");
        contactClient.onAccepted(handler, currentContact);
        expect(onSpy).toBeCalledWith(
          { key: ContactLifecycleTopic.ACCEPTED, parameter: currentContact },
          handler,
        );
      });

      it("unsubscribes from event with handler", () => {
        const offSpy = jest.spyOn(moduleProxyMock, "unsubscribe");
        contactClient.offAccepted(handler, currentContact);
        expect(offSpy).toBeCalledWith(
          { key: ContactLifecycleTopic.ACCEPTED, parameter: currentContact },
          handler,
        );
      });
    });

    describe("ACW", () => {
      const handler: ContactAcwHandler = createHandler<ContactAcwEventData>();

      it("subscribes to event with handler", () => {
        const onSpy = jest.spyOn(moduleProxyMock, "subscribe");
        contactClient.onAcw(handler, currentContact);
        expect(onSpy).toBeCalledWith(
          { key: ContactLifecycleTopic.ACW, parameter: currentContact },
          handler,
        );
      });

      it("unsubscribes from event with handler", () => {
        const offSpy = jest.spyOn(moduleProxyMock, "unsubscribe");
        contactClient.offAcw(handler, currentContact);
        expect(offSpy).toBeCalledWith(
          { key: ContactLifecycleTopic.ACW, parameter: currentContact },
          handler,
        );
      });
    });

    describe("CONNECTED", () => {
      const handler: ContactConnectedHandler =
        createHandler<ContactConnectedEventData>();

      it("subscribes to event with handler", () => {
        const onSpy = jest.spyOn(moduleProxyMock, "subscribe");
        contactClient.onConnected(handler, currentContact);
        expect(onSpy).toBeCalledWith(
          { key: ContactLifecycleTopic.CONNECTED, parameter: currentContact },
          handler,
        );
      });

      it("unsubscribes from event with handler", () => {
        const offSpy = jest.spyOn(moduleProxyMock, "unsubscribe");
        contactClient.offConnected(handler, currentContact);
        expect(offSpy).toBeCalledWith(
          { key: ContactLifecycleTopic.CONNECTED, parameter: currentContact },
          handler,
        );
      });
    });

    describe("CONNECTING", () => {
      const handler: ContactConnectingHandler =
        createHandler<ContactConnectingEventData>();

      it("subscribes to event with handler", () => {
        const onSpy = jest.spyOn(moduleProxyMock, "subscribe");
        contactClient.onConnecting(handler, currentContact);
        expect(onSpy).toBeCalledWith(
          { key: ContactLifecycleTopic.CONNECTING, parameter: currentContact },
          handler,
        );
      });

      it("unsubscribes from event with handler", () => {
        const offSpy = jest.spyOn(moduleProxyMock, "unsubscribe");
        contactClient.offConnecting(handler, currentContact);
        expect(offSpy).toBeCalledWith(
          { key: ContactLifecycleTopic.CONNECTING, parameter: currentContact },
          handler,
        );
      });
    });

    describe("DESTROY", () => {
      const handler: ContactDestroyHandler =
        createHandler<ContactDestroyEventData>();

      it("subscribes to event with handler", () => {
        const onSpy = jest.spyOn(moduleProxyMock, "subscribe");
        contactClient.onDestroy(handler, currentContact);
        expect(onSpy).toBeCalledWith(
          { key: ContactLifecycleTopic.DESTROY, parameter: currentContact },
          handler,
        );
      });

      it("unsubscribes from event with handler", () => {
        const offSpy = jest.spyOn(moduleProxyMock, "unsubscribe");
        contactClient.offDestroy(handler, currentContact);
        expect(offSpy).toBeCalledWith(
          { key: ContactLifecycleTopic.DESTROY, parameter: currentContact },
          handler,
        );
      });
    });

    describe("ENDED", () => {
      const handler: ContactEndedHandler =
        createHandler<ContactEndedEventData>();

      it("subscribes to event with handler", () => {
        const onSpy = jest.spyOn(moduleProxyMock, "subscribe");
        contactClient.onEnded(handler, currentContact);
        expect(onSpy).toBeCalledWith(
          { key: ContactLifecycleTopic.ENDED, parameter: currentContact },
          handler,
        );
      });

      it("unsubscribes from event with handler", () => {
        const offSpy = jest.spyOn(moduleProxyMock, "unsubscribe");
        contactClient.offEnded(handler, currentContact);
        expect(offSpy).toBeCalledWith(
          { key: ContactLifecycleTopic.ENDED, parameter: currentContact },
          handler,
        );
      });
    });

    describe("ERROR", () => {
      const handler: ContactErrorHandler =
        createHandler<ContactErrorEventData>();

      it("subscribes to event with handler", () => {
        const onSpy = jest.spyOn(moduleProxyMock, "subscribe");
        contactClient.onError(handler, currentContact);
        expect(onSpy).toBeCalledWith(
          { key: ContactLifecycleTopic.ERROR, parameter: currentContact },
          handler,
        );
      });

      it("unsubscribes from event with handler", () => {
        const offSpy = jest.spyOn(moduleProxyMock, "unsubscribe");
        contactClient.offError(handler, currentContact);
        expect(offSpy).toBeCalledWith(
          { key: ContactLifecycleTopic.ERROR, parameter: currentContact },
          handler,
        );
      });
    });

    describe("INCOMING", () => {
      const handler: ContactIncomingHandler =
        createHandler<ContactIncomingEventData>();

      it("subscribes to event with handler", () => {
        const onSpy = jest.spyOn(moduleProxyMock, "subscribe");
        contactClient.onIncoming(handler, currentContact);
        expect(onSpy).toBeCalledWith(
          { key: ContactLifecycleTopic.INCOMING, parameter: currentContact },
          handler,
        );
      });

      it("unsubscribes from event with handler", () => {
        const offSpy = jest.spyOn(moduleProxyMock, "unsubscribe");
        contactClient.offIncoming(handler, currentContact);
        expect(offSpy).toBeCalledWith(
          { key: ContactLifecycleTopic.INCOMING, parameter: currentContact },
          handler,
        );
      });
    });

    describe("MISSED", () => {
      const handler: ContactMissedHandler =
        createHandler<ContactMissedEventData>();

      it("subscribes to event with handler", () => {
        const onSpy = jest.spyOn(moduleProxyMock, "subscribe");
        contactClient.onMissed(handler, currentContact);
        expect(onSpy).toBeCalledWith(
          { key: ContactLifecycleTopic.MISSED, parameter: currentContact },
          handler,
        );
      });

      it("unsubscribes from event with handler", () => {
        const offSpy = jest.spyOn(moduleProxyMock, "unsubscribe");
        contactClient.offMissed(handler, currentContact);
        expect(offSpy).toBeCalledWith(
          { key: ContactLifecycleTopic.MISSED, parameter: currentContact },
          handler,
        );
      });
    });

    describe("PENDING", () => {
      const handler: ContactPendingHandler =
        createHandler<ContactPendingEventData>();

      it("subscribes to event with handler", () => {
        const onSpy = jest.spyOn(moduleProxyMock, "subscribe");
        contactClient.onPending(handler, currentContact);
        expect(onSpy).toBeCalledWith(
          { key: ContactLifecycleTopic.PENDING, parameter: currentContact },
          handler,
        );
      });

      it("unsubscribes from event with handler", () => {
        const offSpy = jest.spyOn(moduleProxyMock, "unsubscribe");
        contactClient.offPending(handler, currentContact);
        expect(offSpy).toBeCalledWith(
          { key: ContactLifecycleTopic.PENDING, parameter: currentContact },
          handler,
        );
      });
    });
  });
});

function createHandler<T>() {
  return (data: T) => {
    console.log(data);
    return Promise.resolve();
  };
}
