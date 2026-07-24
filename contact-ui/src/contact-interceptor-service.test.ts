import { AmazonConnectProvider } from "@amazon-connect/core";
import { ExtensibilityService, Interceptor } from "@amazon-connect/extensibility";
import { mocked } from "jest-mock";
import { mock } from "jest-mock-extended";

import {
  ContactInterceptorContext,
  ContactInterceptorService,
} from "./contact-interceptor-service";

jest.mock("@amazon-connect/extensibility/lib/extensibility-service");

beforeEach(jest.resetAllMocks);

describe("ContactInterceptorService", () => {
  let sut: ContactInterceptorService;
  let mockProvider: AmazonConnectProvider;
  let mockExtensibility: jest.Mocked<ExtensibilityService>;

  const mockInterceptor = jest.fn() as Interceptor<ContactInterceptorContext>;
  const mockContactId = "contact-1";

  beforeEach(() => {
    mockProvider = mock<AmazonConnectProvider>();
    sut = new ContactInterceptorService(mockProvider);
    mockExtensibility = mocked(ExtensibilityService).mock
      .instances[0] as jest.Mocked<ExtensibilityService>;
  });

  describe("constructor", () => {
    test("should create an ExtensibilityService with the provider", () => {
      expect(ExtensibilityService).toHaveBeenCalledTimes(1);
      expect(ExtensibilityService).toHaveBeenCalledWith(mockProvider);
    });
  });

  describe.each([
    ["addOpenQuickConnectInterceptor", "openQuickConnect"],
    ["addOpenOutboundDialerInterceptor", "openOutboundDialer"],
    ["addClearContactInterceptor", "clearContact"],
  ] as const)("%s", (method, expectedKey) => {
    test(`should add the ${expectedKey} interceptor with no contactId and no options when called with (fn)`, async () => {
      await sut[method](mockInterceptor);

      expect(mockExtensibility.addInterceptor).toHaveBeenCalledWith(
        expectedKey,
        mockInterceptor,
        undefined,
      );
    });

    test(`should forward options with no contactId when called with (fn, options)`, async () => {
      await sut[method](mockInterceptor, { maxConsecutiveBlocks: 3 });

      expect(mockExtensibility.addInterceptor).toHaveBeenCalledWith(
        expectedKey,
        mockInterceptor,
        { maxConsecutiveBlocks: 3 },
      );
    });

    test(`should add the ${expectedKey} interceptor with contactId as the parameter when called with (fn, contactId)`, async () => {
      await sut[method](mockInterceptor, mockContactId);

      expect(mockExtensibility.addInterceptor).toHaveBeenCalledWith(
        expectedKey,
        mockInterceptor,
        mockContactId,
        undefined,
      );
    });

    test(`should pass both contactId and options when called with (fn, contactId, options)`, async () => {
      await sut[method](mockInterceptor, mockContactId, {
        maxConsecutiveBlocks: 3,
        timeout: 5000,
      });

      expect(mockExtensibility.addInterceptor).toHaveBeenCalledWith(
        expectedKey,
        mockInterceptor,
        mockContactId,
        { maxConsecutiveBlocks: 3, timeout: 5000 },
      );
    });
  });

  describe.each([
    ["removeOpenQuickConnectInterceptor", "openQuickConnect"],
    ["removeOpenOutboundDialerInterceptor", "openOutboundDialer"],
    ["removeClearContactInterceptor", "clearContact"],
  ] as const)("%s", (method, expectedKey) => {
    test(`should remove the ${expectedKey} interceptor with the contactId when called with (fn, contactId)`, async () => {
      await sut[method](mockInterceptor, mockContactId);

      expect(mockExtensibility.removeInterceptor).toHaveBeenCalledWith(
        expectedKey,
        mockInterceptor,
        mockContactId,
      );
    });

    test(`should remove the ${expectedKey} interceptor with contactId=undefined when called with (fn)`, async () => {
      await sut[method](mockInterceptor);

      expect(mockExtensibility.removeInterceptor).toHaveBeenCalledWith(
        expectedKey,
        mockInterceptor,
        undefined,
      );
    });
  });
});
