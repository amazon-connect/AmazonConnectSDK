import { ConnectRequestData, ConnectResponseData, ModuleContext, ModuleProxy } from "@amazon-connect/core";
import { mock } from "jest-mock-extended";
import { ContactClient } from "./contact-client";
import { ContactAcceptedHandler, ContactAcceptedEventData, ContactLifecycleTopic, ContactAcwHandler, ContactAcwEventData, ContactConnectedHandler, ContactConnectedEventData, ContactConnectingHandler, ContactConnectingEventData, ContactDestroyHandler, ContactDestroyEventData, ContactEndedHandler, ContactEndedEventData, ContactErrorHandler, ContactErrorEventData, ContactIncomingHandler, ContactIncomingEventData, ContactMissedHandler, ContactMissedEventData, ContactPendingHandler, ContactPendingEventData } from "../event/contact-events";
import {
  ContactRequests,
  ContactState,
  ContactStateType,
  Queue,
  ReferenceDictionary,
  ReferenceType,
  PhoneNumber
} from "../request";

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
        contactClient.onIncoming(handler);
        expect(onSpy).toBeCalledWith(
          { key: ContactLifecycleTopic.INCOMING },
          handler,
        );
      });

      it("unsubscribes from event with handler", () => {
        const offSpy = jest.spyOn(moduleProxyMock, "unsubscribe");
        contactClient.offIncoming(handler);
        expect(offSpy).toBeCalledWith(
          { key: ContactLifecycleTopic.INCOMING },
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

  describe("Requests", () => {
    const testContactId = "CONTACT_ID";
    let requestSpy: jest.SpyInstance<
      Promise<ConnectResponseData>,
      [command: string, data?: ConnectRequestData | undefined],
      unknown
    >;

    beforeEach(() => {
      requestSpy = jest.spyOn(moduleProxyMock, "request");
    });

    test("getAttribute gets attribute if present in result", async () => {
      const key = "TEST_KEY";
      const value = "TEST_VALUE";
      const expectedResponse = { [key]: value };
      requestSpy.mockReturnValue(
        new Promise((resolve) => resolve(expectedResponse)),
      );
      const actualResult = await contactClient.getAttribute(testContactId, key);
      expect(requestSpy).toHaveBeenCalledWith(ContactRequests.getAttributes, {
        contactId: testContactId,
        attributes: [key],
      });
      expect(actualResult).toEqual(value);
    });

    test("getAttribute returns null if attribute not present in result", async () => {
      const key = "TEST_KEY";
      const value = "TEST_VALUE";
      const expectedResponse = { OTHER_KEY: value };
      requestSpy.mockReturnValue(
        new Promise((resolve) => resolve(expectedResponse)),
      );
      const actualResult = await contactClient.getAttribute(testContactId, key);
      expect(requestSpy).toHaveBeenCalledWith(ContactRequests.getAttributes, {
        contactId: testContactId,
        attributes: [key],
      });
      expect(actualResult).toBeNull();
    });

    test("getAttributes passes attributes list if provided", async () => {
      const attributes = ["ATTRIBUTE_1", "ATTRIBUTE_2"];
      requestSpy.mockReturnValue(new Promise((resolve) => resolve()));
      await contactClient.getAttributes(testContactId, attributes);
      expect(requestSpy).toHaveBeenCalledWith(ContactRequests.getAttributes, {
        contactId: testContactId,
        attributes,
      });
    });

    test("getInitialContactId returns result if available", async () => {
      const expectedResult = "CONTACT_ID";
      requestSpy.mockReturnValue(
        new Promise((resolve) => resolve({ initialContactId: expectedResult })),
      );
      const actualResult =
        await contactClient.getInitialContactId(testContactId);
      expect(requestSpy).toHaveBeenCalledWith(
        ContactRequests.getInitialContactId,
        {
          contactId: testContactId,
        },
      );
      expect(actualResult).toBe(expectedResult);
    });

    test("getInitialContactId returns null if result not available", async () => {
      requestSpy.mockReturnValue(
        new Promise((resolve) => resolve({ initialContactId: undefined })),
      );
      const actualResult =
        await contactClient.getInitialContactId(testContactId);
      expect(requestSpy).toHaveBeenCalledWith(
        ContactRequests.getInitialContactId,
        {
          contactId: testContactId,
        },
      );
      expect(actualResult).toBeNull();
    });

    test("getType returns result", async () => {
      const expectedResult: string = "voice";
      requestSpy.mockReturnValue(
        new Promise((resolve) => resolve({ type: expectedResult })),
      );
      const actualResult = await contactClient.getType(testContactId);
      expect(requestSpy).toHaveBeenCalledWith(ContactRequests.getType, {
        contactId: testContactId,
      });
      expect(actualResult).toBe(expectedResult);
    });

    test("getState returns result", async () => {
      const expectedResult: ContactState = {
        type: ContactStateType.INIT,
        timestamp: new Date(),
      };
      requestSpy.mockReturnValue(
        new Promise((resolve) => resolve(expectedResult)),
      );
      const actualResult = await contactClient.getState(testContactId);
      expect(requestSpy).toHaveBeenCalledWith(ContactRequests.getState, {
        contactId: testContactId,
      });
      expect(actualResult).toBe(expectedResult);
    });

    test("getStateDuration returns result", async () => {
      const expectedResult = 1000;
      requestSpy.mockReturnValue(
        new Promise((resolve) => resolve({ stateDuration: expectedResult })),
      );
      const actualResult = await contactClient.getStateDuration(testContactId);
      expect(requestSpy).toHaveBeenCalledWith(
        ContactRequests.getStateDuration,
        {
          contactId: testContactId,
        },
      );
      expect(actualResult).toBe(expectedResult);
    });

    test("getQueue returns result", async () => {
      const expectedResult: Queue = {
        name: "NAME",
        queueARN: "ARN",
        queueId: "ARN",
      };
      requestSpy.mockReturnValue(
        new Promise((resolve) => resolve(expectedResult)),
      );
      const actualResult = await contactClient.getQueue(testContactId);
      expect(requestSpy).toHaveBeenCalledWith(ContactRequests.getQueue, {
        contactId: testContactId,
      });
      expect(actualResult).toBe(expectedResult);
    });

    test("getQueueTimestamp returns result", async () => {
      const expectedResult = new Date();
      requestSpy.mockReturnValue(
        new Promise((resolve) => resolve({ queueTimestamp: expectedResult })),
      );
      const actualResult = await contactClient.getQueueTimestamp(testContactId);
      expect(requestSpy).toHaveBeenCalledWith(
        ContactRequests.getQueueTimestamp,
        {
          contactId: testContactId,
        },
      );
      expect(actualResult).toBe(expectedResult);
    });

    test("getName returns result if available", async () => {
      const expectedResult = "NAME";
      requestSpy.mockReturnValue(
        new Promise((resolve) => resolve({ name: expectedResult })),
      );
      const actualResult = await contactClient.getName(testContactId);
      expect(requestSpy).toHaveBeenCalledWith(ContactRequests.getName, {
        contactId: testContactId,
      });
      expect(actualResult).toBe(expectedResult);
    });

    test("getName returns null if result not available", async () => {
      requestSpy.mockReturnValue(
        new Promise((resolve) => resolve({ name: undefined })),
      );
      const actualResult = await contactClient.getName(testContactId);
      expect(requestSpy).toHaveBeenCalledWith(ContactRequests.getName, {
        contactId: testContactId,
      });
      expect(actualResult).toBeNull();
    });

    test("getDescription returns result if available", async () => {
      const expectedResult = "DESCRIPTION";
      requestSpy.mockReturnValue(
        new Promise((resolve) => resolve({ description: expectedResult })),
      );
      const actualResult = await contactClient.getDescription(testContactId);
      expect(requestSpy).toHaveBeenCalledWith(ContactRequests.getDescription, {
        contactId: testContactId,
      });
      expect(actualResult).toBe(expectedResult);
    });

    test("getDescription returns null if result not available", async () => {
      requestSpy.mockReturnValue(
        new Promise((resolve) => resolve({ description: undefined })),
      );
      const actualResult = await contactClient.getDescription(testContactId);
      expect(requestSpy).toHaveBeenCalledWith(ContactRequests.getDescription, {
        contactId: testContactId,
      });
      expect(actualResult).toBeNull();
    });

    test("getReferences returns result if available", async () => {
      const expectedResult: ReferenceDictionary = {
        Reference1: { type: ReferenceType.URL, value: "some URL" },
      };
      requestSpy.mockReturnValue(
        new Promise((resolve) => resolve(expectedResult)),
      );
      const actualResult = await contactClient.getReferences(testContactId);
      expect(requestSpy).toHaveBeenCalledWith(ContactRequests.getReferences, {
        contactId: testContactId,
      });
      expect(actualResult).toBe(expectedResult);
    });

    test("getReferences returns null if result not available", async () => {
      requestSpy.mockReturnValue(new Promise((resolve) => resolve(undefined)));
      const actualResult = await contactClient.getReferences(testContactId);
      expect(requestSpy).toHaveBeenCalledWith(ContactRequests.getReferences, {
        contactId: testContactId,
      });
      expect(actualResult).toBeNull();
    });
  });
});

function createHandler<T>() {
  return (data: T) => {
    console.log(data);
    return Promise.resolve();
  };
}
