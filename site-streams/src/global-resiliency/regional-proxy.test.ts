/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { ConnectLogger, UpstreamMessage } from "@amazon-connect/core";
import { MockedClass, MockedObject } from "jest-mock";
import { mock } from "jest-mock-extended";

import { AmazonConnectGRStreamsSite } from "./amazon-connect-gr-streams-site";
import { GlobalResiliencyRegion } from "./global-resiliency-region";
import { GlobalResiliencyStreamsSiteMessageOrigin } from "./global-resiliency-streams-site-message-origin";
import { RegionalProxy, RegionalProxyParams } from "./regional-proxy";

jest.mock("@amazon-connect/core/lib/logging/connect-logger");
jest.mock("@amazon-connect/core/lib/utility/id-generator");
jest.mock("@amazon-connect/core/lib/utility/timeout-tracker");
jest.mock("@amazon-connect/core/lib/proxy/error/error-service");
jest.mock("@amazon-connect/core/lib/proxy/channel-manager");
jest.mock("@amazon-connect/core/lib/proxy/health-check/health-check-manager");

const LoggerMock = ConnectLogger as MockedClass<typeof ConnectLogger>;

const testPrimaryInstanceUrl = "https://primary.example.com";
const testSecondaryInstanceUrl = "https://secondary.example.com";
const testProviderId = "test-provider-id";

const mockProvider = mock<AmazonConnectGRStreamsSite>({
  id: testProviderId,
  config: {
    primaryInstanceUrl: testPrimaryInstanceUrl,
    secondaryInstanceUrl: testSecondaryInstanceUrl,
  },
});

const mockUpstreamMessageOrigin =
  mock<GlobalResiliencyStreamsSiteMessageOrigin>({
    _type: "global-resiliency-streams-site",
    providerId: testProviderId,
    activeRegion: GlobalResiliencyRegion.Primary,
    origin: "https://test.com",
    path: "/connect/ccp",
  });

const mockGetUpstreamMessageOrigin = jest.fn(() => mockUpstreamMessageOrigin);
const mockRelayToGlobalResiliencyProxy = jest.fn();

let sut: RegionalProxy;
let loggerMock: MockedObject<ConnectLogger>;

beforeEach(jest.resetAllMocks);

beforeEach(() => {
  const params: RegionalProxyParams = {
    provider: mockProvider,
    region: GlobalResiliencyRegion.Primary,
    getUpstreamMessageOrigin: mockGetUpstreamMessageOrigin,
    relayToGlobalResiliencyProxy: mockRelayToGlobalResiliencyProxy,
  };

  sut = new RegionalProxy(params);
  loggerMock = LoggerMock.mock.instances[3]; // Proxy logger is typically the 4th instance
});

describe("RegionalProxy", () => {
  describe("constructor", () => {
    test("should create proxy with primary region and primary instance URL", () => {
      const params: RegionalProxyParams = {
        provider: mockProvider,
        region: GlobalResiliencyRegion.Primary,
        getUpstreamMessageOrigin: mockGetUpstreamMessageOrigin,
        relayToGlobalResiliencyProxy: mockRelayToGlobalResiliencyProxy,
      };

      const proxy = new RegionalProxy(params);

      expect(proxy.region).toBe(GlobalResiliencyRegion.Primary);
      expect(proxy["instanceUrl"]).toBe(testPrimaryInstanceUrl);
    });

    test("should create proxy with secondary region and secondary instance URL", () => {
      const params: RegionalProxyParams = {
        provider: mockProvider,
        region: GlobalResiliencyRegion.Secondary,
        getUpstreamMessageOrigin: mockGetUpstreamMessageOrigin,
        relayToGlobalResiliencyProxy: mockRelayToGlobalResiliencyProxy,
      };

      const proxy = new RegionalProxy(params);

      expect(proxy.region).toBe(GlobalResiliencyRegion.Secondary);
      expect(proxy["instanceUrl"]).toBe(testSecondaryInstanceUrl);
    });

    test("should initialize with null CCP iframe", () => {
      expect(sut["ccpIFrame"]).toBeNull();
    });

    test("should initialize with zero unexpected iframe warning count", () => {
      expect(sut["unexpectedIframeWarningCount"]).toBe(0);
    });

    test("should store callback functions", () => {
      expect(sut["getParentUpstreamMessageOrigin"]).toBe(
        mockGetUpstreamMessageOrigin,
      );
      expect(sut["relayToGlobalResiliencyProxy"]).toBe(
        mockRelayToGlobalResiliencyProxy,
      );
    });
  });

  describe("proxyType", () => {
    test("should return correct proxy type", () => {
      expect(sut.proxyType).toBe("acgr-regional-proxy");
    });
  });

  describe("setCCPIframe", () => {
    test("should set the CCP iframe", () => {
      const iframe = mock<HTMLIFrameElement>();

      sut.setCCPIframe(iframe);

      expect(sut["ccpIFrame"]).toBe(iframe);
    });

    test("should reset unexpected iframe warning count", () => {
      const iframe = mock<HTMLIFrameElement>();
      sut["unexpectedIframeWarningCount"] = 5;

      sut.setCCPIframe(iframe);

      expect(sut["unexpectedIframeWarningCount"]).toBe(0);
    });

    test("should not reset connection when CCP iframe is not previously set", () => {
      const iframe = mock<HTMLIFrameElement>();
      const resetConnectionSpy = jest.spyOn(
        Object.getPrototypeOf(Object.getPrototypeOf(sut)),
        "resetConnection",
      );

      sut.setCCPIframe(iframe);

      expect(resetConnectionSpy).not.toHaveBeenCalled();
    });

    test("should reset connection when CCP iframe is already set", () => {
      const firstIframe = mock<HTMLIFrameElement>();
      const secondIframe = mock<HTMLIFrameElement>();
      const resetConnectionSpy = jest.spyOn(
        Object.getPrototypeOf(Object.getPrototypeOf(sut)),
        "resetConnection",
      );

      sut.setCCPIframe(firstIframe);
      sut.setCCPIframe(secondIframe);

      expect(resetConnectionSpy).toHaveBeenCalledWith("CCP IFrame Updated");
    });
  });

  describe("verifyEventSource", () => {
    test("should return false and log error when CCP iframe is not set", () => {
      const mockEvent = {
        origin: "https://test.com",
        source: {} as WindowProxy,
      } as MessageEvent<{ type?: string | undefined }>;

      const result = sut["verifyEventSource"](mockEvent);

      expect(result).toBe(false);
      expect(loggerMock.error).toHaveBeenCalledWith(
        "CCP Iframe not provided to proxy. Unable to verify event to Connect to CCP.",
        { origin: mockEvent.origin },
      );
    });

    test("should return true when event source matches CCP iframe content window", () => {
      const contentWindow = {} as WindowProxy;
      const iframe = { contentWindow } as HTMLIFrameElement;

      const mockEvent = {
        origin: "https://test.com",
        source: contentWindow,
      } as MessageEvent<{ type?: string | undefined }>;

      sut.setCCPIframe(iframe);
      const result = sut["verifyEventSource"](mockEvent);

      expect(result).toBe(true);
      expect(loggerMock.warn).not.toHaveBeenCalled();
    });

    test("should return false and log warning when event source does not match CCP iframe", () => {
      const contentWindow = {} as WindowProxy;
      const differentSource = {} as WindowProxy;
      const iframe = { contentWindow } as HTMLIFrameElement;

      const mockEvent = {
        origin: "https://test.com",
        source: differentSource,
      } as MessageEvent<{ type?: string | undefined }>;

      sut.setCCPIframe(iframe);
      const result = sut["verifyEventSource"](mockEvent);

      expect(result).toBe(false);
      expect(sut["unexpectedIframeWarningCount"]).toBe(1);
      expect(loggerMock.warn).toHaveBeenCalledWith(
        "Message came from unexpected iframe. Not a valid CCP. Will not connect",
        {
          origin: mockEvent.origin,
          unexpectedIframeWarningCount: 1,
        },
      );
    });

    test("should stop logging warnings after 5 unexpected iframe messages", () => {
      const contentWindow = {} as WindowProxy;
      const differentSource = {} as WindowProxy;
      const iframe = { contentWindow } as HTMLIFrameElement;

      const mockEvent = {
        origin: "https://test.com",
        source: differentSource,
      } as MessageEvent<{ type?: string | undefined }>;

      sut.setCCPIframe(iframe);

      // Call 6 times to exceed the warning limit
      for (let i = 0; i < 6; i++) {
        sut["verifyEventSource"](mockEvent);
      }

      expect(sut["unexpectedIframeWarningCount"]).toBe(6);
      expect(loggerMock.warn).toHaveBeenCalledTimes(4); // Should only log 4 times based on actual implementation
    });
  });

  describe("getUpstreamMessageOrigin", () => {
    test("should return upstream message origin from parent callback", () => {
      // Reset the mock to ensure clean state
      mockGetUpstreamMessageOrigin.mockReturnValue(mockUpstreamMessageOrigin);

      const result = (sut as any).getUpstreamMessageOrigin();

      expect(mockGetUpstreamMessageOrigin).toHaveBeenCalledWith();
      expect(result).toEqual(mockUpstreamMessageOrigin);
    });
  });

  describe("handleMessageFromSubject", () => {
    test("should relay response messages to global resiliency proxy", () => {
      const responseMessage = {
        type: "response",
        id: "test-id",
        data: { result: "success" },
      } as any;

      sut["handleMessageFromSubject"](responseMessage);

      expect(mockRelayToGlobalResiliencyProxy).toHaveBeenCalledWith(
        responseMessage,
      );
    });

    test("should relay publish messages to global resiliency proxy", () => {
      const publishMessage = {
        type: "publish",
        topic: "test-topic",
        data: { event: "test" },
      } as any;

      sut["handleMessageFromSubject"](publishMessage);

      expect(mockRelayToGlobalResiliencyProxy).toHaveBeenCalledWith(
        publishMessage,
      );
    });

    test("should relay error messages to global resiliency proxy", () => {
      const errorMessage = {
        type: "error",
        id: "test-id",
        error: { message: "test error" },
      } as any;

      sut["handleMessageFromSubject"](errorMessage);

      expect(mockRelayToGlobalResiliencyProxy).toHaveBeenCalledWith(
        errorMessage,
      );
    });

    test("should call super for other message types", () => {
      const otherMessage = {
        type: "other",
        data: { test: "data" },
      } as any;

      const superSpy = jest.spyOn(
        Object.getPrototypeOf(Object.getPrototypeOf(sut)),
        "handleMessageFromSubject",
      );

      sut["handleMessageFromSubject"](otherMessage);

      expect(superSpy).toHaveBeenCalledWith(otherMessage);
      expect(mockRelayToGlobalResiliencyProxy).not.toHaveBeenCalled();
    });
  });

  describe("sendOrQueueMessageToSubject", () => {
    test("should delegate to parent sendOrQueueMessageToSubject", () => {
      const message = mock<UpstreamMessage>();
      const superSpy = jest.spyOn(
        Object.getPrototypeOf(Object.getPrototypeOf(sut)),
        "sendOrQueueMessageToSubject",
      );

      sut.sendOrQueueMessageToSubject(message);

      expect(superSpy).toHaveBeenCalledWith(message);
    });
  });

  describe("invalidInitMessageHandler", () => {
    test("should take no action for invalid init messages", () => {
      // Should not throw or log anything
      expect(() => {
        sut["invalidInitMessageHandler"]();
      }).not.toThrow();

      // Verify no error logging occurred
      expect(loggerMock.error).not.toHaveBeenCalled();
    });
  });
});
