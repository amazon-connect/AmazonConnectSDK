/* eslint-disable @typescript-eslint/unbound-method */
import { MockedClass, MockedObject } from "jest-mock";
import { mock } from "jest-mock-extended";

import { ConnectLogger } from "../../logging";
import { AmazonConnectProvider } from "../../provider";
import { EventEmitter } from "./event-emitter";

jest.mock("../../logging/connect-logger");

const LoggerMock = ConnectLogger as MockedClass<typeof ConnectLogger>;

const provider = mock<AmazonConnectProvider>();
let loggerMock: MockedObject<ConnectLogger>;
const testKey = "test-key";

type TestEvent = { foo: string };
const testEvent: TestEvent = { foo: "1" };

beforeEach(jest.resetAllMocks);

describe("EventEmitter", () => {
  let sut: EventEmitter<TestEvent>;
  const p1 = "p1";

  beforeEach(() => {
    sut = new EventEmitter({ provider, loggerKey: testKey });

    loggerMock = LoggerMock.mock.instances[0];
  });

  describe("emit", () => {
    test("should invoke handler when emitted", () => {
      const handler = jest.fn();
      sut.on(p1, handler);

      sut.emit(p1, testEvent);

      expect(handler).toBeCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(testEvent);
    });

    test("should invoke handler added multiple times once", () => {
      const handler = jest.fn();
      sut.on(p1, handler);
      sut.on(p1, handler);

      sut.emit(p1, testEvent);

      expect(handler).toBeCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(testEvent);
    });

    test("should invoke multiple handlers", () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();
      sut.on(p1, handler1);
      sut.on(p1, handler2);

      sut.emit(p1, testEvent);

      expect(handler1).toBeCalledTimes(1);
      expect(handler1).toHaveBeenCalledWith(testEvent);
      expect(handler2).toBeCalledTimes(1);
      expect(handler2).toHaveBeenCalledWith(testEvent);
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

      sut.emit(p1, testEvent);

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
