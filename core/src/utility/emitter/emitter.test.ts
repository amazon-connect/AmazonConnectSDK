/* eslint-disable @typescript-eslint/unbound-method */
import { MockedClass, MockedObject } from "jest-mock";
import { mock } from "jest-mock-extended";

import { ConnectLogger, LogLevel } from "../../logging";
import { AmazonConnectProvider } from "../../provider";
import { Emitter } from "./emitter";

jest.mock("../../logging/connect-logger");

const LoggerMock = ConnectLogger as MockedClass<typeof ConnectLogger>;

const provider = mock<AmazonConnectProvider>();
let loggerMock: MockedObject<ConnectLogger>;
const testKey = "test-key";

beforeEach(jest.resetAllMocks);

describe("Emitter", () => {
  let sut: Emitter;
  const p1 = "p1";
  const p2 = "p2";

  beforeEach(() => {
    sut = new Emitter({ provider, loggerKey: testKey });

    loggerMock = LoggerMock.mock.instances[0];
  });

  describe("constructor ", () => {
    test("should add emitterLoggerKey to logger mixin", () => {
      const loggerConfig = LoggerMock.mock.calls[0][0];
      if (typeof loggerConfig === "string") throw Error("ts needs this");
      const mixin = loggerConfig.mixin!;

      const result = mixin({}, LogLevel.info);

      expect(result.emitterLoggerKey).toEqual(testKey);
    });
  });

  describe("emit", () => {
    test("should invoke added handler with parameter", () => {
      const handler = jest.fn();
      sut.on(p1, handler);

      sut.emit(p1);

      expect(handler).toBeCalledTimes(1);
    });

    test("should not invoke handler of different parameter", () => {
      const handler = jest.fn();
      sut.on(p1, handler);

      sut.emit(p2);

      expect(handler).toBeCalledTimes(0);
    });

    test("should invoke for parameter", () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();
      const handler3 = jest.fn();
      sut.on(p1, handler1);
      sut.on(p1, handler2);
      sut.on(p2, handler3);

      sut.emit(p1);

      expect(handler1).toBeCalledTimes(1);
      expect(handler2).toBeCalledTimes(1);
      expect(handler3).toBeCalledTimes(0);
    });

    test("should invoke a handler when the function is removed for a different parameter", () => {
      const handler = jest.fn();
      sut.on(p1, handler);
      sut.off(p2, handler);

      sut.emit(p1);

      expect(handler).toBeCalledTimes(1);
    });

    test("should invoke a handler when same handler removed with parameter", () => {
      const handler = jest.fn();
      sut.on(p1, handler);
      sut.on(p2, handler);
      sut.off(p2, handler);

      sut.emit(p1);

      expect(handler).toBeCalledTimes(1);
    });

    test("should remove internal event map when no handler parameter exists", () => {
      const handler = jest.fn();
      sut.on(p1, handler);
      expect(sut["events"].get(p1)).toBeDefined();

      sut.off(p1, handler);

      expect(sut["events"].get(p1)).toBeUndefined();
    });

    test("should only invoke a handler added multiple times once", () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();
      sut.on(p1, handler1);
      sut.on(p1, handler1);
      sut.on(p1, handler2);

      sut.emit(p1);

      expect(handler1).toBeCalledTimes(1);
      expect(handler2).toBeCalledTimes(1);
    });

    test("should remove handler added multiple times", () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();
      sut.on(p1, handler1);
      sut.on(p1, handler1);
      sut.on(p1, handler2);
      sut.off(p1, handler1);

      sut.emit(p1);

      expect(handler1).toBeCalledTimes(0);
      expect(handler2).toBeCalledTimes(1);
    });

    test("should invoke additional handlers after one throws error", () => {
      const handler2Error = new Error("handler 2");
      const handler4Error = new Error("handler 4");

      const handler1 = jest.fn();
      const handler2 = jest.fn().mockImplementationOnce(() => {
        throw handler2Error;
      });
      const handler3 = jest.fn();
      const handler4 = jest.fn().mockImplementationOnce(() => {
        throw handler4Error;
      });
      sut.on(p1, handler1);
      sut.on(p1, handler2);
      sut.on(p1, handler3);
      sut.on(p1, handler4);

      sut.emit(p1);

      expect(loggerMock.error).toBeCalledTimes(2);
      expect(loggerMock.error).toBeCalledWith(expect.any(String), {
        error: handler2Error,
        parameter: p1,
      });
      expect(loggerMock.error).toBeCalledWith(expect.any(String), {
        error: handler4Error,
        parameter: p1,
      });
      expect(handler1).toBeCalledTimes(1);
      expect(handler2).toBeCalledTimes(1);
      expect(handler3).toBeCalledTimes(1);
      expect(handler4).toBeCalledTimes(1);
    });
  });
});
