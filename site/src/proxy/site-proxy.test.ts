/* eslint-disable @typescript-eslint/unbound-method */
import {
  AcknowledgeMessage,
  AmazonConnectConfig,
  AmazonConnectProvider,
  ConnectLogger,
  LogLevel,
  LogMessage,
  ProxyConnectionEvent,
  UpstreamMessageOrigin,
} from "@amazon-connect/core";
import { mocked, MockedClass, MockedObject } from "jest-mock";
import { mock, MockProxy } from "jest-mock-extended";

import { SiteProxy } from "./site-proxy";

jest.mock("@amazon-connect/core/lib/logging/connect-logger");
jest.mock("@amazon-connect/core/lib/utility/id-generator");
jest.mock("@amazon-connect/core/lib/utility/timeout-tracker");
jest.mock("@amazon-connect/core/lib/proxy/error/error-service");
jest.mock("@amazon-connect/core/lib/proxy/channel-manager");

const LoggerMock = ConnectLogger as MockedClass<typeof ConnectLogger>;

const testInstanceUrl = "https://test.com/abc";
const validOrigin = "https://test.com";
const testLoggerContext = { foo: "bar" };

const windowMock = mock<Window & typeof globalThis>();

type TestProxyConfig = AmazonConnectConfig & { instanceUrl: string };
type MessageEventWithType = MessageEvent<{ type?: string }>;

const verifyEventSourceMock = jest.fn<
  boolean,
  [MessageEvent<{ type?: string | undefined }>]
>();

const invalidInitMessageHandlerMock = jest.fn<void, [unknown]>();
const consumerMessageHandlerMock = jest.fn<void, [MessageEvent<unknown>]>();
const connectionEventHandlerMock = jest.fn<void, [ProxyConnectionEvent]>();

class TestProxy extends SiteProxy<TestProxyConfig> {
  constructor(params?: { instanceUrlOverride?: string }) {
    super(
      new AmazonConnectProvider<TestProxyConfig>({
        config: {
          instanceUrl: params?.instanceUrlOverride ?? testInstanceUrl,
        },
        proxyFactory: () => this,
      }),
    );
  }

  protected verifyEventSource(evt: MessageEventWithType): boolean {
    return verifyEventSourceMock(evt);
  }
  protected invalidInitMessageHandler(data: unknown): void {
    invalidInitMessageHandlerMock(data);
  }
  protected getUpstreamMessageOrigin(): UpstreamMessageOrigin {
    return {
      _type: "test",
      providerId: this.provider.id,
    };
  }
  protected consumerMessageHandler(evt: MessageEvent<unknown>): void {
    consumerMessageHandlerMock(evt);
    super.consumerMessageHandler(evt);
  }

  protected addContextToLogger(): Record<string, unknown> {
    return { ...testLoggerContext, ...super.addContextToLogger() };
  }

  public mockPushAcknowledgeMessage() {
    const ackMsg = mock<AcknowledgeMessage>({
      type: "acknowledge",
      connectionId: "abc",
      status: { startTime: new Date(), initialized: true },
    });

    this.consumerMessageHandler({ data: ackMsg } as MessageEvent<unknown>);
  }

  get proxyType(): string {
    return "testProxy";
  }

  resetConnection(reason: string): void {
    super.resetConnection(reason);
  }

  setTestProxyAsConnected(messagePortMock?: MockProxy<MessagePort>): void {
    messagePortMock = messagePortMock ?? mock<MessagePort>();
    const testEvent = mock<MessageEventWithType>({
      origin: validOrigin,
      data: { type: "cross-domain-adapter-init" },
      ports: [messagePortMock],
    });
    const handler = mocked(window.addEventListener).mock.calls[0][1] as (
      evt: MessageEventWithType,
    ) => void;
    verifyEventSourceMock.mockReturnValue(true);
    handler(testEvent);
    sut.mockPushAcknowledgeMessage();
    messagePortMock.postMessage.mockReset();
  }
}

let sut: TestProxy;
let loggerMock: MockedObject<ConnectLogger>;

beforeEach(jest.resetAllMocks);

beforeAll(() => {
  global.window = windowMock;
});

beforeEach(() => {
  sut = new TestProxy();
  loggerMock = LoggerMock.mock.instances[3];
});

describe("constructor", () => {
  test("should create a separate logger for proxy", () => {
    expect(LoggerMock).toHaveBeenCalledTimes(4);
    expect(LoggerMock.mock.calls[3][0]).toEqual({
      source: "siteProxy",
      provider: expect.any(AmazonConnectProvider) as AmazonConnectProvider,
    });
  });
});

describe("initProxy", () => {
  test("should update status to 'connecting'", () => {
    sut.init();

    expect(sut.connectionStatus).toEqual("connecting");
  });

  test("should add handler to window", () => {
    sut.init();

    expect(window.addEventListener).toHaveBeenCalledWith(
      "message",
      expect.any(Function),
    );
  });
});

describe("listenForInitialMessage", () => {
  let handler: (evt: MessageEventWithType) => void;

  beforeEach(() => {
    sut.init();

    handler = mocked(window.addEventListener).mock.calls[0][1] as (
      evt: MessageEventWithType,
    ) => void;
  });

  describe("when the event source is not valid", () => {
    test("should take no action", () => {
      verifyEventSourceMock.mockReturnValue(false);
      const testEvent = mock<MessageEventWithType>();

      handler(testEvent);

      expect(verifyEventSourceMock).toHaveBeenCalledWith(testEvent);
      expect(sut.connectionStatus).toEqual("connecting");
      expect(loggerMock.debug).not.toHaveBeenCalled();
      expect(loggerMock.warn).not.toHaveBeenCalled();
      expect(loggerMock.error).not.toHaveBeenCalled();
    });
  });

  describe("when the event source is valid", () => {
    beforeEach(() => {
      verifyEventSourceMock.mockReturnValue(true);
    });

    describe("when the event does not contain an origin", () => {
      test("should take no action", () => {
        const testEvent = mock<MessageEventWithType>({
          origin: undefined,
        });

        handler(testEvent);

        expect(sut.connectionStatus).toEqual("connecting");
        expect(loggerMock.debug).not.toHaveBeenCalled();
        expect(loggerMock.error).not.toHaveBeenCalled();
        expect(loggerMock.warn).toHaveBeenCalledWith(expect.any(String));
      });
    });

    describe("when the instanceUrl is invalid", () => {
      test("should log error and take no action", () => {
        const invalidUrl = "invalidUrl";
        const eventOrigin = "https://test2.com";
        LoggerMock.mockReset();
        mocked(window.addEventListener).mockReset();
        sut = new TestProxy({ instanceUrlOverride: invalidUrl });
        loggerMock = LoggerMock.mock.instances[3];
        sut.init();
        handler = mocked(window.addEventListener).mock.calls[0][1] as (
          evt: MessageEventWithType,
        ) => void;

        const testEvent = mock<MessageEventWithType>({
          origin: eventOrigin,
        });

        handler(testEvent);

        expect(sut.connectionStatus).toEqual("connecting");
        expect(loggerMock.error).toHaveBeenCalledTimes(1);
        expect(loggerMock.error).toHaveBeenCalledWith(
          expect.any(String),
          {
            error: expect.anything() as Error,
            eventOrigin,
            configInstanceUrl: invalidUrl,
          },
          { duplicateMessageToConsole: true },
        );
        expect(loggerMock.debug).not.toHaveBeenCalled();
        expect(loggerMock.warn).not.toHaveBeenCalled();
      });
    });

    describe("when the origin is not expected for a unknown type", () => {
      test("should do nothing", () => {
        const eventOrigin = "https://test2.com";
        const testEvent = mock<MessageEventWithType>({
          origin: eventOrigin,
          data: { type: "not-expected" },
        });

        handler(testEvent);

        expect(sut.connectionStatus).toEqual("connecting");
        expect(loggerMock.warn).not.toHaveBeenCalled();
        expect(loggerMock.debug).not.toHaveBeenCalled();
        expect(loggerMock.error).not.toHaveBeenCalled();
      });
    });

    describe("when the origin is not expected for a the expected message type", () => {
      test("should log error and take no action", () => {
        const eventOrigin = "https://test2.com";
        const testEvent = mock<MessageEventWithType>({
          origin: eventOrigin,
          data: { type: "cross-domain-adapter-init" },
        });

        handler(testEvent);

        expect(sut.connectionStatus).toEqual("connecting");
        expect(loggerMock.warn).toHaveBeenCalledTimes(1);
        expect(loggerMock.warn).toHaveBeenCalledWith(
          expect.any(String),
          {
            eventOrigin,
            expectedOrigin: "https://test.com",
          },
          { duplicateMessageToConsole: true },
        );
        expect(loggerMock.debug).not.toHaveBeenCalled();
        expect(loggerMock.error).not.toHaveBeenCalled();
      });
    });

    describe("when the origin is valid", () => {
      describe("when the message is not of type'cross-domain-adapter-init'", () => {
        test("should invoke invalidInitMessageHandler and take no action", () => {
          const messagePortMock = mock<MessagePort>({
            onmessage: undefined,
          });
          const testEvent = mock<MessageEventWithType>({
            origin: validOrigin,
            data: { type: "wrong-type" },
            ports: [messagePortMock],
          });

          handler(testEvent);

          expect(invalidInitMessageHandlerMock).toHaveBeenCalledWith(
            testEvent.data,
          );
          expect(messagePortMock.onmessage).toBeUndefined();
          expect(sut.connectionStatus).toEqual("connecting");
          expect(loggerMock.debug).not.toHaveBeenCalled();
          expect(loggerMock.warn).not.toHaveBeenCalled();
          expect(loggerMock.error).not.toHaveBeenCalled();
        });
      });

      describe("when the MessagePort is not included in the event", () => {
        test("should throw an error and not updated status", () => {
          const testEvent = mock<MessageEventWithType>({
            origin: validOrigin,
            data: { type: "cross-domain-adapter-init" },
            ports: [undefined],
          });

          try {
            handler(testEvent);
          } catch (error) {
            expect(error).toBeInstanceOf(Error);
            expect(sut.connectionStatus).toEqual("connecting");
          }

          expect.hasAssertions();
        });
      });

      describe("when the event is valid", () => {
        describe("when there is not a valid message port (first call or after reset)", () => {
          test("should set the onmessage handler prior to calling postMessage", () => {
            const messagePortMock = mock<MessagePort>({
              onmessage: undefined,
            });
            const testEvent = mock<MessageEventWithType>({
              origin: validOrigin,
              data: { type: "cross-domain-adapter-init" },
              ports: [messagePortMock],
            });

            messagePortMock.postMessage.mockImplementationOnce(() => {
              expect(messagePortMock.onmessage).toBeDefined();
              const downstreamEvt = mock<MessageEvent<unknown>>();
              messagePortMock.onmessage!(downstreamEvt);
              expect(consumerMessageHandlerMock).toHaveBeenCalledWith(
                downstreamEvt,
              );
            });

            handler(testEvent);

            expect(messagePortMock.postMessage).toHaveBeenCalledWith({
              type: "cross-domain-site-ready",
              providerId: sut["provider"].id,
            });
          });

          test("should call postMessage after setting initializing", () => {
            const messagePortMock = mock<MessagePort>({
              onmessage: undefined,
            });
            const testEvent = mock<MessageEventWithType>({
              origin: validOrigin,
              data: { type: "cross-domain-adapter-init" },
              ports: [messagePortMock],
            });

            messagePortMock.postMessage.mockImplementationOnce(() => {
              expect(sut.connectionStatus).toEqual("initializing");
            });

            handler(testEvent);

            expect(messagePortMock.postMessage).toHaveBeenCalledWith({
              type: "cross-domain-site-ready",
              providerId: sut["provider"].id,
            });
          });

          test("should not remove the handler after posting", () => {
            const messagePortMock = mock<MessagePort>({
              onmessage: undefined,
            });
            const testEvent = mock<MessageEventWithType>({
              origin: validOrigin,
              data: { type: "cross-domain-adapter-init" },
              ports: [messagePortMock],
            });

            handler(testEvent);

            expect(windowMock.removeEventListener).not.toHaveBeenCalled();
            expect(loggerMock.debug).toHaveBeenCalled();
          });

          test("should not trigger reset event", () => {
            sut.onConnectionStatusChange(connectionEventHandlerMock);

            const messagePortMock = mock<MessagePort>({
              onmessage: undefined,
            });
            const testEvent = mock<MessageEventWithType>({
              origin: validOrigin,
              data: { type: "cross-domain-adapter-init" },
              ports: [messagePortMock],
            });

            handler(testEvent);

            expect(connectionEventHandlerMock).not.toHaveBeenCalledWith({
              status: "reset",
              reason: expect.any(String) as string,
            });
          });
        });

        describe("when there is not a valid message port (subsequent call without reset)", () => {
          beforeEach(() => {
            // First call
            const messagePortMock = mock<MessagePort>({
              onmessage: undefined,
            });
            const testEvent = mock<MessageEventWithType>({
              origin: validOrigin,
              data: { type: "cross-domain-adapter-init" },
              ports: [messagePortMock],
            });
            handler(testEvent);
          });

          test("should set the onmessage handler prior to calling postMessage", () => {
            const messagePortMock = mock<MessagePort>({
              onmessage: undefined,
            });
            const testEvent = mock<MessageEventWithType>({
              origin: validOrigin,
              data: { type: "cross-domain-adapter-init" },
              ports: [messagePortMock],
            });

            messagePortMock.postMessage.mockImplementationOnce(() => {
              expect(messagePortMock.onmessage).toBeDefined();
              const downstreamEvt = mock<MessageEvent<unknown>>();
              messagePortMock.onmessage!(downstreamEvt);
              expect(consumerMessageHandlerMock).toHaveBeenCalledWith(
                downstreamEvt,
              );
            });

            handler(testEvent);

            expect(messagePortMock.postMessage).toHaveBeenCalledWith({
              type: "cross-domain-site-ready",
              providerId: sut["provider"].id,
            });
          });

          test("should call postMessage after setting initializing", () => {
            const messagePortMock = mock<MessagePort>({
              onmessage: undefined,
            });
            const testEvent = mock<MessageEventWithType>({
              origin: validOrigin,
              data: { type: "cross-domain-adapter-init" },
              ports: [messagePortMock],
            });

            messagePortMock.postMessage.mockImplementationOnce(() => {
              expect(sut.connectionStatus).toEqual("initializing");
            });

            handler(testEvent);

            expect(messagePortMock.postMessage).toHaveBeenCalledWith({
              type: "cross-domain-site-ready",
              providerId: sut["provider"].id,
            });
          });

          test("should trigger reset event", () => {
            sut.onConnectionStatusChange(connectionEventHandlerMock);

            const messagePortMock = mock<MessagePort>({
              onmessage: undefined,
            });
            const testEvent = mock<MessageEventWithType>({
              origin: validOrigin,
              data: { type: "cross-domain-adapter-init" },
              ports: [messagePortMock],
            });

            handler(testEvent);

            expect(connectionEventHandlerMock).toHaveBeenCalledWith({
              status: "reset",
              reason: "Subsequent Message Port Detected",
            });
            expect(loggerMock.info).toHaveBeenCalledWith(
              "Subsequent message port received. Resetting connection",
            );
          });
        });
      });
    });
  });
});

describe("sendMessageToSubject", () => {
  describe("when setup correctly", () => {
    const messagePortMock = mock<MessagePort>({
      onmessage: undefined,
    });

    beforeEach(() => {
      sut.init();
      sut.setTestProxyAsConnected(messagePortMock);
    });

    test("should send log message to messagePort", () => {
      const logMessage = mock<LogMessage>({
        type: "log",
      });

      sut.sendLogMessage(logMessage);

      expect(messagePortMock.postMessage).toHaveBeenCalledWith(logMessage);
      expect(loggerMock.error).not.toHaveBeenCalled();
    });

    test("should addContextToLogger to log message", () => {
      const logMessage: LogMessage = {
        type: "log",
        level: LogLevel.error,
        source: "source",
        message: "message",
        loggerId: "a",
        time: new Date(),
        data: { d: "a" },
        context: { original: "1" },
        messageOrigin: { _type: "test", providerId: "1" },
      };

      sut.sendLogMessage(logMessage);

      const messageSent = mocked(messagePortMock.postMessage).mock
        .calls[0][0] as LogMessage;
      expect(messageSent).toBeDefined();
      expect(messageSent.context).toEqual({
        ...testLoggerContext,
        original: "1",
      });
    });
  });

  describe("when messagePort is not created (should never happen)", () => {
    test("should log error when upstream message is sent", () => {
      // Calling init without completing message channel handshake
      sut.init();
      // Acknowledge will never be sent without message channel,
      // but in theory, this could be invoked by internal means
      sut.mockPushAcknowledgeMessage();

      const logMessage = mock<LogMessage>({
        type: "log",
      });

      sut.sendLogMessage(logMessage);

      expect(loggerMock.error).toHaveBeenCalledWith(expect.any(String), {
        messageType: "log",
      });
    });
  });
});

describe("resetConnection", () => {
  test("should send reset event", () => {
    const testResetReason = "test-reset-reason";
    sut.init();
    sut.setTestProxyAsConnected();
    sut.onConnectionStatusChange(connectionEventHandlerMock);

    sut.resetConnection(testResetReason);

    expect(connectionEventHandlerMock).toHaveBeenCalledWith({
      status: "reset",
      reason: testResetReason,
    });
  });

  test("should set messagePort as undefined", () => {
    sut.init();
    sut.setTestProxyAsConnected();
    expect(sut["messagePort"]).toBeDefined();

    sut.resetConnection("test");

    expect(sut["messagePort"]).toBeUndefined();
  });

  test("should have a status of connected", () => {
    const testResetReason = "test-reset-reason";
    sut.init();
    sut.setTestProxyAsConnected();
    sut.onConnectionStatusChange(connectionEventHandlerMock);

    sut.resetConnection(testResetReason);

    expect(connectionEventHandlerMock).toHaveBeenCalledWith({
      status: "connecting",
    });
    expect(connectionEventHandlerMock.mock.calls[1][0].status).toEqual(
      "connecting",
    );
    expect(sut.connectionStatus).toEqual("connecting");
  });
});
