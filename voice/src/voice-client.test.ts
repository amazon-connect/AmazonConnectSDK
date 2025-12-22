import { ModuleContext, ModuleProxy } from "@amazon-connect/core";
import { mock } from "jest-mock-extended";

import { VoiceRoutes } from "./routes";
import { VoiceTopicKeys } from "./topic-keys";
import { DialableCountry } from "./types";
import { VoiceClient } from "./voice-client";

const moduleProxyMock = mock<ModuleProxy>();
const moduleContextMock = mock<ModuleContext>({
  proxy: moduleProxyMock,
});

let sut: VoiceClient;

beforeEach(jest.resetAllMocks);

describe("VoiceClient", () => {
  beforeEach(() => {
    sut = new VoiceClient({ context: moduleContextMock });
  });

  describe("Requests", () => {
    const testContactId = "CONTACT_ID";

    test("getPhoneNumber returns result", async () => {
      const expectedResult: string = "123";
      moduleProxyMock.request.mockReturnValue(
        new Promise((resolve) => resolve({ phoneNumber: expectedResult })),
      );

      const actualResult = await sut.getPhoneNumber(testContactId);

      expect(moduleProxyMock.request).toHaveBeenCalledWith(
        VoiceRoutes.getPhoneNumber,
        {
          contactId: testContactId,
        },
      );
      expect(actualResult).toBe(expectedResult);
    });

    test("getInitialCustomerPhoneNumber returns result", async () => {
      const expectedResult: string = "123";
      moduleProxyMock.request.mockReturnValue(
        new Promise((resolve) => resolve({ phoneNumber: expectedResult })),
      );

      const actualResult =
        await sut.getInitialCustomerPhoneNumber(testContactId);

      expect(moduleProxyMock.request).toHaveBeenCalledWith(
        VoiceRoutes.getInitialCustomerPhoneNumber,
        {
          contactId: testContactId,
        },
      );
      expect(actualResult).toBe(expectedResult);
    });

    test("listDialableCountries returns result", async () => {
      const dialableCountry: DialableCountry = {
        countryCode: "us",
        callingCode: "+1",
        label: "United States of America",
      };
      moduleProxyMock.request.mockResolvedValueOnce([dialableCountry]);

      const actualResult = await sut.listDialableCountries();

      expect(moduleProxyMock.request).toHaveBeenCalledWith(
        VoiceRoutes.listDialableCountries,
      );
      expect(actualResult).toEqual([dialableCountry]);
    });

    test("createOutboundCall returns result", async () => {
      moduleProxyMock.request.mockResolvedValueOnce({
        contactId: testContactId,
      });

      const actualResult = await sut.createOutboundCall("+11234567890", {
        queueARN: "queue-arn",
      });

      expect(moduleProxyMock.request).toHaveBeenCalledWith(
        VoiceRoutes.createOutboundCall,
        {
          phoneNumber: "+11234567890",
          options: {
            queueARN: "queue-arn",
          },
        },
      );
      expect(actualResult).toEqual({
        contactId: testContactId,
      });
    });

    test("getOutboundCallPermission returns result", async () => {
      const expectedResult: boolean = true;
      moduleProxyMock.request.mockReturnValue(
        new Promise((resolve) =>
          resolve({ outboundCallPermission: expectedResult }),
        ),
      );

      const actualResult = await sut.getOutboundCallPermission();

      expect(moduleProxyMock.request).toHaveBeenCalledWith(
        VoiceRoutes.getOutboundCallPermission,
      );
      expect(actualResult).toBe(expectedResult);
    });

  });

  describe("Subscriptions", () => {

    describe("conferenceParticipants", () => {
      test("requests with correct route and parameters", async () => {
        const contactId = "test-contact-id";

        moduleProxyMock.request.mockResolvedValueOnce(undefined);

        await sut.conferenceParticipants(contactId);

        expect(moduleProxyMock.request).toHaveBeenCalledWith(
          VoiceRoutes.conferenceParticipants,
          { contactId },
        );
      });
    });

    describe("holdParticipant", () => {
      test("requests with correct route and parameters", async () => {
        const participantId = "test-participant-id";

        moduleProxyMock.request.mockResolvedValueOnce(undefined);

        await sut.holdParticipant(participantId);

        expect(moduleProxyMock.request).toHaveBeenCalledWith(
          VoiceRoutes.holdParticipant,
          { participantId },
        );
      });
    });

    describe("resumeParticipant", () => {
      test("requests with correct route and parameters", async () => {
        const participantId = "test-participant-id";

        moduleProxyMock.request.mockResolvedValueOnce(undefined);

        await sut.resumeParticipant(participantId);

        expect(moduleProxyMock.request).toHaveBeenCalledWith(
          VoiceRoutes.resumeParticipant,
          { participantId },
        );
      });
    });

    describe("holdSelf", () => {
      test("requests with correct route and parameters", async () => {
        const contactId = "test-contact-id";

        moduleProxyMock.request.mockResolvedValueOnce(undefined);

        await sut.holdSelf(contactId);

        expect(moduleProxyMock.request).toHaveBeenCalledWith(
          VoiceRoutes.holdSelf,
          { contactId },
        );
      });
    });

    describe("resumeSelf", () => {
      test("requests with correct route and parameters", async () => {
        const contactId = "test-contact-id";

        moduleProxyMock.request.mockResolvedValueOnce(undefined);

        await sut.resumeSelf(contactId);

        expect(moduleProxyMock.request).toHaveBeenCalledWith(
          VoiceRoutes.resumeSelf,
          { contactId },
        );
      });
    });

    describe("isParticipantOnHold", () => {
      test("requests with correct route and parameters", async () => {
        const participantId = "test-participant-id";
        const mockResponse = { isOnHold: true };

        moduleProxyMock.request.mockResolvedValueOnce(mockResponse);

        const result = await sut.isParticipantOnHold(participantId);

        expect(moduleProxyMock.request).toHaveBeenCalledWith(
          VoiceRoutes.isParticipantOnHold,
          { participantId },
        );
        expect(result).toBe(true);
      });

      test("returns false when participant is not on hold", async () => {
        const participantId = "test-participant-id";
        const mockResponse = { isOnHold: false };

        moduleProxyMock.request.mockResolvedValueOnce(mockResponse);

        const result = await sut.isParticipantOnHold(participantId);

        expect(result).toBe(false);
      });
    });

    describe("isSelfOnHold", () => {
      test("requests with correct route and parameters", async () => {
        const contactId = "test-contact-id";
        const mockResponse = { isOnHold: true };

        moduleProxyMock.request.mockResolvedValueOnce(mockResponse);

        const result = await sut.isSelfOnHold(contactId);

        expect(moduleProxyMock.request).toHaveBeenCalledWith(
          VoiceRoutes.isSelfOnHold,
          { contactId },
        );
        expect(result).toBe(true);
      });

      test("returns false when self is not on hold", async () => {
        const contactId = "test-contact-id";
        const mockResponse = { isOnHold: false };

        moduleProxyMock.request.mockResolvedValueOnce(mockResponse);

        const result = await sut.isSelfOnHold(contactId);

        expect(result).toBe(false);
      });
    });

    describe("canResumeSelf", () => {
      test("requests with correct route and parameters", async () => {
        const contactId = "test-contact-id";
        const mockResponse = { canResumeSelf: true };

        moduleProxyMock.request.mockResolvedValueOnce(mockResponse);

        const result = await sut.canResumeSelf(contactId);

        expect(moduleProxyMock.request).toHaveBeenCalledWith(
          VoiceRoutes.canResumeSelf,
          { contactId },
        );
        expect(result).toBe(true);
      });

      test("returns false when canResumeSelf is false", async () => {
        const contactId = "test-contact-id";
        const mockResponse = { canResumeSelf: false };

        moduleProxyMock.request.mockResolvedValueOnce(mockResponse);

        const result = await sut.canResumeSelf(contactId);

        expect(moduleProxyMock.request).toHaveBeenCalledWith(
          VoiceRoutes.canResumeSelf,
          { contactId },
        );
        expect(result).toBe(false);
      });
    });

    describe("canResumeParticipant", () => {
      test("requests with correct route and parameters", async () => {
        const participantId = "test-connection-id";
        const mockResponse = { canResumeParticipant: true };

        moduleProxyMock.request.mockResolvedValueOnce(mockResponse);

        const result = await sut.canResumeParticipant(participantId);

        expect(moduleProxyMock.request).toHaveBeenCalledWith(
          VoiceRoutes.canResumeParticipant,
          { participantId },
        );
        expect(result).toBe(true);
      });

      test("returns false when canResumeParticipant is false", async () => {
        const participantId = "test-connection-id";
        const mockResponse = { canResumeParticipant: false };

        moduleProxyMock.request.mockResolvedValueOnce(mockResponse);

        const result = await sut.canResumeParticipant(participantId);

        expect(moduleProxyMock.request).toHaveBeenCalledWith(
          VoiceRoutes.canResumeParticipant,
          { participantId },
        );
        expect(result).toBe(false);
      });
    });
  });

  describe("Subscription Methods", () => {
    describe("onSelfHold", () => {
      test("subscribes with correct topic key and no parameter", () => {
        const handler = jest.fn();

        sut.onSelfHold(handler);

        expect(moduleProxyMock.subscribe).toHaveBeenCalledWith(
          { key: VoiceTopicKeys.SelfHold, parameter: undefined },
          handler,
        );
      });

      test("subscribes with correct topic key and contactId parameter", () => {
        const handler = jest.fn();
        const contactId = "test-contact-id";

        sut.onSelfHold(handler, contactId);

        expect(moduleProxyMock.subscribe).toHaveBeenCalledWith(
          { key: VoiceTopicKeys.SelfHold, parameter: contactId },
          handler,
        );
      });
    });

    describe("offSelfHold", () => {
      test("unsubscribes with correct topic key and no parameter", () => {
        const handler = jest.fn();

        sut.offSelfHold(handler);

        expect(moduleProxyMock.unsubscribe).toHaveBeenCalledWith(
          { key: VoiceTopicKeys.SelfHold, parameter: undefined },
          handler,
        );
      });

      test("unsubscribes with correct topic key and no parameter", () => {
        const handler = jest.fn();

        sut.offCanResumeParticipantChanged(handler);

        expect(moduleProxyMock.unsubscribe).toHaveBeenCalledWith(
          {
            key: VoiceTopicKeys.CanResumeParticipantChanged,
            parameter: undefined,
          },
          handler,
        );
      });

      test("unsubscribes with correct topic key and participantId parameter", () => {
        const handler = jest.fn();
        const participantId = "test-connection-id";

        sut.offCanResumeParticipantChanged(handler, participantId);

        expect(moduleProxyMock.unsubscribe).toHaveBeenCalledWith(
          {
            key: VoiceTopicKeys.CanResumeParticipantChanged,
            parameter: participantId,
          },
          handler,
        );
      });

      test("unsubscribes with correct topic key and contactId parameter", () => {
        const handler = jest.fn();
        const contactId = "test-contact-id";

        sut.offSelfHold(handler, contactId);

        expect(moduleProxyMock.unsubscribe).toHaveBeenCalledWith(
          { key: VoiceTopicKeys.SelfHold, parameter: contactId },
          handler,
        );
      });
    });

    describe("onSelfResume", () => {
      test("subscribes with correct topic key and no parameter", () => {
        const handler = jest.fn();

        sut.onSelfResume(handler);

        expect(moduleProxyMock.subscribe).toHaveBeenCalledWith(
          { key: VoiceTopicKeys.SelfResume, parameter: undefined },
          handler,
        );
      });

      test("subscribes with correct topic key and contactId parameter", () => {
        const handler = jest.fn();
        const contactId = "test-contact-id";

        sut.onSelfResume(handler, contactId);

        expect(moduleProxyMock.subscribe).toHaveBeenCalledWith(
          { key: VoiceTopicKeys.SelfResume, parameter: contactId },
          handler,
        );
      });
    });

    describe("offSelfResume", () => {
      test("unsubscribes with correct topic key and no parameter", () => {
        const handler = jest.fn();

        sut.offSelfResume(handler);

        expect(moduleProxyMock.unsubscribe).toHaveBeenCalledWith(
          { key: VoiceTopicKeys.SelfResume, parameter: undefined },
          handler,
        );
      });

      test("unsubscribes with correct topic key and contactId parameter", () => {
        const handler = jest.fn();
        const contactId = "test-contact-id";

        sut.offSelfResume(handler, contactId);

        expect(moduleProxyMock.unsubscribe).toHaveBeenCalledWith(
          { key: VoiceTopicKeys.SelfResume, parameter: contactId },
          handler,
        );
      });
    });

    describe("onParticipantHold", () => {
      test("subscribes with correct topic key and no parameter", () => {
        const handler = jest.fn();

        sut.onParticipantHold(handler);

        expect(moduleProxyMock.subscribe).toHaveBeenCalledWith(
          { key: VoiceTopicKeys.ParticipantHold, parameter: undefined },
          handler,
        );
      });

      test("subscribes with correct topic key and participantId parameter", () => {
        const handler = jest.fn();
        const participantId = "test-participant-id";

        sut.onParticipantHold(handler, participantId);

        expect(moduleProxyMock.subscribe).toHaveBeenCalledWith(
          {
            key: VoiceTopicKeys.ParticipantHold,
            parameter: participantId,
          },
          handler,
        );
      });
    });

    describe("offParticipantHold", () => {
      test("unsubscribes with correct topic key and no parameter", () => {
        const handler = jest.fn();

        sut.offParticipantHold(handler);

        expect(moduleProxyMock.unsubscribe).toHaveBeenCalledWith(
          { key: VoiceTopicKeys.ParticipantHold, parameter: undefined },
          handler,
        );
      });

      test("unsubscribes with correct topic key and participantId parameter", () => {
        const handler = jest.fn();
        const participantId = "test-participant-id";

        sut.offParticipantHold(handler, participantId);

        expect(moduleProxyMock.unsubscribe).toHaveBeenCalledWith(
          {
            key: VoiceTopicKeys.ParticipantHold,
            parameter: participantId,
          },
          handler,
        );
      });
    });

    describe("onParticipantResume", () => {
      test("subscribes with correct topic key and no parameter", () => {
        const handler = jest.fn();

        sut.onParticipantResume(handler);

        expect(moduleProxyMock.subscribe).toHaveBeenCalledWith(
          {
            key: VoiceTopicKeys.ParticipantResume,
            parameter: undefined,
          },
          handler,
        );
      });

      test("subscribes with correct topic key and participantId parameter", () => {
        const handler = jest.fn();
        const participantId = "test-participant-id";

        sut.onParticipantResume(handler, participantId);

        expect(moduleProxyMock.subscribe).toHaveBeenCalledWith(
          {
            key: VoiceTopicKeys.ParticipantResume,
            parameter: participantId,
          },
          handler,
        );
      });
    });

    describe("offParticipantResume", () => {
      test("unsubscribes with correct topic key and no parameter", () => {
        const handler = jest.fn();

        sut.offParticipantResume(handler);

        expect(moduleProxyMock.unsubscribe).toHaveBeenCalledWith(
          {
            key: VoiceTopicKeys.ParticipantResume,
            parameter: undefined,
          },
          handler,
        );
      });

      test("unsubscribes with correct topic key and participantId parameter", () => {
        const handler = jest.fn();
        const participantId = "test-participant-id";

        sut.offParticipantResume(handler, participantId);

        expect(moduleProxyMock.unsubscribe).toHaveBeenCalledWith(
          {
            key: VoiceTopicKeys.ParticipantResume,
            parameter: participantId,
          },
          handler,
        );
      });
    });

    describe("onCanResumeSelfChanged", () => {
      test("subscribes with correct topic key and no parameter", () => {
        const handler = jest.fn();

        sut.onCanResumeSelfChanged(handler);

        expect(moduleProxyMock.subscribe).toHaveBeenCalledWith(
          {
            key: VoiceTopicKeys.CanResumeSelfChanged,
            parameter: undefined,
          },
          handler,
        );
      });

      test("subscribes with correct topic key and contactId parameter", () => {
        const handler = jest.fn();
        const contactId = "test-contact-id";

        sut.onCanResumeSelfChanged(handler, contactId);

        expect(moduleProxyMock.subscribe).toHaveBeenCalledWith(
          {
            key: VoiceTopicKeys.CanResumeSelfChanged,
            parameter: contactId,
          },
          handler,
        );
      });
    });

    describe("offCanResumeSelfChanged", () => {
      test("unsubscribes with correct topic key and no parameter", () => {
        const handler = jest.fn();

        sut.offCanResumeSelfChanged(handler);

        expect(moduleProxyMock.unsubscribe).toHaveBeenCalledWith(
          {
            key: VoiceTopicKeys.CanResumeSelfChanged,
            parameter: undefined,
          },
          handler,
        );
      });

      test("unsubscribes with correct topic key and contactId parameter", () => {
        const handler = jest.fn();
        const contactId = "test-contact-id";

        sut.offCanResumeSelfChanged(handler, contactId);

        expect(moduleProxyMock.unsubscribe).toHaveBeenCalledWith(
          {
            key: VoiceTopicKeys.CanResumeSelfChanged,
            parameter: contactId,
          },
          handler,
        );
      });
    });
  });
});
