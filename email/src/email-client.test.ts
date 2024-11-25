/* eslint-disable @typescript-eslint/unbound-method */
import { AmazonConnectProvider, Proxy } from "@amazon-connect/core";
import { mock, MockProxy } from "jest-mock-extended";

import { EmailClient } from "./email-client";
import { emailNamespace } from "./email-namespace";
import { EmailRoute } from "./routes";
import { EmailContactEvents } from "./topic-keys";
import {
  CreateDraftEmailContact,
  DraftEmailContact,
  EmailContact,
  EmailContactId,
  EmailThreadContact,
} from "./types";

jest.mock("@amazon-connect/core/lib/logging/connect-logger");

describe("EmailClient", () => {
  let emailClient: EmailClient;
  let mockProxy: MockProxy<Proxy>;

  beforeEach(() => {
    jest.resetAllMocks();
    mockProxy = mock<Proxy>();
    const mockProvider = mock<AmazonConnectProvider>();
    mockProvider.getProxy.mockReturnValue(mockProxy);

    emailClient = new EmailClient({
      provider: mockProvider,
    });
  });

  describe("sendEmail", () => {
    const mockDraftContact = mock<DraftEmailContact>();

    test("should resolve when expected", async () => {
      mockProxy.request.mockResolvedValueOnce(undefined);

      await emailClient.sendEmail(mockDraftContact);

      expect(mockProxy.request).toHaveBeenCalledWith(
        emailNamespace,
        EmailRoute.sendEmail,
        mockDraftContact,
      );
    });

    test("should reject when expected", async () => {
      const testError = new Error("test error");
      mockProxy.request.mockRejectedValueOnce(testError);

      try {
        await emailClient.sendEmail(mockDraftContact);
      } catch (e) {
        expect(e).toEqual(testError);
        expect(mockProxy.request).toHaveBeenCalledWith(
          emailNamespace,
          EmailRoute.sendEmail,
          mockDraftContact,
        );
      }
      expect.hasAssertions();
    });
  });

  describe("getEmailData", () => {
    const mockRequest = {
      contactId: "contactIdToDescribe",
      activeContactId: "activeContactId",
    };

    test("should resolve when expected", async () => {
      const mockGetEmailDataResult = mock<EmailContact>();
      mockProxy.request.mockResolvedValueOnce(mockGetEmailDataResult);

      const res: EmailContact = await emailClient.getEmailData(mockRequest);

      expect(res).toStrictEqual(mockGetEmailDataResult);
      expect(mockProxy.request).toHaveBeenCalledWith(
        emailNamespace,
        EmailRoute.getEmailData,
        mockRequest,
      );
    });

    test("should reject when expected", async () => {
      const testError = new Error("test error");
      mockProxy.request.mockRejectedValueOnce(testError);

      try {
        await emailClient.getEmailData(mockRequest);
      } catch (e) {
        expect(e).toEqual(testError);
        expect(mockProxy.request).toHaveBeenCalledWith(
          emailNamespace,
          EmailRoute.getEmailData,
          mockRequest,
        );
      }
      expect.hasAssertions();
    });
  });

  describe("createDraftEmail", () => {
    const mockContactCreation = mock<CreateDraftEmailContact>();

    test("should resolve when expected", async () => {
      const mockCreateDraftEmailResult = mock<EmailContactId>();
      mockProxy.request.mockResolvedValueOnce(mockCreateDraftEmailResult);

      const res: EmailContactId =
        await emailClient.createDraftEmail(mockContactCreation);

      expect(res).toStrictEqual(mockCreateDraftEmailResult);
      expect(mockProxy.request).toHaveBeenCalledWith(
        emailNamespace,
        EmailRoute.createDraftEmail,
        mockContactCreation,
      );
    });

    test("should reject when expected", async () => {
      const testError = new Error("test error");
      mockProxy.request.mockRejectedValueOnce(testError);

      try {
        await emailClient.createDraftEmail(mockContactCreation);
      } catch (e) {
        expect(e).toEqual(testError);
        expect(mockProxy.request).toHaveBeenCalledWith(
          emailNamespace,
          EmailRoute.createDraftEmail,
          mockContactCreation,
        );
      }
      expect.hasAssertions();
    });
  });

  describe("getEmailThread", () => {
    const mockContactAssociationId = "testId1234";
    const mockGetEmailThreadParams = {
      contactAssociationId: mockContactAssociationId,
    };

    test("should resolve when expected", async () => {
      const mockGetEmailThreadResult = mock<{
        contacts: EmailThreadContact[];
        nextToken?: string;
      }>();
      mockProxy.request.mockResolvedValueOnce(mockGetEmailThreadResult);

      const res = await emailClient.getEmailThread(mockGetEmailThreadParams);

      expect(res).toStrictEqual(mockGetEmailThreadResult);
      expect(mockProxy.request).toHaveBeenCalledWith(
        emailNamespace,
        EmailRoute.getEmailThread,
        mockGetEmailThreadParams,
      );
    });

    test("should reject when expected", async () => {
      const testError = new Error("test error");
      mockProxy.request.mockRejectedValueOnce(testError);

      try {
        await emailClient.getEmailThread(mockGetEmailThreadParams);
      } catch (e) {
        expect(e).toEqual(testError);
        expect(mockProxy.request).toHaveBeenCalledWith(
          emailNamespace,
          EmailRoute.getEmailThread,
          mockGetEmailThreadParams,
        );
      }
      expect.hasAssertions();
    });
  });

  describe("subscribe to incoming email contacts", () => {
    test("onAcceptedEmail subscribes", () => {
      const handler = jest.fn(async (contact: EmailContactId) => {
        await emailClient.getEmailData({
          contactId: contact.contactId,
          activeContactId: "testActiveContactId",
        });
      });

      emailClient.onAcceptedEmail(handler);

      expect(mockProxy.subscribe).toHaveBeenCalledWith(
        {
          key: EmailContactEvents.InboundContactConnected,
          namespace: emailNamespace,
          parameter: undefined,
        },
        handler,
      );
    });

    test("offAcceptedEmail unsubscribes", () => {
      const handler = jest.fn(async (contact: EmailContactId) => {
        await emailClient.getEmailData({
          contactId: contact.contactId,
          activeContactId: "testActiveContactId",
        });
      });

      emailClient.offAcceptedEmail(handler);

      expect(mockProxy.unsubscribe).toHaveBeenCalledWith(
        {
          key: EmailContactEvents.InboundContactConnected,
          namespace: emailNamespace,
          parameter: undefined,
        },
        handler,
      );
    });
  });

  describe("subscribe to connected outbound contacts", () => {
    test("onDraftEmailCreated subscribes", () => {
      const handler = jest.fn(async (contact: EmailContactId) => {
        await emailClient.getEmailData({
          contactId: contact.contactId,
          activeContactId: "testActiveContactId",
        });
      });

      emailClient.onDraftEmailCreated(handler);

      expect(mockProxy.subscribe).toHaveBeenCalledWith(
        {
          key: EmailContactEvents.OutboundContactConnected,
          namespace: emailNamespace,
          parameter: undefined,
        },
        handler,
      );
    });

    test("offDraftEmailCreated unsubscribes", () => {
      const handler = jest.fn(async (contact: EmailContactId) => {
        await emailClient.getEmailData({
          contactId: contact.contactId,
          activeContactId: "testActiveContactId",
        });
      });

      emailClient.offDraftEmailCreated(handler);

      expect(mockProxy.unsubscribe).toHaveBeenCalledWith(
        {
          key: EmailContactEvents.OutboundContactConnected,
          namespace: emailNamespace,
          parameter: undefined,
        },
        handler,
      );
    });
  });
});
