/* eslint-disable @typescript-eslint/unbound-method */
import {
  AcknowledgeMessage,
  ConnectLogger,
  getOriginAndPath,
  ProxyConnectionEvent,
  SubscribeMessage,
} from "@amazon-connect/core";
import { mocked, MockedObject } from "jest-mock";
import { mock } from "jest-mock-extended";

import { AmazonConnectStreamsSite } from "./amazon-connect-streams-site";
import { StreamsSiteProxy } from "./streams-site-proxy";

jest.mock("@amazon-connect/core/lib/logging/connect-logger");
jest.mock("@amazon-connect/core/lib/utility/id-generator");
jest.mock("@amazon-connect/core/lib/utility/location-helpers");

jest.mock("@amazon-connect/core/lib/utility/timeout-tracker");
jest.mock("@amazon-connect/core/lib/proxy/error/error-service");
jest.mock("@amazon-connect/core/lib/proxy/channel-manager");
jest.mock("@amazon-connect/core/lib/proxy/health-check/health-check-manager");

const instanceUrl = "https://test.com";
const providerMock = mock<AmazonConnectStreamsSite>({
  config: { instanceUrl },
});
const windowMock = mock<Window & typeof globalThis>();
const connectionEventHandlerMock = jest.fn<void, [ProxyConnectionEvent]>();

let sut: StreamsSiteProxy;
let loggerMock: MockedObject<ConnectLogger>;

beforeEach(jest.resetAllMocks);

beforeEach(() => {
  global.window = windowMock;

  sut = new StreamsSiteProxy(providerMock);
  loggerMock = mocked(ConnectLogger).mock.instances[3];
});

describe("proxyType", () => {
  test("should return streams-site", () => {
    const result = sut.proxyType;

    expect(result).toEqual("streams-site");
  });
});

describe("setCCPIFrame", () => {
  beforeEach(() => {
    sut.init();
  });

  describe("when iframe is not set", () => {
    const iframe = mock<HTMLIFrameElement>();

    test("should not trigger a reset when setting initial iframe", () => {
      sut.onConnectionStatusChange(connectionEventHandlerMock);

      sut.setCCPIframe(iframe);

      expect(connectionEventHandlerMock).not.toHaveBeenCalled();
    });

    test("should reference the iframe passed", () => {
      sut.setCCPIframe(iframe);

      expect(sut["ccpIFrame"]).toEqual(iframe);
    });

    test("should have a status of connecting", () => {
      sut.setCCPIframe(iframe);

      expect(sut.connectionStatus).toEqual("connecting");
    });

    test("should reset unexpectedIframeWarningCount to 0", () => {
      // Set counter to non-zero value first
      sut["unexpectedIframeWarningCount"] = 3;

      sut.setCCPIframe(iframe);

      expect(sut["unexpectedIframeWarningCount"]).toEqual(0);
    });
  });

  describe("when a different iframe is already set", () => {
    const originalIframe = mock<HTMLIFrameElement>();
    const replacementIFrame = mock<HTMLIFrameElement>();

    beforeEach(() => {
      sut.setCCPIframe(originalIframe);
    });

    test("should not trigger a reset when setting initial iframe", () => {
      sut.onConnectionStatusChange(connectionEventHandlerMock);

      sut.setCCPIframe(replacementIFrame);

      expect(connectionEventHandlerMock).toHaveBeenCalledWith({
        status: "reset",
        reason: "CCP IFrame Updated",
      });
    });

    test("should use the replacement iframe", () => {
      sut.setCCPIframe(replacementIFrame);

      expect(sut["ccpIFrame"]).toEqual(replacementIFrame);
    });

    test("should have a status of connecting", () => {
      sut.setCCPIframe(replacementIFrame);

      expect(sut.connectionStatus).toEqual("connecting");
    });

    test("should reset unexpectedIframeWarningCount to 0", () => {
      // Set counter to non-zero value first
      sut["unexpectedIframeWarningCount"] = 7;

      sut.setCCPIframe(replacementIFrame);

      expect(sut["unexpectedIframeWarningCount"]).toEqual(0);
    });
  });
});

describe("getUpstreamMessageOrigin", () => {
  const messagePortMock = mock<MessagePort>({
    onmessage: undefined,
  });
  const sourceWindow = { name: "parentWindow" } as Window;
  const validOrigin = "https://test.com";
  const origin = "https://test.com";
  const path = "/path";

  const ackMsg = mock<AcknowledgeMessage>({
    type: "acknowledge",
    connectionId: "abc",
    status: { startTime: new Date(), initialized: true },
  });
  const testEvent = {
    origin: validOrigin,
    data: { type: "cross-domain-adapter-init" },
    ports: [messagePortMock] as readonly MessagePort[],
    source: sourceWindow,
  } as MessageEvent<unknown>;

  test("should apply the message origin from location", () => {
    sut.init();
    const iframe = {
      contentWindow: sourceWindow,
    } as HTMLIFrameElement;
    sut.setCCPIframe(iframe);

    const handler = mocked(window.addEventListener).mock.calls[0][1] as (
      evt: MessageEvent<unknown>,
    ) => void;
    handler(testEvent);

    sut["consumerMessageHandler"]({
      data: ackMsg,
    } as MessageEvent<AcknowledgeMessage>);
    messagePortMock.postMessage.mockReset();

    mocked(getOriginAndPath).mockReturnValue({
      origin,
      path,
    });
    global.document = {
      ...global.document,
      location: mock<Location>({ origin, pathname: path }),
    };

    sut.subscribe({ key: "k", namespace: "n" }, jest.fn());

    expect(messagePortMock.postMessage).toHaveBeenCalledTimes(1);
    const message = messagePortMock.postMessage.mock
      .calls[0][0] as SubscribeMessage;
    expect(message.messageOrigin).toEqual({
      _type: "streams-site",
      providerId: sut["provider"].id,
      origin,
      path,
    });
  });
});

describe("verifyEventSource", () => {
  test("should return true when event source matches", () => {
    const sourceWindow = { name: "parentWindow" } as Window;
    const iframe = {
      contentWindow: sourceWindow,
    } as HTMLIFrameElement;
    sut.setCCPIframe(iframe);
    const testEvent = {
      data: { type: "cross-domain-adapter-init" },
      source: sourceWindow,
    } as MessageEvent<{ type?: string }>;

    const result = sut["verifyEventSource"](testEvent);

    expect(result).toBeTruthy();
    expect(loggerMock.warn).not.toHaveBeenCalled();
  });

  test("should return false when event source does not match", () => {
    const iframeWindow = { name: "parentWindow" } as Window;
    const eventSource = { name: "other" } as Window;
    const iframe = {
      contentWindow: iframeWindow,
    } as HTMLIFrameElement;
    sut.setCCPIframe(iframe);
    const testOrigin = "http://test.com";
    const testEvent = {
      data: { type: "cross-domain-adapter-init" },
      source: eventSource,
      origin: testOrigin,
    } as MessageEvent<{ type?: string }>;

    const result = sut["verifyEventSource"](testEvent);

    expect(result).toBeFalsy();
    expect(loggerMock.warn).toHaveBeenCalledWith(expect.any(String), {
      origin: testOrigin,
      unexpectedIframeWarningCount: 1,
    });
  });

  test("should throw if the iframe is not set", () => {
    const sourceWindow = { name: "parentWindow" } as Window;
    const testOrigin = "http://test.com";
    const testEvent = {
      data: { type: "cross-domain-adapter-init" },
      source: sourceWindow,
      origin: testOrigin,
    } as MessageEvent<{ type?: string }>;

    const result = sut["verifyEventSource"](testEvent);

    expect(result).toBeFalsy();
    expect(loggerMock.error).toHaveBeenCalledWith(expect.any(String), {
      origin: testOrigin,
    });
  });

  describe("unexpected iframe warning suppression", () => {
    test("should initialize unexpectedIframeWarningCount to 0", () => {
      expect(sut["unexpectedIframeWarningCount"]).toEqual(0);
    });

    test("should increment counter and log warning for first 4 invalid events", () => {
      const iframeWindow = { name: "parentWindow" } as Window;
      const eventSource = { name: "other" } as Window;
      const iframe = {
        contentWindow: iframeWindow,
      } as HTMLIFrameElement;
      sut.setCCPIframe(iframe);
      const testOrigin = "http://test.com";
      const testEvent = {
        data: { type: "cross-domain-adapter-init" },
        source: eventSource,
        origin: testOrigin,
      } as MessageEvent<{ type?: string }>;

      // First 4 calls should log warnings
      for (let i = 1; i <= 4; i++) {
        loggerMock.warn.mockClear();

        const result = sut["verifyEventSource"](testEvent);

        expect(result).toBeFalsy();
        expect(sut["unexpectedIframeWarningCount"]).toEqual(i);
        expect(loggerMock.warn).toHaveBeenCalledWith(expect.any(String), {
          origin: testOrigin,
          unexpectedIframeWarningCount: i,
        });
      }
    });

    test("should suppress warnings after 5th invalid event", () => {
      const iframeWindow = { name: "parentWindow" } as Window;
      const eventSource = { name: "other" } as Window;
      const iframe = {
        contentWindow: iframeWindow,
      } as HTMLIFrameElement;
      sut.setCCPIframe(iframe);
      const testOrigin = "http://test.com";
      const testEvent = {
        data: { type: "cross-domain-adapter-init" },
        source: eventSource,
        origin: testOrigin,
      } as MessageEvent<{ type?: string }>;

      // Trigger first 4 warnings
      for (let i = 1; i <= 4; i++) {
        sut["verifyEventSource"](testEvent);
      }

      loggerMock.warn.mockClear();

      // 5th and subsequent calls should not log warnings
      for (let i = 5; i <= 10; i++) {
        const result = sut["verifyEventSource"](testEvent);

        expect(result).toBeFalsy();
        expect(sut["unexpectedIframeWarningCount"]).toEqual(i);
        expect(loggerMock.warn).not.toHaveBeenCalled();
      }
    });

    test("should continue incrementing counter even after suppression", () => {
      const iframeWindow = { name: "parentWindow" } as Window;
      const eventSource = { name: "other" } as Window;
      const iframe = {
        contentWindow: iframeWindow,
      } as HTMLIFrameElement;
      sut.setCCPIframe(iframe);
      const testEvent = {
        data: { type: "cross-domain-adapter-init" },
        source: eventSource,
        origin: "http://test.com",
      } as MessageEvent<{ type?: string }>;

      // Set counter to high value to test continued incrementing
      sut["unexpectedIframeWarningCount"] = 10;

      const result = sut["verifyEventSource"](testEvent);

      expect(result).toBeFalsy();
      expect(sut["unexpectedIframeWarningCount"]).toEqual(11);
      expect(loggerMock.warn).not.toHaveBeenCalled();
    });
  });
});

describe("invalidInitMessageHandler", () => {
  test("should not log or take any action", () => {
    const sourceWindow = { name: "parentWindow" } as Window;
    const messageType = "invalid-message-type";
    sut.init();
    const iframe = {
      contentWindow: sourceWindow,
    } as HTMLIFrameElement;
    sut.setCCPIframe(iframe);
    const validOrigin = "https://test.com";
    const testEvent = {
      origin: validOrigin,
      data: { type: messageType },
      source: sourceWindow,
    } as MessageEvent<unknown>;

    const handler = mocked(window.addEventListener).mock.calls[0][1] as (
      evt: MessageEvent<unknown>,
    ) => void;
    handler(testEvent);

    expect(loggerMock.debug).not.toHaveBeenCalled();
    expect(loggerMock.info).not.toHaveBeenCalled();
    expect(loggerMock.warn).not.toHaveBeenCalled();
    expect(loggerMock.error).not.toHaveBeenCalled();
  });
});
