/* eslint-disable @typescript-eslint/unbound-method */
import { ModuleContext, ModuleProxy } from "@amazon-connect/core";
import { mock } from "jest-mock-extended";

import { ContactClient } from "./contact-client";
import { ContactRoutes } from "./routes";
import { ContactLifecycleTopicKey } from "./topic-keys";
import { AgentQuickConnect, Queue, QuickConnect } from "./types";

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

        expect(moduleProxyMock.subscribe).toBeCalledWith(
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

        expect(moduleProxyMock.unsubscribe).toBeCalledWith(
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

        expect(moduleProxyMock.subscribe).toBeCalledWith(
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

        expect(moduleProxyMock.unsubscribe).toBeCalledWith(
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

        expect(moduleProxyMock.subscribe).toBeCalledWith(
          { key: ContactLifecycleTopicKey.Missed, parameter: currentContact },
          handler,
        );
      });

      test("unsubscribes from event with handler", () => {
        const handler = jest.fn();

        sut.offMissed(handler, currentContact);

        expect(moduleProxyMock.unsubscribe).toBeCalledWith(
          { key: ContactLifecycleTopicKey.Missed, parameter: currentContact },
          handler,
        );
      });
    });

    describe("CONNECTED", () => {
      test("subscribes to event with handler", () => {
        const handler = jest.fn();

        sut.onConnected(handler, currentContact);

        expect(moduleProxyMock.subscribe).toBeCalledWith(
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

        expect(moduleProxyMock.unsubscribe).toBeCalledWith(
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

        expect(moduleProxyMock.subscribe).toBeCalledWith(
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

        expect(moduleProxyMock.unsubscribe).toBeCalledWith(
          {
            key: ContactLifecycleTopicKey.Cleared,
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
  });
});
