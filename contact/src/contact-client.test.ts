import { ModuleContext, ModuleProxy } from "@amazon-connect/core";
import { mock } from "jest-mock-extended";

import { ContactClient } from "./contact-client";
import { ContactRoutes } from "./routes";
import { ContactLifecycleTopicKey, ContactTopicKey } from "./topic-keys";
import { AgentQuickConnect, ContactData, InstanceDetails, Queue, QuickConnect } from "./types";

const currentContact = "CURRENT_CONTACT";

const moduleProxyMock = mock<ModuleProxy>();
const moduleContextMock = mock<ModuleContext>({
  proxy: moduleProxyMock,
});

let sut: ContactClient;

beforeEach(jest.resetAllMocks);

beforeEach(() => {
  sut = new ContactClient({
    context: moduleContextMock,
  });
});

describe("ContactClient", () => {
  describe("Events", () => {
    describe("Starting ACW", () => {
      test("subscribes to event with handler", () => {
        const handler = jest.fn();

        sut.onStartingAcw(handler, currentContact);

        expect(moduleProxyMock.subscribe).toHaveBeenCalledWith(
          {
            key: ContactLifecycleTopicKey.StartingACW,
            parameter: currentContact,
          },
          handler,
        );
      });

      test("unsubscribes from event with handler", () => {
        const handler = jest.fn();

        sut.offStartingAcw(handler, currentContact);

        expect(moduleProxyMock.unsubscribe).toHaveBeenCalledWith(
          {
            key: ContactLifecycleTopicKey.StartingACW,
            parameter: currentContact,
          },
          handler,
        );
      });
    });

    describe("DESTROYED", () => {
      test("subscribes to event with handler", () => {
        const handler = jest.fn();

        sut.onDestroyed(handler, currentContact);

        expect(moduleProxyMock.subscribe).toHaveBeenCalledWith(
          {
            key: ContactLifecycleTopicKey.Destroyed,
            parameter: currentContact,
          },
          handler,
        );
      });

      test("unsubscribes from event with handler", () => {
        const handler = jest.fn();

        sut.offDestroyed(handler, currentContact);

        expect(moduleProxyMock.unsubscribe).toHaveBeenCalledWith(
          {
            key: ContactLifecycleTopicKey.Destroyed,
            parameter: currentContact,
          },
          handler,
        );
      });
    });

    describe("MISSED", () => {
      test("subscribes to event with handler", () => {
        const handler = jest.fn();

        sut.onMissed(handler, currentContact);

        expect(moduleProxyMock.subscribe).toHaveBeenCalledWith(
          { key: ContactLifecycleTopicKey.Missed, parameter: currentContact },
          handler,
        );
      });

      test("unsubscribes from event with handler", () => {
        const handler = jest.fn();

        sut.offMissed(handler, currentContact);

        expect(moduleProxyMock.unsubscribe).toHaveBeenCalledWith(
          { key: ContactLifecycleTopicKey.Missed, parameter: currentContact },
          handler,
        );
      });
    });

    describe("CONNECTED", () => {
      test("subscribes to event with handler", () => {
        const handler = jest.fn();

        sut.onConnected(handler, currentContact);

        expect(moduleProxyMock.subscribe).toHaveBeenCalledWith(
          {
            key: ContactLifecycleTopicKey.Connected,
            parameter: currentContact,
          },
          handler,
        );
      });

      test("unsubscribes from event with handler", () => {
        const handler = jest.fn();

        sut.offConnected(handler, currentContact);

        expect(moduleProxyMock.unsubscribe).toHaveBeenCalledWith(
          {
            key: ContactLifecycleTopicKey.Connected,
            parameter: currentContact,
          },
          handler,
        );
      });
    });

    describe("CLEARED", () => {
      test("subscribes to event with handler", () => {
        const handler = jest.fn();

        sut.onCleared(handler, currentContact);

        expect(moduleProxyMock.subscribe).toHaveBeenCalledWith(
          {
            key: ContactLifecycleTopicKey.Cleared,
            parameter: currentContact,
          },
          handler,
        );
      });

      test("unsubscribes from event with handler", () => {
        const handler = jest.fn();

        sut.offCleared(handler, currentContact);

        expect(moduleProxyMock.unsubscribe).toHaveBeenCalledWith(
          {
            key: ContactLifecycleTopicKey.Cleared,
            parameter: currentContact,
          },
          handler,
        );
      });
    });

    describe("INCOMING", () => {
      test("subscribes to event with handler", () => {
        const handler = jest.fn();

        sut.onIncoming(handler, currentContact);

        expect(moduleProxyMock.subscribe).toHaveBeenCalledWith(
          {
            key: ContactLifecycleTopicKey.Incoming,
            parameter: currentContact,
          },
          handler,
        );
      });

      test("unsubscribes from event with handler", () => {
        const handler = jest.fn();

        sut.offIncoming(handler, currentContact);

        expect(moduleProxyMock.unsubscribe).toHaveBeenCalledWith(
          {
            key: ContactLifecycleTopicKey.Incoming,
            parameter: currentContact,
          },
          handler,
        );
      });
    });
  });

  describe("Requests", () => {
    const testContactId = "CONTACT_ID";

    test("getAttribute gets attribute if present in result", async () => {
      const key = "TEST_KEY";
      const value = "TEST_VALUE";
      const expectedResponse = { [key]: value };
      moduleProxyMock.request.mockReturnValue(
        new Promise((resolve) => resolve(expectedResponse)),
      );

      const actualResult = await sut.getAttribute(testContactId, key);

      expect(moduleProxyMock.request).toHaveBeenCalledWith(
        ContactRoutes.getAttributes,
        {
          contactId: testContactId,
          attributes: [key],
        },
      );
      expect(actualResult).toEqual(value);
    });

    test("getAttribute returns undefined if attribute not present in result", async () => {
      const key = "TEST_KEY";
      const value = "TEST_VALUE";
      const expectedResponse = { OTHER_KEY: value };
      moduleProxyMock.request.mockReturnValue(
        new Promise((resolve) => resolve(expectedResponse)),
      );

      const actualResult = await sut.getAttribute(testContactId, key);

      expect(moduleProxyMock.request).toHaveBeenCalledWith(
        ContactRoutes.getAttributes,
        {
          contactId: testContactId,
          attributes: [key],
        },
      );
      expect(actualResult).toBeUndefined();
    });

    test("getAttributes passes attributes list if provided", async () => {
      const attributes = ["ATTRIBUTE_1", "ATTRIBUTE_2"];
      moduleProxyMock.request.mockReturnValue(
        new Promise((resolve) => resolve()),
      );

      await sut.getAttributes(testContactId, attributes);

      expect(moduleProxyMock.request).toHaveBeenCalledWith(
        ContactRoutes.getAttributes,
        {
          contactId: testContactId,
          attributes,
        },
      );
    });

    test("getInitialContactId returns result if available", async () => {
      const expectedResult = "CONTACT_ID";
      moduleProxyMock.request.mockReturnValue(
        new Promise((resolve) => resolve({ initialContactId: expectedResult })),
      );

      const actualResult = await sut.getInitialContactId(testContactId);

      expect(moduleProxyMock.request).toHaveBeenCalledWith(
        ContactRoutes.getInitialContactId,
        {
          contactId: testContactId,
        },
      );
      expect(actualResult).toBe(expectedResult);
    });

    test("getInitialContactId returns undefined if result not available", async () => {
      moduleProxyMock.request.mockReturnValue(
        new Promise((resolve) => resolve({ initialContactId: undefined })),
      );

      const actualResult = await sut.getInitialContactId(testContactId);

      expect(moduleProxyMock.request).toHaveBeenCalledWith(
        ContactRoutes.getInitialContactId,
        {
          contactId: testContactId,
        },
      );
      expect(actualResult).toBeUndefined();
    });

    test("getType returns result", async () => {
      const expectedResult = "voice";
      moduleProxyMock.request.mockReturnValue(
        new Promise((resolve) => resolve({ type: expectedResult })),
      );
      const actualResult = await sut.getType(testContactId);
      expect(moduleProxyMock.request).toHaveBeenCalledWith(
        ContactRoutes.getType,
        {
          contactId: testContactId,
        },
      );
      expect(actualResult).toBe(expectedResult);
    });

    test("getStateDuration returns result", async () => {
      const expectedResult = 1000;
      moduleProxyMock.request.mockReturnValue(
        new Promise((resolve) => resolve({ stateDuration: expectedResult })),
      );

      const actualResult = await sut.getStateDuration(testContactId);

      expect(moduleProxyMock.request).toHaveBeenCalledWith(
        ContactRoutes.getStateDuration,
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
      moduleProxyMock.request.mockReturnValue(
        new Promise((resolve) => resolve(expectedResult)),
      );

      const actualResult = await sut.getQueue(testContactId);

      expect(moduleProxyMock.request).toHaveBeenCalledWith(
        ContactRoutes.getQueue,
        {
          contactId: testContactId,
        },
      );
      expect(actualResult).toBe(expectedResult);
    });

    test("getQueueTimestamp returns result", async () => {
      const expectedResult = new Date();
      moduleProxyMock.request.mockReturnValue(
        new Promise((resolve) => resolve({ queueTimestamp: expectedResult })),
      );

      const actualResult = await sut.getQueueTimestamp(testContactId);

      expect(moduleProxyMock.request).toHaveBeenCalledWith(
        ContactRoutes.getQueueTimestamp,
        {
          contactId: testContactId,
        },
      );
      expect(actualResult).toBe(expectedResult);
    });

    test("getChannelType returns result", async () => {
      const expectedResult = {
        type: "voice",
        subtype: "WebRTC",
      };
      moduleProxyMock.request.mockReturnValue(
        new Promise((resolve) => resolve(expectedResult)),
      );
      const actualResult = await sut.getChannelType(testContactId);
      expect(moduleProxyMock.request).toHaveBeenCalledWith(
        ContactRoutes.getChannelType,
        {
          contactId: testContactId,
        },
      );
      expect(actualResult).toBe(expectedResult);
    });

    test("accept sends with request with contactId and options", async () => {
      const contactId = "dummyContactId";

      await sut.accept(contactId);

      expect(moduleProxyMock.request).toHaveBeenCalledWith(
        ContactRoutes.accept,
        { contactId },
      );
    });

    test("clear sends with request with contactId and options", async () => {
      await sut.clear(testContactId);

      expect(moduleProxyMock.request).toHaveBeenCalledWith(
        ContactRoutes.clear,
        {
          contactId: testContactId,
        },
      );
    });

    test("addParticipant sends with request with contactId, quickConnect, and options", async () => {
      const testQuickConnect = mock<QuickConnect>({
        endpointARN: "my-endpoint-arn",
      });

      const expectedResult = {
        connectionId: "my-connection-id",
      };
      moduleProxyMock.request.mockResolvedValue(expectedResult);

      const actualResult = await sut.addParticipant(
        testContactId,
        testQuickConnect,
      );

      expect(moduleProxyMock.request).toHaveBeenCalledWith(
        ContactRoutes.addParticipant,
        {
          contactId: testContactId,
          quickConnect: testQuickConnect,
        },
      );
      expect(actualResult).toBe(expectedResult);
    });

    test("transfer sends with request with contactId, quickConnect, and options", async () => {
      const testQuickConnect = mock<AgentQuickConnect>();

      await sut.transfer(testContactId, testQuickConnect);

      expect(moduleProxyMock.request).toHaveBeenCalledWith(
        ContactRoutes.transfer,
        {
          contactId: testContactId,
          quickConnect: testQuickConnect,
        },
      );
    });

    test("isPreviewMode returns boolean for given contactId", async () => {
      const testContactId = "TEST_CONTACT_ID";
      const expectedResult = { isPreviewMode: true };

      moduleProxyMock.request.mockResolvedValue(expectedResult);

      const result = await sut.isPreviewMode(testContactId);

      expect(moduleProxyMock.request).toHaveBeenCalledWith(
        ContactRoutes.isPreviewMode,
        {
          contactId: testContactId,
        },
      );
      expect(result).toBe(true);
    });

    test("getPreviewConfiguration returns boolean for given contactId", async () => {
      const testContactId = "TEST_CONTACT_ID";
      const expectedResult = { autoDialTimeout: 25, canDiscardPreview: true };

      moduleProxyMock.request.mockResolvedValue(expectedResult);

      const result = await sut.getPreviewConfiguration(testContactId);

      expect(moduleProxyMock.request).toHaveBeenCalledWith(
        ContactRoutes.getPreviewConfiguration,
        {
          contactId: testContactId,
        },
      );
      expect(result).toBe(expectedResult);
    });
    test("engagePreviewContact sends request with contactId and options", async () => {
      const testContactId = "CONTACT_ID";

      const expectedResult = {
        connectionId: "my-connection-id",
      };
      moduleProxyMock.request.mockResolvedValue(expectedResult);

      const actualResult = await sut.engagePreviewContact(testContactId);

      expect(moduleProxyMock.request).toHaveBeenCalledWith(
        ContactRoutes.engagePreviewContact,
        {
          contactId: testContactId,
        },
      );
      expect(actualResult).toBe(expectedResult);
  });

    test("getContactRegion returns region for given contactId", async () => {
      const testContactId = "TEST_CONTACT_ID";
      const expectedRegion = "region";
      moduleProxyMock.request.mockReturnValue(
        Promise.resolve({ region: expectedRegion }),
      );

      const result = await sut.getContactRegion(testContactId);

      expect(moduleProxyMock.request).toHaveBeenCalledWith(
        ContactRoutes.getContactRegion,
        {
          contactId: testContactId,
        },
      );
      expect(result).toBe(expectedRegion);
    });

    test("returns instance details for given contactId", async () => {
      const testContactId = "TEST_CONTACT_ID";
      const mockInstanceDetails = mock<InstanceDetails>();

      moduleProxyMock.request.mockResolvedValue(mockInstanceDetails);

      const result = await sut.getInstanceDetails(testContactId);

      expect(moduleProxyMock.request).toHaveBeenCalledWith(
        ContactRoutes.getInstanceDetails,
        {
          contactId: testContactId,
        },
      );
      expect(result).toEqual(mockInstanceDetails);
      });

    test("should make proxy request with correct route and contactId", async () => {
      const testContactId = "test-contact-id";
      const mockParticipants = [
        {
          participantId: "participant-1",
          contactId: testContactId,
          type: { value: "agent" },
          isInitial: true,
        },
        {
          participantId: "participant-2",
          contactId: testContactId,
          type: { value: "inbound" },
          isInitial: false,
        },
      ];
      moduleProxyMock.request.mockResolvedValue(mockParticipants);

      const result = await sut.listParticipants(testContactId);

      expect(moduleProxyMock.request).toHaveBeenCalledWith(
        ContactRoutes.listParticipants,
        { contactId: testContactId },
      );
      expect(result).toBe(mockParticipants);
    });

    describe("getParticipant", () => {
      test("should make proxy request with correct route and participantId", async () => {
        const testParticipantId = "test-participant-id";
        const mockParticipant = {
          participantId: testParticipantId,
          contactId: "contact-123",
          type: { value: "agent" },
          isInitial: true,
        };
        moduleProxyMock.request.mockResolvedValue(mockParticipant);

        const result = await sut.getParticipant(testParticipantId);

        expect(moduleProxyMock.request).toHaveBeenCalledWith(
          ContactRoutes.getParticipant,
          { participantId: testParticipantId },
        );
        expect(result).toBe(mockParticipant);
      });
    });

    describe("getParticipantState", () => {
      test("should make proxy request with correct route and participantId", async () => {
        const testParticipantId = "test-participant-id";
        const mockState = { value: "connected" };
        moduleProxyMock.request.mockResolvedValue(mockState);

        const result = await sut.getParticipantState(testParticipantId);

        expect(moduleProxyMock.request).toHaveBeenCalledWith(
          ContactRoutes.getParticipantState,
          { participantId: testParticipantId },
        );
        expect(result).toBe(mockState);
      });
    });

    describe("disconnectParticipant", () => {
      test("should make proxy request with correct route and participantId", async () => {
        const testParticipantId = "test-participant-id";
        moduleProxyMock.request.mockResolvedValue(undefined);

        await sut.disconnectParticipant(testParticipantId);

        expect(moduleProxyMock.request).toHaveBeenCalledWith(
          ContactRoutes.disconnectParticipant,
          { participantId: testParticipantId },
        );
      });
    });

    describe("getContact", () => {
      test("should make proxy request with correct route and contactId", async () => {
        const testContactId = "test-contact-id";
        const mockContact: ContactData = {
          contactId: testContactId,
          type: "voice",
          subtype: "connect:Telephony",
          queue: {
            name: "Test Queue",
            queueARN: "arn:aws:connect:us-east-1:123456789012:queue/test",
            queueId: "test-queue-id",
          },
        };
        moduleProxyMock.request.mockResolvedValue(mockContact);

        const result = await sut.getContact(testContactId);

        expect(moduleProxyMock.request).toHaveBeenCalledWith(
          ContactRoutes.getContact,
          { contactId: testContactId },
        );
        expect(result).toBe(mockContact);
      });
    });

    test("listContacts returns result", async () => {
      await sut.listContacts();

      expect(moduleProxyMock.request).toHaveBeenCalledWith(
        ContactRoutes.listContacts,
      );
    });
  });

  describe("Participant Event Subscriptions", () => {
    describe("onParticipantAdded / offParticipantAdded", () => {
      test("should subscribe to participant added events without contactId", () => {
        const handler = jest.fn();

        sut.onParticipantAdded(handler);

        expect(moduleProxyMock.subscribe).toHaveBeenCalledWith(
          { key: ContactTopicKey.ParticipantAdded, parameter: undefined },
          handler,
        );
      });

      test("should subscribe to participant added events with contactId", () => {
        const handler = jest.fn();
        const testContactId = "test-contact-id";

        sut.onParticipantAdded(handler, testContactId);

        expect(moduleProxyMock.subscribe).toHaveBeenCalledWith(
          { key: ContactTopicKey.ParticipantAdded, parameter: testContactId },
          handler,
        );
      });

      test("should unsubscribe from participant added events", () => {
        const handler = jest.fn();
        const testContactId = "test-contact-id";

        sut.offParticipantAdded(handler, testContactId);

        expect(moduleProxyMock.unsubscribe).toHaveBeenCalledWith(
          { key: ContactTopicKey.ParticipantAdded, parameter: testContactId },
          handler,
        );
      });
    });

    describe("onParticipantDisconnected / offParticipantDisconnected", () => {
      test("should subscribe to participant disconnected events", () => {
        const handler = jest.fn();
        const testContactId = "test-contact-id";

        sut.onParticipantDisconnected(handler, testContactId);

        expect(moduleProxyMock.subscribe).toHaveBeenCalledWith(
          {
            key: ContactTopicKey.ParticipantDisconnected,
            parameter: testContactId,
          },
          handler,
        );
      });

      test("should unsubscribe from participant disconnected events", () => {
        const handler = jest.fn();
        const testContactId = "test-contact-id";

        sut.offParticipantDisconnected(handler, testContactId);

        expect(moduleProxyMock.unsubscribe).toHaveBeenCalledWith(
          {
            key: ContactTopicKey.ParticipantDisconnected,
            parameter: testContactId,
          },
          handler,
        );
      });
    });

    describe("onParticipantStateChanged / offParticipantStateChanged", () => {
      test("should subscribe to participant state changed events", () => {
        const handler = jest.fn();
        const testParticipant = "test-participant-id";

        sut.onParticipantStateChanged(handler, testParticipant);

        expect(moduleProxyMock.subscribe).toHaveBeenCalledWith(
          {
            key: ContactTopicKey.ParticipantStateChanged,
            parameter: testParticipant,
          },
          handler,
        );
      });

      test("should unsubscribe from participant state changed events", () => {
        const handler = jest.fn();
        const testParticipant = "test-participant-id";

        sut.offParticipantStateChanged(handler, testParticipant);

        expect(moduleProxyMock.unsubscribe).toHaveBeenCalledWith(
          {
            key: ContactTopicKey.ParticipantStateChanged,
            parameter: testParticipant,
          },
          handler,
        );
      });
    });
  });
});
