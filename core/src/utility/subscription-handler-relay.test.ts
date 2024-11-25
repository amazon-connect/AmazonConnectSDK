/* eslint-disable @typescript-eslint/unbound-method */
import { MockedClass } from "jest-mock";
import { mock } from "jest-mock-extended";

import { ConnectLogger, LogLevel } from "../logging";
import { SubscriptionHandler } from "../messaging/subscription";
import { AmazonConnectProvider } from "../provider";
import { Proxy } from "../proxy";
import { SubscriptionHandlerRelay } from "./subscription-handler-relay";

jest.mock("../logging/connect-logger");

const LoggerMock = ConnectLogger as MockedClass<typeof ConnectLogger>;

type InternalEvent = { foo: string };
type ExternalEvent = { bar: string };
type InternalEventHandler = SubscriptionHandler<InternalEvent>;
type ExternalEventHandler = SubscriptionHandler<ExternalEvent>;

const testNamespace = "test-namespace";
const testTopicKey = "test-topic-key";
const internalEvent1: InternalEvent = { foo: "1" };
const externalEvent1: ExternalEvent = { bar: "1" };

const proxyMock = mock<Proxy>();
const providerMock = mock<AmazonConnectProvider>({
  getProxy: () => proxyMock,
});

class TestSubscriptionHandlerRelay extends SubscriptionHandlerRelay<
  InternalEventHandler,
  ExternalEventHandler,
  InternalEvent,
  ExternalEvent
> {
  protected namespace: string = testNamespace;
  protected topicKey: string = testTopicKey;

  private readonly translateAction: (
    evt: InternalEvent,
  ) => Promise<ExternalEvent>;
  private readonly _supportParameter?: boolean;
  private readonly _skipRelay: ((evt: InternalEvent) => boolean) | undefined;
  private handlers: Map<string | undefined, Set<InternalEventHandler>>;

  constructor(params?: {
    translate?: (evt: InternalEvent) => Promise<ExternalEvent>;
    supportParameter?: boolean;
    skipRelay?: (evt: InternalEvent) => boolean;
  }) {
    super(providerMock);

    this.translateAction =
      params?.translate ?? (({ foo }) => Promise.resolve({ bar: foo }));
    this._supportParameter = params?.supportParameter;
    this._skipRelay = params?.skipRelay;
    this.handlers = new Map();

    proxyMock.subscribe.mockImplementation(({ parameter }, evt) => {
      const event = evt as unknown as InternalEventHandler;
      if (!this.handlers.get(parameter)?.add(evt))
        this.handlers.set(parameter, new Set([event]));
    });
    proxyMock.unsubscribe.mockImplementation(({ parameter }, evt) => {
      this.handlers
        .get(parameter)
        ?.delete(evt as unknown as InternalEventHandler);
    });
  }

  protected translate(internalEvent: InternalEvent): Promise<ExternalEvent> {
    return this.translateAction(internalEvent);
  }

  protected get supportsParameter(): boolean {
    return this._supportParameter ?? super.supportsParameter;
  }

  protected skipRelay(event: InternalEvent): boolean {
    return this._skipRelay ? this._skipRelay(event) : super.skipRelay(event);
  }

  async invokeAllHandlers(
    evt: InternalEvent,
    parameter?: string,
  ): Promise<void> {
    const handlers = [...(this.handlers.get(parameter) ?? [])];
    await Promise.allSettled(handlers.map((a) => a(evt)));
  }
}

beforeEach(jest.clearAllMocks);

describe("constructor", () => {
  test("should create logger with mixin", () => {
    // const loggerMock = LoggerMock.mock.instances[0];
    new TestSubscriptionHandlerRelay({ translate: jest.fn() });

    const loggerConfig = LoggerMock.mock.calls[0][0];
    if (typeof loggerConfig === "string") throw Error("ts needs this");
    const mixin = loggerConfig.mixin!;

    const result = mixin({}, LogLevel.info);

    expect(result.namespace).toEqual(testNamespace);
    expect(result.topicKey).toEqual(testTopicKey);
  });
});

describe("when a handler is added without a parameter", () => {
  test("should trigger handler with external event", async () => {
    const sut = new TestSubscriptionHandlerRelay();
    const handler = jest.fn();

    sut.on(handler);

    await sut.invokeAllHandlers(internalEvent1);

    expect(handler).toBeCalledTimes(1);
    expect(handler).toBeCalledWith(externalEvent1);
  });

  describe("when a handler is removed", () => {
    test("should not trigger the handler after being removed", async () => {
      const sut = new TestSubscriptionHandlerRelay();
      const handler1 = jest.fn();
      const handler2 = jest.fn();

      sut.on(handler1);
      sut.on(handler2);
      sut.off(handler1);

      await sut.invokeAllHandlers(internalEvent1);

      expect(handler1).toBeCalledTimes(0);
      expect(handler2).toBeCalledTimes(1);
    });

    test("should remove subscription of the inner handler", () => {
      const sut = new TestSubscriptionHandlerRelay();
      const handler1 = jest.fn();
      const handler2 = jest.fn();
      sut.on(handler1);
      sut.on(handler2);
      const [innerHandler1, innerHandler2] = proxyMock.subscribe.mock.calls.map(
        (a) => a[1],
      );

      sut.off(handler1);

      expect(proxyMock.unsubscribe).toBeCalledTimes(1);
      expect(proxyMock.unsubscribe).toBeCalledWith(
        { namespace: testNamespace, key: testTopicKey, parameter: undefined },
        innerHandler1,
      );
      expect(proxyMock.unsubscribe).not.toBeCalledWith(
        expect.any(Object),
        innerHandler2,
      );
    });
  });

  describe("when an unknown handler is removed", () => {
    test("should not impact the applied handler", async () => {
      const sut = new TestSubscriptionHandlerRelay();
      const handler1 = jest.fn();
      const unknownHandler = jest.fn();

      sut.on(handler1);
      sut.off(unknownHandler);

      await sut.invokeAllHandlers(internalEvent1);

      expect(handler1).toBeCalledTimes(1);
      expect(unknownHandler).toBeCalledTimes(0);
    });

    test("should not trigger an unsubscribe on proxy", () => {
      const sut = new TestSubscriptionHandlerRelay();
      const handler1 = jest.fn();
      const unknownHandler = jest.fn();

      sut.on(handler1);
      sut.off(unknownHandler);

      expect(proxyMock.unsubscribe).toBeCalledTimes(0);
    });
  });

  describe("when using the skipRelay", () => {
    test("should trigger the handler when not to be skipped", async () => {
      const skipFn = jest.fn().mockReturnValueOnce(false);
      const sut = new TestSubscriptionHandlerRelay({ skipRelay: skipFn });
      const handler = jest.fn();

      sut.on(handler);

      await sut.invokeAllHandlers(internalEvent1);

      expect(handler).toBeCalledTimes(1);
      expect(handler).toBeCalledWith(externalEvent1);
      expect(skipFn).toBeCalledWith(internalEvent1);
    });

    test("should not trigger the handler when it is to be skipped", async () => {
      const skipFn = jest.fn().mockReturnValueOnce(true);
      const sut = new TestSubscriptionHandlerRelay({ skipRelay: skipFn });
      const handler = jest.fn();

      sut.on(handler);

      await sut.invokeAllHandlers(internalEvent1);

      expect(handler).toBeCalledTimes(0);
      expect(skipFn).toBeCalledWith(internalEvent1);
    });
  });
});

describe("when the same handler is added more than one time", () => {
  test("should only be subscribed to once", () => {
    const sut = new TestSubscriptionHandlerRelay();
    const handler = jest.fn();
    sut.on(handler);
    sut.on(handler);

    expect(proxyMock.subscribe).toBeCalledTimes(1);
  });

  test("should only be invoked once", async () => {
    const sut = new TestSubscriptionHandlerRelay();
    const handler1 = jest.fn();
    const handler2 = jest.fn();
    sut.on(handler1);
    sut.on(handler2);
    sut.on(handler1);
    sut.on(handler2);

    await sut.invokeAllHandlers(internalEvent1);

    expect(handler1).toBeCalledTimes(1);
    expect(handler2).toBeCalledTimes(1);
  });
});

describe("when a relay is destroyed", () => {
  test("should unsubscribe from events", () => {
    const sut = new TestSubscriptionHandlerRelay();
    const handler1 = jest.fn();
    const handler2 = jest.fn();
    sut.on(handler1);
    sut.on(handler2);
    const [innerHandler1, innerHandler2] = proxyMock.subscribe.mock.calls.map(
      (a) => a[1],
    );

    sut.destroy();

    expect(proxyMock.unsubscribe).toBeCalledTimes(2);
    expect(proxyMock.unsubscribe).toBeCalledWith(
      { namespace: testNamespace, key: testTopicKey, parameter: undefined },
      innerHandler1,
    );
    expect(proxyMock.unsubscribe).toBeCalledWith(
      { namespace: testNamespace, key: testTopicKey, parameter: undefined },
      innerHandler2,
    );
  });
});

describe("when a relay is configured to not allow parameters", () => {
  test("should support adding handler without a parameter", async () => {
    const sut = new TestSubscriptionHandlerRelay({ supportParameter: false });
    const handler = jest.fn();

    sut.on(handler);

    await sut.invokeAllHandlers(internalEvent1);

    expect(handler).toBeCalledTimes(1);
    expect(handler).toBeCalledWith(externalEvent1);
  });

  test("should support removing handler without a parameter", async () => {
    const sut = new TestSubscriptionHandlerRelay({ supportParameter: false });
    const handler = jest.fn();

    sut.on(handler);
    sut.off(handler);

    await sut.invokeAllHandlers(internalEvent1);

    expect(handler).toBeCalledTimes(0);
  });

  test("should throw when attempting to add a handler with a parameter", () => {
    const sut = new TestSubscriptionHandlerRelay({ supportParameter: false });
    const handler = jest.fn();

    try {
      sut.on(handler, "test-parameter");
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
    }

    expect.hasAssertions();
  });

  test("should throw when attempting to remove a handler with a parameter", () => {
    const sut = new TestSubscriptionHandlerRelay({ supportParameter: false });
    const handler = jest.fn();

    try {
      sut.off(handler, "test-parameter");
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
    }

    expect.hasAssertions();
  });
});

describe("when a relay is configured to allow parameters", () => {
  test("should not trigger the handler for a different parameter", async () => {
    // Default supports parameters
    const sut = new TestSubscriptionHandlerRelay();
    const handler1 = jest.fn();
    const handler2 = jest.fn();

    sut.on(handler1, "a");
    sut.on(handler2, "b");

    await sut.invokeAllHandlers(internalEvent1, "a");

    expect(handler1).toBeCalledTimes(1);
    expect(handler2).toBeCalledTimes(0);
  });

  test("should not implicitly trigger the handler for a undefined parameter when called with parameter", async () => {
    const sut = new TestSubscriptionHandlerRelay({ supportParameter: true });
    const handler1 = jest.fn();
    const handler2 = jest.fn();

    sut.on(handler1, "a");
    sut.on(handler2);

    await sut.invokeAllHandlers(internalEvent1, "a");

    expect(handler1).toBeCalledTimes(1);
    expect(handler2).toBeCalledTimes(0);
  });

  test("should not implicitly trigger the handler for a parameter when called with undefined", async () => {
    const sut = new TestSubscriptionHandlerRelay({ supportParameter: true });
    const handler1 = jest.fn();
    const handler2 = jest.fn();

    sut.on(handler1);
    sut.on(handler2, "a");

    await sut.invokeAllHandlers(internalEvent1);

    expect(handler1).toBeCalledTimes(1);
    expect(handler2).toBeCalledTimes(0);
  });

  test("should only remove handler with parameter and not same handler for a different parameter", async () => {
    const sut = new TestSubscriptionHandlerRelay({ supportParameter: true });
    const handler1 = jest.fn();

    sut.on(handler1, "a");
    sut.on(handler1, "b");
    sut.off(handler1, "b");

    await sut.invokeAllHandlers(internalEvent1, "a");
    await sut.invokeAllHandlers(internalEvent1, "b");

    expect(handler1).toBeCalledTimes(1);
  });

  test("should only remove handler with no parameter and not a handler for a parameter", async () => {
    const sut = new TestSubscriptionHandlerRelay({ supportParameter: true });
    const handler1 = jest.fn();

    sut.on(handler1, "a");
    sut.on(handler1);
    sut.off(handler1);

    await sut.invokeAllHandlers(internalEvent1, "a");
    await sut.invokeAllHandlers(internalEvent1);

    expect(handler1).toBeCalledTimes(1);
  });

  test("should only remove handler with parameter and not handler with no parameter", async () => {
    const sut = new TestSubscriptionHandlerRelay({ supportParameter: true });
    const handler1 = jest.fn();

    sut.on(handler1);
    sut.on(handler1, "a");
    sut.off(handler1, "a");

    await sut.invokeAllHandlers(internalEvent1);
    await sut.invokeAllHandlers(internalEvent1, "a");

    expect(handler1).toBeCalledTimes(1);
  });

  test("should be able to remove and readd handler", async () => {
    const sut = new TestSubscriptionHandlerRelay({ supportParameter: true });
    const handler1 = jest.fn();

    sut.on(handler1, "a");
    sut.on(handler1, "a");
    sut.off(handler1, "a");
    sut.on(handler1, "a");
    sut.off(handler1, "a");
    sut.off(handler1, "a");
    sut.on(handler1, "a");

    await sut.invokeAllHandlers(internalEvent1, "a");

    expect(handler1).toBeCalledTimes(1);
  });

  test("should not remove one handler for parameter when a different handler with parameter is removed", async () => {
    const sut = new TestSubscriptionHandlerRelay({ supportParameter: true });
    const handler1 = jest.fn();
    const handler2 = jest.fn();

    sut.on(handler1, "a");
    sut.on(handler2, "a");
    sut.off(handler2, "a");

    await sut.invokeAllHandlers(internalEvent1, "a");

    expect(handler1).toBeCalledTimes(1);
    expect(handler2).toBeCalledTimes(0);
  });

  describe("when the translate errors", () => {
    test("should log error for single translate error", async () => {
      const error = new Error("test-error");
      const translate = jest
        .fn()
        .mockResolvedValueOnce({ bar: "1" })
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce({ bar: "1" });
      let invokeCount = 0;
      const handlerAction = () => {
        invokeCount++;
        return Promise.resolve();
      };

      const handler1 = jest.fn().mockImplementationOnce(handlerAction);
      const handler2 = jest.fn().mockImplementationOnce(handlerAction);
      const handler3 = jest.fn().mockImplementationOnce(handlerAction);

      const sut = new TestSubscriptionHandlerRelay({ translate });
      const [loggerMock] = LoggerMock.mock.instances;

      sut.on(handler1, "a");
      sut.on(handler2, "a");
      sut.on(handler3, "a");

      await sut.invokeAllHandlers(internalEvent1, "a");

      expect(invokeCount).toEqual(2);
      expect(loggerMock.error).toBeCalledTimes(1);
      expect(loggerMock.error).toBeCalledWith(expect.any(String), {
        error,
        parameter: "a",
      });
    });
  });

  test("should log error for multiple translate error", async () => {
    const error1 = new Error("test-error - 1");
    const error2 = new Error("test-error - 2");
    const error3 = new Error("test-error - 3");
    const translate = jest
      .fn()
      .mockRejectedValueOnce(error1)
      .mockImplementationOnce(() => {
        throw error2;
      })
      .mockRejectedValueOnce(error3);

    const handler1 = jest.fn();
    const handler2 = jest.fn();
    const handler3 = jest.fn();

    const sut = new TestSubscriptionHandlerRelay({ translate });
    const [loggerMock] = LoggerMock.mock.instances;

    sut.on(handler1, "a");
    sut.on(handler2, "a");
    sut.on(handler3, "a");

    await sut.invokeAllHandlers(internalEvent1, "a");

    expect(handler1).not.toBeCalled();
    expect(handler2).not.toBeCalled();
    expect(handler3).not.toBeCalled();
    expect(loggerMock.error).toBeCalledTimes(3);
    expect(loggerMock.error).toBeCalledWith(expect.any(String), {
      error: error1,
      parameter: "a",
    });
    expect(loggerMock.error).toBeCalledWith(expect.any(String), {
      error: error2,
      parameter: "a",
    });
    expect(loggerMock.error).toBeCalledWith(expect.any(String), {
      error: error3,
      parameter: "a",
    });
  });

  describe("when a handler rejects", () => {
    test("should log an error and allow other handles to work", async () => {
      const error = new Error("test-error");
      const handler1 = jest.fn();
      const handler2 = jest.fn().mockRejectedValueOnce(error);
      const handler3 = jest.fn();
      const sut = new TestSubscriptionHandlerRelay();
      const [loggerMock] = LoggerMock.mock.instances;
      sut.on(handler1, "a");
      sut.on(handler2, "a");
      sut.on(handler3, "a");

      await sut.invokeAllHandlers(internalEvent1, "a");

      expect(loggerMock.error).toBeCalledTimes(1);
      expect(loggerMock.error).toBeCalledWith(expect.any(String), {
        error: error,
        parameter: "a",
      });
      expect(handler1).toBeCalledWith(externalEvent1);
      expect(handler2).toBeCalledWith(externalEvent1);
      expect(handler3).toBeCalledWith(externalEvent1);
    });
  });

  describe("when a handler throws an error", () => {
    test("should log an error and allow other handles to work", async () => {
      const error = new Error("test-error");
      const handler1 = jest.fn();
      const handler2 = jest.fn().mockImplementationOnce(() => {
        throw error;
      });
      const handler3 = jest.fn();
      const sut = new TestSubscriptionHandlerRelay();
      const [loggerMock] = LoggerMock.mock.instances;
      sut.on(handler1, "a");
      sut.on(handler2, "a");
      sut.on(handler3, "a");

      await sut.invokeAllHandlers(internalEvent1, "a");

      expect(loggerMock.error).toBeCalledTimes(1);
      expect(loggerMock.error).toBeCalledWith(expect.any(String), {
        error: error,
        parameter: "a",
      });
      expect(handler1).toBeCalledWith(externalEvent1);
      expect(handler2).toBeCalledWith(externalEvent1);
      expect(handler3).toBeCalledWith(externalEvent1);
    });
  });
});
