/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { mocked, MockedClass, MockedObject } from "jest-mock";

import { AmazonConnectErrorHandler } from "../amazon-connect-error";
import { LogLevel } from "../logging";
import { ConnectLogger } from "../logging/connect-logger";
import {
  AcknowledgeMessage,
  DownstreamMessage,
  ErrorMessage,
  LogMessage,
  PublishMessage,
  RequestMessage,
  ResponseMessage,
  SubscribeMessage,
  UnsubscribeMessage,
  UpstreamMessage,
  UpstreamMessageOrigin,
} from "../messaging";
import {
  SubscriptionHandler,
  SubscriptionHandlerData,
  SubscriptionHandlerId,
  SubscriptionManager,
  SubscriptionTopic,
} from "../messaging/subscription";
import { AmazonConnectProvider } from "../provider";
import { createRequestMessage, RequestManager } from "../request";
import { ErrorService } from "./error";
import { Proxy } from "./proxy";
import {
  ProxyConnectionChangedHandler,
  ProxyConnectionStatus,
  ProxyConnectionStatusManager,
} from "./proxy-connection";

jest.mock("../logging/connect-logger");
jest.mock("../messaging/subscription/subscription-manager");
jest.mock("./error/error-service");
jest.mock("./proxy-connection/proxy-connection-status-manager");
jest.mock("../request/request-manager");
jest.mock("../request/request-message-factory");

const LoggerMock = ConnectLogger as MockedClass<typeof ConnectLogger>;
const RequestManagerMock = RequestManager as MockedClass<typeof RequestManager>;
const SubscriptionManagerMock = SubscriptionManager as MockedClass<
  typeof SubscriptionManager
>;
const ErrorServiceMock = ErrorService as MockedClass<typeof ErrorService>;
const ProxyConnectionStatusManagerMock =
  ProxyConnectionStatusManager as MockedClass<
    typeof ProxyConnectionStatusManager
  >;

const testOrigin = { _type: "test_origin" };

class TestProxy extends Proxy {
  public readonly upstreamMessagesSent: UpstreamMessage[];

  constructor(private readonly loggerContext?: Record<string, unknown>) {
    super(new AmazonConnectProvider({ config: {}, proxyFactory: () => this }));
    this.upstreamMessagesSent = [];
  }

  protected initProxy(): void {
    this.status.update({ status: "initializing" });
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected sendMessageToSubject(message: any): void {
    this.upstreamMessagesSent.push(message as UpstreamMessage);
  }
  protected addContextToLogger(): Record<string, unknown> {
    return this.loggerContext ?? {};
  }
  public get proxyType(): string {
    return "test";
  }
  protected getUpstreamMessageOrigin(): UpstreamMessageOrigin {
    return testOrigin;
  }

  public mockPushAcknowledgeMessage() {
    const ackMsg: AcknowledgeMessage = {
      type: "acknowledge",
      status: { startTime: new Date(), initialized: true },
    };

    this.mockPushMessage(ackMsg);
  }

  public mockPublish(
    topic: SubscriptionTopic,
    data: SubscriptionHandlerData,
    handlerId?: SubscriptionHandlerId,
  ) {
    const pubMsg: PublishMessage = {
      type: "publish",
      topic,
      data,
      handlerId,
    };

    this.mockPushMessage(pubMsg);
  }

  public mockPushMessage(msg: DownstreamMessage | { type: string }) {
    const messageEvent: MessageEvent<any> = {
      data: msg,
    } as MessageEvent<any>;

    this.consumerMessageHandler(messageEvent);
  }

  static getReadyTestProxy(config?: {
    loggerContext?: Record<string, unknown>;
  }): TestProxy {
    const proxy = new TestProxy(config?.loggerContext);
    proxy.init();
    proxy.mockPushAcknowledgeMessage();
    return proxy;
  }
}

const testTopic: Readonly<SubscriptionTopic> = {
  namespace: "test",
  key: "foo",
};

beforeEach(() => {
  jest.resetAllMocks();
});

describe("constructor", () => {
  test("should apply the proxy type to logger mix", () => {
    const sut = new TestProxy();
    const loggerConfig = LoggerMock.mock.calls[0][0];
    expect(typeof loggerConfig).not.toBe("string");
    if (typeof loggerConfig === "string") throw Error("ts needs this");
    const mixin = loggerConfig.mixin!;

    const result = mixin({}, LogLevel.info);

    expect(result.proxyType).toEqual(sut.proxyType);
  });
});

describe("init", () => {
  test("should be not connected when init was not called", () => {
    const sut = new TestProxy();
    const [proxyConnectionStatusManager] =
      ProxyConnectionStatusManagerMock.mock.instances;
    proxyConnectionStatusManager.getStatus.mockReturnValueOnce("notConnected");

    expect(sut.connectionStatus).toEqual("notConnected");
  });

  test("should be initializing after init is called", () => {
    const sut = new TestProxy();
    const [proxyConnectionStatusManager] =
      ProxyConnectionStatusManagerMock.mock.instances;
    let status: ProxyConnectionStatus;
    proxyConnectionStatusManager.update.mockImplementation(
      (evt) => (status = evt.status),
    );
    proxyConnectionStatusManager.getStatus.mockImplementation(() => status);

    sut.init();

    expect(sut.connectionStatus).toEqual("initializing");
  });

  test("should throw if init is called multiple times", () => {
    const sut = new TestProxy();
    sut.init();

    expect(() => sut.init()).toThrowError("Proxy already initialized");
  });
});

describe("request", () => {
  const testNamespace = "test-namespace";
  const testCommand = "test-command";
  const testData = { foo: 1 };
  const testOverrideOrigin: UpstreamMessageOrigin = {
    _type: "override-origin",
  };

  describe("when proxy is ready", () => {
    let sut: TestProxy;
    let mockRequestMgr: MockedObject<RequestManager>;

    beforeEach(() => {
      sut = TestProxy.getReadyTestProxy();
      mockRequestMgr = RequestManagerMock.mock.instances[0];
    });

    test("should return handler from request manager with override origin", () => {
      const requestMessage: RequestMessage = {
        type: "request",
      } as RequestMessage;
      const handlerPromise = Promise.resolve();
      mocked(createRequestMessage).mockReturnValueOnce(requestMessage);
      mockRequestMgr.processRequest.mockReturnValueOnce(handlerPromise);

      const result = sut.request(
        testNamespace,
        testCommand,
        testData,
        testOverrideOrigin,
      );

      expect(result).toEqual(handlerPromise);
      expect(createRequestMessage).toHaveBeenCalledWith(
        testNamespace,
        testCommand,
        testData,
        testOverrideOrigin,
      );
      expect(mockRequestMgr.processRequest).toHaveBeenCalledWith(
        requestMessage,
      );
    });

    test("should return handler from request manager with origin from proxy", () => {
      const requestMessage: RequestMessage = {
        type: "request",
      } as RequestMessage;
      const handlerPromise = Promise.resolve();
      mocked(createRequestMessage).mockReturnValueOnce(requestMessage);
      mockRequestMgr.processRequest.mockReturnValueOnce(handlerPromise);

      const result = sut.request(testNamespace, testCommand, testData);

      expect(result).toEqual(handlerPromise);
      expect(createRequestMessage).toHaveBeenCalledWith(
        testNamespace,
        testCommand,
        testData,
        testOrigin, // Default origin from TestProxy
      );
      expect(mockRequestMgr.processRequest).toHaveBeenCalledWith(
        requestMessage,
      );
    });

    test("should send request upstream", () => {
      const requestMessage: RequestMessage = {
        type: "request",
      } as RequestMessage;
      const handlerPromise = Promise.resolve();
      mocked(createRequestMessage).mockReturnValueOnce(requestMessage);
      mockRequestMgr.processRequest.mockReturnValueOnce(handlerPromise);

      void sut.request(testNamespace, testCommand, testData);

      expect(sut.upstreamMessagesSent).toHaveLength(1);
      const [msg] = sut.upstreamMessagesSent;
      expect(msg).toEqual(requestMessage);
      expect(mockRequestMgr.processRequest).toHaveBeenCalledWith(
        requestMessage,
      );
    });
  });

  test("should not send request before proxy connection acknowledged", () => {
    const sut = new TestProxy();
    const [mockRequestMgr] = RequestManagerMock.mock.instances;
    const requestMessage: RequestMessage = {
      type: "request",
    } as RequestMessage;
    const handlerPromise = Promise.resolve();
    mocked(createRequestMessage).mockReturnValueOnce(requestMessage);
    mockRequestMgr.processRequest.mockReturnValueOnce(handlerPromise);
    sut.init();

    void sut.request(testNamespace, testCommand, testData);

    expect(sut.upstreamMessagesSent).toHaveLength(0);
    expect(mockRequestMgr.processRequest).toHaveBeenCalledWith(requestMessage);
  });

  test("should send request after proxy connection acknowledged", () => {
    const sut = new TestProxy();
    const [mockRequestMgr] = RequestManagerMock.mock.instances;
    const requestMessage: RequestMessage = {
      type: "request",
    } as RequestMessage;
    const handlerPromise = Promise.resolve();
    mocked(createRequestMessage).mockReturnValueOnce(requestMessage);
    mockRequestMgr.processRequest.mockReturnValueOnce(handlerPromise);

    void sut.request(testNamespace, testCommand, testData);
    sut.init();
    sut.mockPushAcknowledgeMessage();

    expect(sut.upstreamMessagesSent).toHaveLength(1);
    const [msg] = sut.upstreamMessagesSent;
    expect(msg).toEqual(requestMessage);
    expect(mockRequestMgr.processRequest).toHaveBeenCalledWith(requestMessage);
  });
});

describe("subscribe", () => {
  const handlerId = "foo";
  describe("when proxy is ready", () => {
    let sut: TestProxy;
    let mockSubscriptionMgr: MockedObject<SubscriptionManager>;

    beforeEach(() => {
      sut = TestProxy.getReadyTestProxy();
      mockSubscriptionMgr = SubscriptionManagerMock.mock.instances[0];
    });

    test("should send subscribe message for new subscription", () => {
      const handler: SubscriptionHandler = () => Promise.resolve();
      mockSubscriptionMgr.add.mockReturnValueOnce({ handlerId });

      sut.subscribe(testTopic, handler);

      expect(sut.upstreamMessagesSent).toHaveLength(1);
      const [msg] = sut.upstreamMessagesSent;
      expect(msg.type).toBe("subscribe");
      expect((msg as SubscribeMessage).topic).toEqual({ ...testTopic });
      expect((msg as SubscribeMessage).messageOrigin).toEqual(testOrigin);
      expect((msg as SubscribeMessage).handlerId).toEqual(handlerId);
      expect(mockSubscriptionMgr.add).toHaveBeenCalledWith(testTopic, handler);
    });
  });

  test("should not send subscribe before proxy connection acknowledged", () => {
    const sut = new TestProxy();
    const [mockSubscriptionMgr] = SubscriptionManagerMock.mock.instances;
    const handler: SubscriptionHandler = () => Promise.resolve();
    mockSubscriptionMgr.isEmpty.mockReturnValueOnce(true);
    mockSubscriptionMgr.add.mockReturnValueOnce({ handlerId });

    sut.init();

    sut.subscribe(testTopic, handler);

    expect(sut.upstreamMessagesSent).toHaveLength(0);
    expect(mockSubscriptionMgr.add).toHaveBeenCalledWith(testTopic, handler);
  });

  test("should send subscribe after proxy connection acknowledged", () => {
    const sut = new TestProxy();
    const handler: SubscriptionHandler = () => Promise.resolve();
    const [mockSubscriptionMgr] = SubscriptionManagerMock.mock.instances;
    mockSubscriptionMgr.isEmpty.mockReturnValueOnce(true);
    mockSubscriptionMgr.add.mockReturnValueOnce({ handlerId });

    sut.subscribe(testTopic, handler);
    sut.init();
    sut.mockPushAcknowledgeMessage();

    expect(sut.upstreamMessagesSent).toHaveLength(1);
    const [msg] = sut.upstreamMessagesSent;
    expect(msg.type).toBe("subscribe");
    expect((msg as SubscribeMessage).topic).toEqual(testTopic);
    expect((msg as SubscribeMessage).messageOrigin).toEqual(testOrigin);
    expect((msg as SubscribeMessage).handlerId).toEqual(handlerId);

    expect(mockSubscriptionMgr.add).toHaveBeenCalledWith(testTopic, handler);
  });
});

describe("unsubscribe", () => {
  describe("when proxy is ready", () => {
    let sut: TestProxy;
    let mockSubscriptionSet: MockedObject<SubscriptionManager>;

    beforeEach(() => {
      sut = TestProxy.getReadyTestProxy();
      mockSubscriptionSet = SubscriptionManagerMock.mock.instances[0];
    });

    test("should send unsubscribe message when no subscriptions remain", () => {
      const handler: SubscriptionHandler = () => Promise.resolve();
      mockSubscriptionSet.isEmpty.mockReturnValueOnce(true);

      sut.unsubscribe(testTopic, handler);

      expect(sut.upstreamMessagesSent).toHaveLength(1);
      const [msg] = sut.upstreamMessagesSent;
      expect(msg.type).toBe("unsubscribe");
      expect((msg as UnsubscribeMessage).topic).toEqual(testTopic);
      expect((msg as UnsubscribeMessage).messageOrigin).toEqual(testOrigin);
      expect(mockSubscriptionSet.isEmpty).toHaveBeenCalledWith(testTopic);
      expect(mockSubscriptionSet.delete).toHaveBeenCalledWith(
        testTopic,
        handler,
      );
    });

    test("should not send unsubscribe message when other subscription exists", () => {
      mockSubscriptionSet.isEmpty.mockReturnValueOnce(false);
      const handler: SubscriptionHandler = () => Promise.resolve();

      sut.unsubscribe(testTopic, handler);

      expect(sut.upstreamMessagesSent).toHaveLength(0);
      expect(mockSubscriptionSet.isEmpty).toHaveBeenCalledWith(testTopic);
      expect(mockSubscriptionSet.delete).toHaveBeenCalledWith(
        testTopic,
        handler,
      );
    });
  });

  test("should send unsubscribe after proxy connection acknowledged", () => {
    const sut = new TestProxy();
    const handler: SubscriptionHandler = () => Promise.resolve();
    const [mockSubscriptionSet] = SubscriptionManagerMock.mock.instances;
    mockSubscriptionSet.isEmpty.mockReturnValueOnce(true);

    sut.unsubscribe(testTopic, handler);
    sut.init();
    sut.mockPushAcknowledgeMessage();

    expect(sut.upstreamMessagesSent).toHaveLength(1);
    const [msg] = sut.upstreamMessagesSent;
    expect(msg.type).toBe("unsubscribe");
    expect((msg as UnsubscribeMessage).topic).toEqual(
      expect.objectContaining(testTopic),
    );
    expect(mockSubscriptionSet.isEmpty).toHaveBeenCalledWith(testTopic);
    expect(mockSubscriptionSet.delete).toHaveBeenCalledWith(testTopic, handler);
  });
});

describe("log", () => {
  test("should send a log message", () => {
    const proxyLoggerContext = { foo: "test" };
    const sut = TestProxy.getReadyTestProxy({
      loggerContext: proxyLoggerContext,
    });
    const level = LogLevel.error;
    const source = "test";
    const message = "test message";
    const loggerId = "1234";
    const data = { foo: "test" };

    sut.log({ level, source, message, loggerId, data });

    expect(sut.upstreamMessagesSent).toHaveLength(1);
    const msg = sut.upstreamMessagesSent[0] as LogMessage;
    expect(msg.type).toEqual("log");
    expect(msg.level).toEqual(level);
    expect(msg.time).toBeDefined();
    expect(msg.source).toEqual(source);
    expect(msg.loggerId).toEqual(loggerId);
    expect(msg.data).toEqual(expect.objectContaining(data));
    expect(msg.context).toEqual(expect.objectContaining(proxyLoggerContext));
    expect(msg.messageOrigin).toEqual(testOrigin);
  });
  test("should send a log message with data undefined", () => {
    const proxyLoggerContext = { foo: "test" };
    const sut = TestProxy.getReadyTestProxy({
      loggerContext: proxyLoggerContext,
    });
    const level = LogLevel.error;
    const source = "test";
    const message = "test message";
    const loggerId = "1234";
    const data = undefined;

    sut.log({ level, source, message, loggerId, data });

    expect(sut.upstreamMessagesSent).toHaveLength(1);
    const msg = sut.upstreamMessagesSent[0] as LogMessage;
    expect(msg.type).toEqual("log");
    expect(msg.level).toEqual(level);
    expect(msg.time).toBeDefined();
    expect(msg.source).toEqual(source);
    expect(msg.loggerId).toEqual(loggerId);
    expect(msg.data).toBeUndefined();
    expect(msg.context).toEqual(expect.objectContaining(proxyLoggerContext));
    expect(msg.messageOrigin).toEqual(testOrigin);
  });

  test("should strip out data with a a non-cloneable object attached allowing to pass through message channel", async () => {
    const proxyLoggerContext = { foo: "test" };
    const sut = TestProxy.getReadyTestProxy({
      loggerContext: proxyLoggerContext,
    });
    const level = LogLevel.error;
    const source = "test";
    const message = "test message";
    const loggerId = "1234";
    const initialData = { foo: "test" };
    let messageChannel: MessageChannel | null = null;
    let processedMessage: LogMessage | undefined;

    try {
      messageChannel = new MessageChannel();
      // The data has a port which is a non-cloneable object
      const data = { ...initialData, portTest: messageChannel.port1 };

      // Sends the log event with the non-cloneable field on the data object
      sut.log({ level, source, message, loggerId, data });

      // Gets the message which came out of the proxy
      expect(sut.upstreamMessagesSent).toHaveLength(1);
      const messageFromProxy = sut.upstreamMessagesSent[0] as LogMessage;

      // Pass it through an actual message channel to verify it does not fail
      messageChannel.port2.onmessage = (evt) => {
        processedMessage = evt.data as LogMessage;
      };
      messageChannel.port1.postMessage(messageFromProxy);

      // Message channel is outside of Node Event Loop.
      // Need to wait for it to come out of channel
      while (!processedMessage) {
        await new Promise((resolve) => setTimeout(resolve, 1));
      }
    } finally {
      messageChannel?.port1.close();
    }

    expect(processedMessage.data).toBeDefined();
    expect(processedMessage.data).toEqual(expect.objectContaining(initialData));
    expect(processedMessage.data).toHaveProperty("portTest");
  });
});

describe("sendLogMessage", () => {
  test("should send a log message", () => {
    const level = LogLevel.error;
    const source = "test";
    const time = new Date();
    const message = "test message";
    const loggerId = "1234";
    const data = { foo: "test" };
    const originalContext = { foo: 1, bar: 2 };
    const loggerContext = { bar: 300 };
    const expectedContext = { foo: 1, bar: 300 };
    const sut = TestProxy.getReadyTestProxy({ loggerContext });

    const originalMsg: LogMessage = {
      type: "log",
      level,
      source,
      message,
      loggerId,
      time,
      context: originalContext,
      data,
      messageOrigin: testOrigin,
    };

    sut.sendLogMessage(originalMsg);

    expect(sut.upstreamMessagesSent).toHaveLength(1);
    const msg = sut.upstreamMessagesSent[0] as LogMessage;
    expect(msg.type).toEqual("log");
    expect(msg.level).toEqual(level);
    expect(msg.time).toBeDefined();
    expect(msg.source).toEqual(source);
    expect(msg.loggerId).toEqual(loggerId);
    expect(msg.data).toEqual(expect.objectContaining(data));
    expect(msg.context).toEqual(expect.objectContaining(expectedContext));
    expect(msg.messageOrigin).toEqual(testOrigin);
  });

  test("should throw when message is not of type log", () => {
    const msg: LogMessage = { type: "notLog" } as unknown as LogMessage;
    const sut = TestProxy.getReadyTestProxy();
    const [logger] = LoggerMock.mock.instances;

    sut.sendLogMessage(msg);

    expect(sut.upstreamMessagesSent).toHaveLength(0);
    expect(logger.error).toHaveBeenCalled();
    const errorData = logger.error.mock.calls[0][1] as { message: any };
    expect(errorData?.message).toEqual(expect.objectContaining(msg));
  });
});

describe("acknowledge", () => {
  test("should be ready after acknowledge is received", () => {
    const sut = new TestProxy();
    const [proxyConnectionStatusManager] =
      ProxyConnectionStatusManagerMock.mock.instances;
    const statusHistory: ProxyConnectionStatus[] = [];
    proxyConnectionStatusManager.update.mockImplementation((evt) =>
      statusHistory.push(evt.status),
    );
    proxyConnectionStatusManager.getStatus.mockImplementation(
      () => statusHistory[statusHistory.length - 1],
    );

    sut.init();
    sut.mockPushAcknowledgeMessage();

    expect(sut.connectionStatus).toEqual("ready");
    expect(statusHistory).toHaveLength(2);
    expect(statusHistory[0]).toEqual("initializing");
    expect(statusHistory[1]).toEqual("ready");
  });

  test("should throw if acknowledge comes before init is called", () => {
    const sut = new TestProxy();
    const [proxyConnectionStatusManager] =
      ProxyConnectionStatusManagerMock.mock.instances;
    const [logger] = LoggerMock.mock.instances;

    sut.mockPushAcknowledgeMessage();
    expect(proxyConnectionStatusManager.update).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalled();
  });
});

describe("response", () => {
  test("should send response to request manager", () => {
    const sut = TestProxy.getReadyTestProxy();
    const [mockRequestMgr] = RequestManagerMock.mock.instances;
    const responseMessage: ResponseMessage = {
      type: "response",
    } as ResponseMessage;

    sut.mockPushMessage(responseMessage);

    expect(mockRequestMgr.processResponse).toHaveBeenCalledWith(
      responseMessage,
    );
  });
});

describe("publish", () => {
  let sut: TestProxy;
  let mockSubscriptionMgr: MockedObject<SubscriptionManager>;
  const testData = { foo: "bar" };

  beforeEach(() => {
    sut = TestProxy.getReadyTestProxy();
    mockSubscriptionMgr = SubscriptionManagerMock.mock.instances[0];
  });

  describe("when doing a regular publish (with no handler id set)", () => {
    test("should invoke with one subscription", () => {
      const mockHandler = jest.fn();
      const handlerId = "handler_1";
      mockHandler.mockResolvedValue(null);
      mockSubscriptionMgr.get.mockReturnValueOnce([
        { handler: mockHandler, handlerId },
      ]);

      sut.mockPublish(testTopic, testData);

      expect(mockSubscriptionMgr.get).toHaveBeenCalledWith(testTopic);
      expect(mockHandler).toHaveBeenCalledWith(testData);
    });

    test("should invoke with two subscriptions", () => {
      const mockHandler1 = jest.fn();
      const handlerId1 = "handler_1";
      mockHandler1.mockResolvedValue(null);
      const mockHandler2 = jest.fn();
      const handlerId2 = "handler_2";
      mockHandler2.mockResolvedValue(null);
      mockSubscriptionMgr.get.mockReturnValueOnce([
        { handler: mockHandler1, handlerId: handlerId1 },
        { handler: mockHandler2, handlerId: handlerId2 },
      ]);

      sut.mockPublish(testTopic, testData);

      expect(mockSubscriptionMgr.get).toHaveBeenCalledWith(testTopic);
      expect(mockHandler1).toHaveBeenCalledWith(testData);
      expect(mockHandler2).toHaveBeenCalledWith(testData);
    });

    test("should do nothing when no subscriptions", () => {
      mockSubscriptionMgr.get.mockReturnValueOnce([]);

      sut.mockPublish(testTopic, testData);

      expect(mockSubscriptionMgr.get).toHaveBeenCalledWith(testTopic);
    });

    test("should catch and log when handler throws error", async () => {
      const mockHandler = jest.fn();
      const handlerId = "handler_1";
      mockHandler.mockImplementation(() => Promise.reject("test error"));
      mockSubscriptionMgr.get.mockReturnValueOnce([
        { handler: mockHandler, handlerId },
      ]);
      const [logger] = LoggerMock.mock.instances;

      sut.mockPublish(testTopic, testData);

      expect(mockSubscriptionMgr.get).toHaveBeenCalledWith(testTopic);
      expect(mockHandler).toHaveBeenCalledWith(testData);

      // This code is testing an error wrapper on a fire and forget
      // promise being invoked. There is go way to await this directly
      // so this loop will wait to the condition is met (or the test
      // would fail because of a timeout if it was never to be met)
      while (logger.error.mock.calls.length === 0) {
        await new Promise(process.nextTick);
      }

      expect(logger.error).toHaveBeenCalled();
      const errorData = logger.error.mock.calls[0][1] as {
        topic: any;
        error: any;
        handlerId: SubscriptionHandlerId;
      };
      expect(errorData.topic).toEqual(testTopic);
      expect(errorData.error).toEqual("test error");
      expect(errorData.handlerId).toEqual(handlerId);
    });
  });

  describe("when publishing to a specific handler (with handler id set)", () => {
    const handlerId = "handler_1";

    test("should invoke with existing subscription", () => {
      const mockHandler = jest.fn();
      mockHandler.mockResolvedValue(null);
      mockSubscriptionMgr.getById.mockReturnValueOnce(mockHandler);

      sut.mockPublish(testTopic, testData, handlerId);

      expect(mockSubscriptionMgr.getById).toHaveBeenCalledWith(
        testTopic,
        handlerId,
      );
      expect(mockHandler).toHaveBeenCalledWith(testData);
    });

    test("should do nothing unknown handler id", () => {
      mockSubscriptionMgr.getById.mockReturnValueOnce(null);

      sut.mockPublish(testTopic, testData, handlerId);

      expect(mockSubscriptionMgr.getById).toHaveBeenCalledWith(
        testTopic,
        handlerId,
      );
    });

    test("should catch and log when handler throws error", async () => {
      const mockHandler = jest.fn();
      mockHandler.mockImplementation(() => Promise.reject("test error"));
      mockSubscriptionMgr.getById.mockReturnValueOnce(mockHandler);

      const [logger] = LoggerMock.mock.instances;

      sut.mockPublish(testTopic, testData, handlerId);

      expect(mockSubscriptionMgr.getById).toHaveBeenCalledWith(
        testTopic,
        handlerId,
      );
      expect(mockHandler).toHaveBeenCalledWith(testData);

      // This code is testing an error wrapper on a fire and forget
      // promise being invoked. There is go way to await this directly
      // so this loop will wait to the condition is met (or the test
      // would fail because of a timeout if it was never to be met)
      while (logger.error.mock.calls.length === 0) {
        await new Promise(process.nextTick);
      }

      expect(logger.error).toHaveBeenCalled();
      const errorData = logger.error.mock.calls[0][1] as {
        topic: any;
        error: any;
        handlerId: SubscriptionHandlerId;
      };
      expect(errorData.topic).toEqual(testTopic);
      expect(errorData.error).toEqual("test error");
      expect(errorData.handlerId).toEqual(handlerId);
    });
  });
});

describe("error from upstream", () => {
  test("should call invoke error service with upstream error when connection is healthy", () => {
    const sut = TestProxy.getReadyTestProxy();
    const errorMsg: ErrorMessage = {
      type: "error",
      message: "Test Error Message",
      key: "TestError",
      status: { initialized: true, startTime: new Date() },
      isFatal: true,
      details: { foo: 1 },
    };
    const [errorService] = ErrorServiceMock.mock.instances;

    sut.mockPushMessage(errorMsg);

    expect(errorService.invoke).toHaveBeenCalled();
    const [upstreamError] = errorService.invoke.mock.calls[0];

    expect(upstreamError.message).toEqual(errorMsg.message);
    expect(upstreamError.key).toEqual(errorMsg.key);
    expect(upstreamError.isFatal).toEqual(errorMsg.isFatal);
    expect(upstreamError.details).toEqual(
      expect.objectContaining(errorMsg.details),
    );
    expect(upstreamError.proxyStatus).toEqual(errorMsg.status);
  });

  test("should call invoke error service with upstream error when connection has failed", () => {
    const sut = TestProxy.getReadyTestProxy();
    const errorMsg: ErrorMessage = {
      type: "error",
      message: "Test Error Message",
      key: "TestError",
      status: { initialized: true, startTime: new Date() },
      isFatal: false,
      details: { foo: 1 },
    };
    const [errorService] = ErrorServiceMock.mock.instances;

    sut.mockPushMessage(errorMsg);

    expect(errorService.invoke).toHaveBeenCalled();
    const [upstreamError] = errorService.invoke.mock.calls[0];

    expect(upstreamError.message).toEqual(errorMsg.message);
    expect(upstreamError.key).toEqual(errorMsg.key);
    expect(upstreamError.isFatal).toEqual(errorMsg.isFatal);
    expect(upstreamError.details).toEqual(
      expect.objectContaining(errorMsg.details),
    );
    expect(upstreamError.proxyStatus).toEqual(errorMsg.status);
  });
});

describe("proxyType", () => {
  test("should return the value defined in the proxy implementation", () => {
    const sut = new TestProxy();

    expect(sut.proxyType).toEqual("test");
  });
});

describe("downstream messages", () => {
  test("should not accept downstream message prior to init being called", () => {
    const sut = new TestProxy();
    const [logger] = LoggerMock.mock.instances;

    sut.mockPushMessage({ type: "test" });

    expect(logger.error).toHaveBeenCalled();
    const errorData = logger.error.mock.calls[0][1] as any;
    expect(errorData?.originalMessageEventData?.type).toEqual("test");
  });

  test("should warn and not process a message without a type argument", () => {
    const sut = TestProxy.getReadyTestProxy();
    const [logger] = LoggerMock.mock.instances;
    const invalidMessage = { foo: "test" } as unknown as DownstreamMessage;

    sut.mockPushMessage(invalidMessage);

    expect(logger.warn).toHaveBeenCalled();
    const warnData = logger.warn.mock.calls[0][1] as any;
    expect(warnData?.originalMessageEventData).toEqual(invalidMessage);
  });

  test("should error and not process unknown message type", () => {
    const sut = TestProxy.getReadyTestProxy();
    const [logger] = LoggerMock.mock.instances;
    const invalidMessage = { type: "unknown" };

    sut.mockPushMessage(invalidMessage);

    expect(logger.error).toHaveBeenCalled();
    const errorData = logger.error.mock.calls[0][1] as any;
    expect(errorData?.originalMessageEventData).toEqual(invalidMessage);
  });
});

describe("Error Handlers", () => {
  test("should add handler to error service", () => {
    const sut = new TestProxy();
    const handler: AmazonConnectErrorHandler = jest.fn();
    const [errorService] = ErrorServiceMock.mock.instances;

    sut.onError(handler);

    expect(errorService.onError).toHaveBeenCalledWith(handler);
  });

  test("should remove handler to error service", () => {
    const sut = new TestProxy();
    const handler: AmazonConnectErrorHandler = jest.fn();
    const [errorService] = ErrorServiceMock.mock.instances;

    sut.offError(handler);

    expect(errorService.offError).toHaveBeenCalledWith(handler);
  });
});

describe("Connection Status Change Handlers", () => {
  test("should add handler", () => {
    const sut = new TestProxy();
    const handler: ProxyConnectionChangedHandler = jest.fn();
    const [proxyConnectionStatusManager] =
      ProxyConnectionStatusManagerMock.mock.instances;

    sut.onConnectionStatusChange(handler);

    expect(proxyConnectionStatusManager.onChange).toHaveBeenCalledWith(handler);
  });

  test("should remove handler", () => {
    const sut = new TestProxy();
    const handler: ProxyConnectionChangedHandler = jest.fn();
    const [proxyConnectionStatusManager] =
      ProxyConnectionStatusManagerMock.mock.instances;

    sut.offConnectionStatusChange(handler);

    expect(proxyConnectionStatusManager.offChange).toHaveBeenCalledWith(
      handler,
    );
  });
});
