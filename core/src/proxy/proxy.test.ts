/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { MockedClass, MockedObject } from "jest-mock";

import { AmazonConnectErrorHandler } from "../amazon-connect-error";
import { LogLevel } from "../logging";
import { ConnectLogger } from "../logging/connect-logger";
import {
  AcknowledgeMessage,
  DownstreamMessage,
  ErrorMessage,
  LogMessage,
  PublishMessage,
  SubscribeMessage,
  UnsubscribeMessage,
  UpstreamMessage,
} from "../messaging";
import {
  SubscriptionHandler,
  SubscriptionHandlerData,
  SubscriptionSet,
  SubscriptionTopic,
} from "../messaging/subscription";
import { AmazonConnectProvider } from "../provider";
import { ErrorService } from "./error";
import { Proxy } from "./proxy";
import {
  ProxyConnectionChangedHandler,
  ProxyConnectionStatus,
  ProxyConnectionStatusManager,
} from "./proxy-connection";

jest.mock("../logging/connect-logger");
jest.mock("../messaging/subscription/subscription-set");
jest.mock("./error/error-service");
jest.mock("./proxy-connection/proxy-connection-status-manager");

const LoggerMock = ConnectLogger as MockedClass<typeof ConnectLogger>;
const SubscriptionSetMock = SubscriptionSet as MockedClass<
  typeof SubscriptionSet<SubscriptionHandler>
>;
const ErrorServiceMock = ErrorService as MockedClass<typeof ErrorService>;
const ProxyConnectionStatusManagerMock =
  ProxyConnectionStatusManager as MockedClass<
    typeof ProxyConnectionStatusManager
  >;

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

  public mockPushAcknowledgeMessage() {
    const ackMsg: AcknowledgeMessage = {
      type: "acknowledge",
      status: { startTime: new Date(), initialized: true },
    };

    this.mockPushMessage(ackMsg);
  }

  public mockPublish(topic: SubscriptionTopic, data: SubscriptionHandlerData) {
    const pubMsg: PublishMessage = {
      type: "publish",
      topic,
      data,
    };

    this.mockPushMessage(pubMsg);
  }

  public mockPushMessage(msg: DownstreamMessage | { type: string }) {
    const messageEvent: MessageEvent<any> = {
      data: msg,
    } as MessageEvent<any>;

    this.consumerMessageHandler(messageEvent);
  }

  static getReadyTestProxy(loggerContext?: Record<string, unknown>): TestProxy {
    const proxy = new TestProxy(loggerContext);
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
});

describe("subscribe", () => {
  describe("when proxy is ready", () => {
    let sut: TestProxy;
    let mockSubscriptionSet: MockedObject<SubscriptionSet<SubscriptionHandler>>;

    beforeEach(() => {
      sut = TestProxy.getReadyTestProxy();
      mockSubscriptionSet = SubscriptionSetMock.mock.instances[0];
    });

    test("should send subscribe message for new subscription", () => {
      const handler: SubscriptionHandler = () => Promise.resolve();

      sut.subscribe(testTopic, handler);

      expect(sut.upstreamMessagesSent).toHaveLength(1);
      const [msg] = sut.upstreamMessagesSent;
      expect(msg.type).toBe("subscribe");
      expect((msg as SubscribeMessage).topic).toEqual(
        expect.objectContaining(testTopic),
      );
      expect(mockSubscriptionSet.add).toHaveBeenCalledWith(testTopic, handler);
    });
  });

  test("should not send subscribe before proxy connection acknowledged", () => {
    const sut = new TestProxy();
    const [mockSubscriptionSet] = SubscriptionSetMock.mock.instances;
    const handler: SubscriptionHandler = () => Promise.resolve();
    mockSubscriptionSet.isEmpty.mockReturnValueOnce(true);

    sut.init();

    sut.subscribe(testTopic, handler);

    expect(sut.upstreamMessagesSent).toHaveLength(0);
    expect(mockSubscriptionSet.add).toHaveBeenCalledWith(testTopic, handler);
  });

  test("should send subscribe after proxy connection acknowledged", () => {
    const sut = new TestProxy();
    const handler: SubscriptionHandler = () => Promise.resolve();
    const [mockSubscriptionSet] = SubscriptionSetMock.mock.instances;
    mockSubscriptionSet.isEmpty.mockReturnValueOnce(true);

    sut.subscribe(testTopic, handler);
    sut.init();
    sut.mockPushAcknowledgeMessage();

    expect(sut.upstreamMessagesSent).toHaveLength(1);
    const [msg] = sut.upstreamMessagesSent;
    expect(msg.type).toBe("subscribe");
    expect((msg as SubscribeMessage).topic).toEqual(
      expect.objectContaining(testTopic),
    );
    expect(mockSubscriptionSet.add).toHaveBeenCalledWith(testTopic, handler);
  });
});

describe("unsubscribe", () => {
  describe("when proxy is ready", () => {
    let sut: TestProxy;
    let mockSubscriptionSet: MockedObject<SubscriptionSet<SubscriptionHandler>>;

    beforeEach(() => {
      sut = TestProxy.getReadyTestProxy();
      mockSubscriptionSet = SubscriptionSetMock.mock.instances[0];
    });

    test("should send unsubscribe message when no subscriptions remain", () => {
      const handler: SubscriptionHandler = () => Promise.resolve();
      mockSubscriptionSet.isEmpty.mockReturnValueOnce(true);

      sut.unsubscribe(testTopic, handler);

      expect(sut.upstreamMessagesSent).toHaveLength(1);
      const [msg] = sut.upstreamMessagesSent;
      expect(msg.type).toBe("unsubscribe");
      expect((msg as UnsubscribeMessage).topic).toEqual(
        expect.objectContaining(testTopic),
      );
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
    const [mockSubscriptionSet] = SubscriptionSetMock.mock.instances;
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
    const sut = TestProxy.getReadyTestProxy(proxyLoggerContext);
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
  });
  test("should send a log message with data undefined", () => {
    const proxyLoggerContext = { foo: "test" };
    const sut = TestProxy.getReadyTestProxy(proxyLoggerContext);
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
  });

  test("should strip out data with a a non-cloneable object attached allowing to pass through message channel", async () => {
    const proxyLoggerContext = { foo: "test" };
    const sut = TestProxy.getReadyTestProxy(proxyLoggerContext);
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
    const sut = TestProxy.getReadyTestProxy(loggerContext);

    const originalMsg: LogMessage = {
      type: "log",
      level,
      source,
      message,
      loggerId,
      time,
      context: originalContext,
      data,
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

describe("publish", () => {
  let sut: TestProxy;
  let mockSubscriptionSet: MockedObject<SubscriptionSet<SubscriptionHandler>>;
  const testData = { foo: "bar" };

  beforeEach(() => {
    sut = TestProxy.getReadyTestProxy();
    mockSubscriptionSet = SubscriptionSetMock.mock.instances[0];
  });

  test("should invoke with one subscription", () => {
    const mockHandler = jest.fn();
    mockHandler.mockResolvedValue(null);
    mockSubscriptionSet.get.mockReturnValueOnce([mockHandler]);

    sut.mockPublish(testTopic, testData);

    expect(mockSubscriptionSet.get).toHaveBeenCalledWith(testTopic);
    expect(mockHandler).toHaveBeenCalledWith(testData);
  });

  test("should invoke with two subscriptions", () => {
    const mockHandler1 = jest.fn();
    mockHandler1.mockResolvedValue(null);
    const mockHandler2 = jest.fn();
    mockHandler2.mockResolvedValue(null);
    mockSubscriptionSet.get.mockReturnValueOnce([mockHandler1, mockHandler2]);

    sut.mockPublish(testTopic, testData);

    expect(mockSubscriptionSet.get).toHaveBeenCalledWith(testTopic);
    expect(mockHandler1).toHaveBeenCalledWith(testData);
    expect(mockHandler2).toHaveBeenCalledWith(testData);
  });

  test("should do nothing when no subscriptions", () => {
    mockSubscriptionSet.get.mockReturnValueOnce([]);

    sut.mockPublish(testTopic, testData);

    expect(mockSubscriptionSet.get).toHaveBeenCalledWith(testTopic);
  });

  test("should catch and log when handler throws error", async () => {
    const mockHandler = jest.fn();
    mockHandler.mockImplementation(() => Promise.reject("test error"));
    mockSubscriptionSet.get.mockReturnValueOnce([mockHandler]);
    const [logger] = LoggerMock.mock.instances;

    sut.mockPublish(testTopic, testData);

    expect(mockSubscriptionSet.get).toHaveBeenCalledWith(testTopic);
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
    };
    expect(errorData?.topic).toEqual(testTopic);
    expect(errorData?.error).toEqual("test error");
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
