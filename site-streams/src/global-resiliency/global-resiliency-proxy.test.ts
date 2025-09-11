/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {
  AddChildChannelDirectParams,
  AddChildChannelPortParams,
  ConnectLogger,
  getOriginAndPath,
  UpstreamMessage,
} from "@amazon-connect/core";
import { UpdateChannelPortParams } from "@amazon-connect/core/lib/proxy/channel-manager";
import { mocked } from "jest-mock";
import { mock } from "jest-mock-extended";

import { AmazonConnectGRStreamsSite } from "./amazon-connect-gr-streams-site";
import { AmazonConnectGRStreamsSiteConfig } from "./amazon-connect-gr-streams-site-config";
import { GlobalResiliencyProxy } from "./global-resiliency-proxy";
import {
  GlobalResiliencyRegion,
  GlobalResiliencyRegionIframe,
} from "./global-resiliency-region";
import { RegionalProxy } from "./regional-proxy";
import { verifyRegion } from "./verify-region";

jest.mock("@amazon-connect/core/lib/logging/connect-logger");
jest.mock("@amazon-connect/core/lib/utility/location-helpers");
jest.mock("./regional-proxy");
jest.mock("./verify-region");

const getGlobalResiliencyProxyLogger = () => {
  const idx = mocked(ConnectLogger).mock.calls.findIndex(
    ([a]) => typeof a === "object" && a.source === "globalResiliencyProxy",
  );

  if (idx < 0) throw new Error("global resiliency proxy logger not found");

  return mocked(ConnectLogger).mock.instances[idx];
};

const testProviderId = "test-provider-id";
const testOrigin = "https://test.example.com";
const testPath = "/connect/ccp";

const mockProvider = mock<AmazonConnectGRStreamsSite>({
  id: testProviderId,
  config: mock<AmazonConnectGRStreamsSiteConfig>({
    primaryInstanceUrl: "https://primary.connect.aws",
    secondaryInstanceUrl: "https://secondary.connect.aws",
  }),
});

let sut: GlobalResiliencyProxy;
let mockPrimaryProxy: RegionalProxy;
let mockSecondaryProxy: RegionalProxy;

beforeEach(jest.resetAllMocks);

beforeEach(() => {
  mocked(getOriginAndPath).mockReturnValue({
    origin: testOrigin,
    path: testPath,
  });

  sut = new GlobalResiliencyProxy(mockProvider);

  // Get the mocked regional proxies
  const regionalProxyInstances = mocked(RegionalProxy).mock.instances;
  mockPrimaryProxy = regionalProxyInstances[0];
  mockSecondaryProxy = regionalProxyInstances[1];
});

describe("GlobalResiliencyProxy", () => {
  describe("constructor", () => {
    test("should create regional proxies for both regions", () => {
      expect(RegionalProxy).toHaveBeenCalledTimes(2);

      // Verify primary proxy creation
      expect(RegionalProxy).toHaveBeenNthCalledWith(1, {
        provider: mockProvider,
        region: GlobalResiliencyRegion.Primary,
        getUpstreamMessageOrigin: expect.any(Function),
        relayToGlobalResiliencyProxy: expect.any(Function),
      });

      // Verify secondary proxy creation
      expect(RegionalProxy).toHaveBeenNthCalledWith(2, {
        provider: mockProvider,
        region: GlobalResiliencyRegion.Secondary,
        getUpstreamMessageOrigin: expect.any(Function),
        relayToGlobalResiliencyProxy: expect.any(Function),
      });
    });

    test("should pass getUpstreamMessageOrigin function that relays to proxy's method", () => {
      // Get the function passed to the first regional proxy
      const primaryProxyCall = mocked(RegionalProxy).mock.calls[0][0];
      const getUpstreamMessageOriginFn =
        primaryProxyCall.getUpstreamMessageOrigin;

      // Call the function and verify it returns the expected result
      const result = getUpstreamMessageOriginFn();

      // Verify it returns the correct message origin structure
      expect(result).toEqual({
        _type: "global-resiliency-streams-site",
        providerId: testProviderId,
        origin: testOrigin,
        path: testPath,
        activeRegion: GlobalResiliencyRegion.Primary,
      });
    });

    test("should pass relayToGlobalResiliencyProxy function that is bound to handleMessageFromSubject", () => {
      // Get the function passed to the first regional proxy
      const primaryProxyCall = mocked(RegionalProxy).mock.calls[0][0];
      const relayToGlobalResiliencyProxyFn =
        primaryProxyCall.relayToGlobalResiliencyProxy;

      // Verify the function is callable and doesn't throw
      const mockMessage = {
        type: "response",
        isError: false,
        data: { test: "data" },
      } as any;

      // This should not throw an error, confirming the function is properly bound
      expect(() => relayToGlobalResiliencyProxyFn(mockMessage)).not.toThrow();

      // Verify it's a function bound to the proxy instance
      expect(typeof relayToGlobalResiliencyProxyFn).toBe("function");
    });

    test("should set active region to primary by default", () => {
      expect(sut["activeRegion"]).toBe(GlobalResiliencyRegion.Primary);
    });

    test("should create logger with correct source", () => {
      expect(ConnectLogger).toHaveBeenCalledWith({
        source: "globalResiliencyProxy",
        provider: mockProvider,
      });
    });
  });

  describe("initProxy", () => {
    test("should initialize both regional proxies", () => {
      sut["initProxy"]();

      expect(mockPrimaryProxy.init).toHaveBeenCalledTimes(1);
      expect(mockSecondaryProxy.init).toHaveBeenCalledTimes(1);
    });
  });

  describe("proxyType", () => {
    test("should return correct proxy type", () => {
      expect(sut.proxyType).toBe("global-resiliency-proxy");
    });
  });

  describe("setCCPIframe", () => {
    test("should verify region and delegate to correct regional proxy for primary", () => {
      const iframe = {} as HTMLIFrameElement;
      const regionIframe: GlobalResiliencyRegionIframe = {
        iframe,
        region: GlobalResiliencyRegion.Primary,
      };

      sut.setCCPIframe(regionIframe);

      expect(verifyRegion).toHaveBeenCalledWith(GlobalResiliencyRegion.Primary);
      expect(mockPrimaryProxy.setCCPIframe).toHaveBeenCalledWith(iframe);
      expect(mockSecondaryProxy.setCCPIframe).not.toHaveBeenCalled();
    });

    test("should verify region and delegate to correct regional proxy for secondary", () => {
      const iframe = {} as HTMLIFrameElement;
      const regionIframe: GlobalResiliencyRegionIframe = {
        iframe,
        region: GlobalResiliencyRegion.Secondary,
      };

      sut.setCCPIframe(regionIframe);

      expect(verifyRegion).toHaveBeenCalledWith(
        GlobalResiliencyRegion.Secondary,
      );
      expect(mockSecondaryProxy.setCCPIframe).toHaveBeenCalledWith(iframe);
      expect(mockPrimaryProxy.setCCPIframe).not.toHaveBeenCalled();
    });
  });

  describe("setActiveRegion", () => {
    let mockUnsubscribeAllHandlers: jest.Mock<void, []>;
    let mockRestoreAllHandler: jest.Mock<void, []>;
    let mockStatusUpdate: jest.Mock<
      void,
      [
        {
          status: string;
          connectionId?: string;
          reason?: string;
          details?: any;
        },
      ]
    >;
    let mockStatusGetStatus: jest.Mock<string, []>;

    beforeEach(() => {
      // Mock protected methods
      mockUnsubscribeAllHandlers = jest.fn();
      mockRestoreAllHandler = jest.fn();
      (sut as any).unsubscribeAllHandlers = mockUnsubscribeAllHandlers;
      (sut as any).restoreAllHandler = mockRestoreAllHandler;

      // Mock status manager
      mockStatusUpdate = jest.fn();
      mockStatusGetStatus = jest.fn().mockReturnValue("ready");
      (sut as any).status = {
        update: mockStatusUpdate,
        getStatus: mockStatusGetStatus,
      };

      // Mock regional proxy properties - only set defaults, individual tests override as needed
      (mockPrimaryProxy as any).instanceUrl = "https://primary.connect.aws";
      (mockSecondaryProxy as any).instanceUrl = "https://secondary.connect.aws";
    });

    test("should verify region", () => {
      sut.setActiveRegion(GlobalResiliencyRegion.Secondary);

      expect(verifyRegion).toHaveBeenCalledWith(
        GlobalResiliencyRegion.Secondary,
      );
    });

    test("should take no action when region equals active region", () => {
      const logger = getGlobalResiliencyProxyLogger();

      // Active region is already Primary by default
      sut.setActiveRegion(GlobalResiliencyRegion.Primary);

      expect(sut["activeRegion"]).toBe(GlobalResiliencyRegion.Primary);
      expect(mockUnsubscribeAllHandlers).not.toHaveBeenCalled();
      expect(mockRestoreAllHandler).not.toHaveBeenCalled();
      expect(logger.info).not.toHaveBeenCalled();
      expect(mockStatusUpdate).not.toHaveBeenCalled();
    });

    test("should call unsubscribeAllHandlers before switching active region", () => {
      sut.setActiveRegion(GlobalResiliencyRegion.Secondary);

      expect(mockUnsubscribeAllHandlers).toHaveBeenCalledTimes(1);
      expect(mockRestoreAllHandler).toHaveBeenCalledTimes(1);
    });

    test("should call restoreAllHandler after active region is changed", () => {
      sut.setActiveRegion(GlobalResiliencyRegion.Secondary);

      expect(mockRestoreAllHandler).toHaveBeenCalledTimes(1);
      expect(mockUnsubscribeAllHandlers).toHaveBeenCalledTimes(1);
    });

    test("should log active region changed with correct information", () => {
      const logger = getGlobalResiliencyProxyLogger();

      sut.setActiveRegion(GlobalResiliencyRegion.Secondary);

      expect(logger.info).toHaveBeenCalledWith("Active region changed", {
        current: GlobalResiliencyRegion.Secondary,
        instanceUrl: "https://secondary.connect.aws",
        previousInstanceUrl: "https://primary.connect.aws",
      });
    });

    test("should update active region when different from current", () => {
      sut.setActiveRegion(GlobalResiliencyRegion.Secondary);

      expect(sut["activeRegion"]).toBe(GlobalResiliencyRegion.Secondary);
    });

    describe("status handling for ready state", () => {
      test("should always fire ready event and log when new region is ready", () => {
        const logger = getGlobalResiliencyProxyLogger();
        (mockSecondaryProxy as any).connectionStatus = "ready";
        (mockSecondaryProxy as any).connectionId = "secondary-connection-id";

        sut.setActiveRegion(GlobalResiliencyRegion.Secondary);

        expect(logger.info).toHaveBeenCalledWith("Active region is ready", {
          activeRegionStatus: "ready",
        });
        expect(mockStatusUpdate).toHaveBeenCalledWith({
          status: "ready",
          connectionId: "secondary-connection-id",
        });
      });

      test("should fire ready event even when previous status was ready", () => {
        mockStatusGetStatus.mockReturnValue("ready");
        (mockSecondaryProxy as any).connectionStatus = "ready";
        (mockSecondaryProxy as any).connectionId = "secondary-connection-id";

        sut.setActiveRegion(GlobalResiliencyRegion.Secondary);

        expect(mockStatusUpdate).toHaveBeenCalledWith({
          status: "ready",
          connectionId: "secondary-connection-id",
        });
      });
    });

    describe("status handling for connecting state", () => {
      test("should fire connecting event when current status is different", () => {
        mockStatusGetStatus.mockReturnValue("ready");
        (mockSecondaryProxy as any).connectionStatus = "connecting";

        sut.setActiveRegion(GlobalResiliencyRegion.Secondary);

        expect(mockStatusUpdate).toHaveBeenCalledWith({
          status: "connecting",
        });
      });

      test("should not fire connecting event when current status is already connecting", () => {
        mockStatusGetStatus.mockReturnValue("connecting");
        (mockSecondaryProxy as any).connectionStatus = "connecting";

        sut.setActiveRegion(GlobalResiliencyRegion.Secondary);

        expect(mockStatusUpdate).not.toHaveBeenCalled();
      });
    });

    describe("status handling for initializing state", () => {
      test("should fire initializing event when current status is different", () => {
        mockStatusGetStatus.mockReturnValue("ready");
        (mockSecondaryProxy as any).connectionStatus = "initializing";

        sut.setActiveRegion(GlobalResiliencyRegion.Secondary);

        expect(mockStatusUpdate).toHaveBeenCalledWith({
          status: "initializing",
        });
      });

      test("should not fire initializing event when current status is already initializing", () => {
        mockStatusGetStatus.mockReturnValue("initializing");
        (mockSecondaryProxy as any).connectionStatus = "initializing";

        sut.setActiveRegion(GlobalResiliencyRegion.Secondary);

        expect(mockStatusUpdate).not.toHaveBeenCalled();
      });
    });

    describe("status handling for error state", () => {
      test("should fire error event when current status is different", () => {
        mockStatusGetStatus.mockReturnValue("ready");
        (mockSecondaryProxy as any).connectionStatus = "error";

        sut.setActiveRegion(GlobalResiliencyRegion.Secondary);

        expect(mockStatusUpdate).toHaveBeenCalledWith({
          status: "error",
          reason: "new active region in error on transition",
          details: { region: GlobalResiliencyRegion.Secondary },
        });
      });

      test("should not fire error event when current status is already error", () => {
        mockStatusGetStatus.mockReturnValue("error");
        (mockSecondaryProxy as any).connectionStatus = "error";

        sut.setActiveRegion(GlobalResiliencyRegion.Secondary);

        expect(mockStatusUpdate).not.toHaveBeenCalled();
      });
    });

    test("should switch from secondary back to primary region with full workflow", () => {
      const logger = getGlobalResiliencyProxyLogger();

      // First switch to secondary
      sut.setActiveRegion(GlobalResiliencyRegion.Secondary);
      expect(sut["activeRegion"]).toBe(GlobalResiliencyRegion.Secondary);

      // Reset mocks for second switch
      jest.clearAllMocks();

      // Now switch back to primary
      sut.setActiveRegion(GlobalResiliencyRegion.Primary);

      expect(sut["activeRegion"]).toBe(GlobalResiliencyRegion.Primary);
      expect(mockUnsubscribeAllHandlers).toHaveBeenCalledTimes(1);
      expect(mockRestoreAllHandler).toHaveBeenCalledTimes(1);
      expect(logger.info).toHaveBeenCalledWith("Active region changed", {
        current: GlobalResiliencyRegion.Primary,
        instanceUrl: "https://primary.connect.aws",
        previousInstanceUrl: "https://secondary.connect.aws",
      });
    });
  });

  describe("sendOrQueueMessageToSubject", () => {
    test("should delegate to active region proxy", () => {
      const message = mock<UpstreamMessage>();

      sut["sendOrQueueMessageToSubject"](message);

      expect(mockPrimaryProxy.sendOrQueueMessageToSubject).toHaveBeenCalledWith(
        message,
      );
      expect(
        mockSecondaryProxy.sendOrQueueMessageToSubject,
      ).not.toHaveBeenCalled();
    });

    test("should delegate to secondary region when active", () => {
      sut["activeRegion"] = GlobalResiliencyRegion.Secondary;
      const message = mock<UpstreamMessage>();

      sut["sendOrQueueMessageToSubject"](message);

      expect(
        mockSecondaryProxy.sendOrQueueMessageToSubject,
      ).toHaveBeenCalledWith(message);
      expect(
        mockPrimaryProxy.sendOrQueueMessageToSubject,
      ).not.toHaveBeenCalled();
    });
  });

  describe("sendMessageToSubject", () => {
    test("should delegate to active region proxy", () => {
      const message = mock<UpstreamMessage>();

      sut["sendMessageToSubject"](message);

      expect(mockPrimaryProxy.sendOrQueueMessageToSubject).toHaveBeenCalledWith(
        message,
      );
      expect(
        mockSecondaryProxy.sendOrQueueMessageToSubject,
      ).not.toHaveBeenCalled();
    });

    test("should delegate to secondary region when active", () => {
      sut["activeRegion"] = GlobalResiliencyRegion.Secondary;
      const message = mock<UpstreamMessage>();

      sut["sendMessageToSubject"](message);

      expect(
        mockSecondaryProxy.sendOrQueueMessageToSubject,
      ).toHaveBeenCalledWith(message);
      expect(
        mockPrimaryProxy.sendOrQueueMessageToSubject,
      ).not.toHaveBeenCalled();
    });
  });

  describe("addContextToLogger", () => {
    test("should return active region context", () => {
      const context = sut["addContextToLogger"]();

      expect(context).toEqual({
        activeRegion: GlobalResiliencyRegion.Primary,
      });
    });

    test("should return secondary region when active", () => {
      sut["activeRegion"] = GlobalResiliencyRegion.Secondary;

      const context = sut["addContextToLogger"]();

      expect(context).toEqual({
        activeRegion: GlobalResiliencyRegion.Secondary,
      });
    });
  });

  describe("getUpstreamMessageOrigin", () => {
    test("should return correct message origin for primary region", () => {
      const origin = sut["getUpstreamMessageOrigin"]();

      expect(getOriginAndPath).toHaveBeenCalledTimes(1);
      expect(origin).toEqual({
        _type: "global-resiliency-streams-site",
        providerId: testProviderId,
        origin: testOrigin,
        path: testPath,
        activeRegion: GlobalResiliencyRegion.Primary,
      });
    });

    test("should return correct message origin for secondary region", () => {
      sut["activeRegion"] = GlobalResiliencyRegion.Secondary;

      const origin = sut["getUpstreamMessageOrigin"]();

      expect(origin).toEqual({
        _type: "global-resiliency-streams-site",
        providerId: testProviderId,
        origin: testOrigin,
        path: testPath,
        activeRegion: GlobalResiliencyRegion.Secondary,
      });
    });
  });

  describe("addChildIframeChannel", () => {
    test("should delegate to active region proxy", () => {
      const params = mock<AddChildChannelPortParams>();

      sut.addChildIframeChannel(params);

      expect(mockPrimaryProxy.addChildIframeChannel).toHaveBeenCalledWith(
        params,
      );
      expect(mockSecondaryProxy.addChildIframeChannel).not.toHaveBeenCalled();
    });

    test("should delegate to secondary region when active", () => {
      sut["activeRegion"] = GlobalResiliencyRegion.Secondary;
      const params = mock<AddChildChannelPortParams>();

      sut.addChildIframeChannel(params);

      expect(mockSecondaryProxy.addChildIframeChannel).toHaveBeenCalledWith(
        params,
      );
      expect(mockPrimaryProxy.addChildIframeChannel).not.toHaveBeenCalled();
    });
  });

  describe("addChildComponentChannel", () => {
    test("should delegate to active region proxy", () => {
      const params = mock<AddChildChannelDirectParams>();

      sut.addChildComponentChannel(params);

      expect(mockPrimaryProxy.addChildComponentChannel).toHaveBeenCalledWith(
        params,
      );
      expect(
        mockSecondaryProxy.addChildComponentChannel,
      ).not.toHaveBeenCalled();
    });

    test("should delegate to secondary region when active", () => {
      sut["activeRegion"] = GlobalResiliencyRegion.Secondary;
      const params = mock<AddChildChannelDirectParams>();

      sut.addChildComponentChannel(params);

      expect(mockSecondaryProxy.addChildComponentChannel).toHaveBeenCalledWith(
        params,
      );
      expect(mockPrimaryProxy.addChildComponentChannel).not.toHaveBeenCalled();
    });
  });

  describe("updateChildIframeChannelPort", () => {
    test("should delegate to active region proxy", () => {
      const params = mock<UpdateChannelPortParams>();

      sut.updateChildIframeChannelPort(params);

      expect(
        mockPrimaryProxy.updateChildIframeChannelPort,
      ).toHaveBeenCalledWith(params);
      expect(
        mockSecondaryProxy.updateChildIframeChannelPort,
      ).not.toHaveBeenCalled();
    });

    test("should delegate to secondary region when active", () => {
      sut["activeRegion"] = GlobalResiliencyRegion.Secondary;
      const params = mock<UpdateChannelPortParams>();

      sut.updateChildIframeChannelPort(params);

      expect(
        mockSecondaryProxy.updateChildIframeChannelPort,
      ).toHaveBeenCalledWith(params);
      expect(
        mockPrimaryProxy.updateChildIframeChannelPort,
      ).not.toHaveBeenCalled();
    });
  });
});
