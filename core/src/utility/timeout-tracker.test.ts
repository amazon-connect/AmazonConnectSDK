/* eslint-disable @typescript-eslint/unbound-method */
import { MockedClass } from "jest-mock";

import { ConnectLogger, LogLevel } from "../logging";
import { TimeoutTracker } from "./timeout-tracker";

jest.mock("../logging/connect-logger");

const LoggerMock = ConnectLogger as MockedClass<typeof ConnectLogger>;

beforeEach(jest.resetAllMocks);

let sut: TimeoutTracker;
afterEach(() => sut?.complete());

describe("constructor", () => {
  test("should apply timeout to logger mix", () => {
    const sut = new TimeoutTracker(jest.fn(), 500);
    const loggerConfig = LoggerMock.mock.calls[0][0];
    expect(typeof loggerConfig).not.toBe("string");
    if (typeof loggerConfig === "string") throw Error("ts needs this");
    const mixin = loggerConfig.mixin!;

    const result = mixin({}, LogLevel.info);

    expect(result.timeoutMs).toEqual(sut.timeoutMs);
  });

  test("should apply timeout to logger mix", () => {
    new TimeoutTracker(jest.fn(), 500);
    const loggerConfig = LoggerMock.mock.calls[0][0];
    expect(typeof loggerConfig).not.toBe("string");
    if (typeof loggerConfig === "string") throw Error("ts needs this");
    const mixin = loggerConfig.mixin!;

    const result = mixin({}, LogLevel.info);

    expect(result.timeoutTrackerStatus).toEqual("running");
  });
});

describe("start", () => {
  test("should start a new timer on first start", () => {
    const cancelledHandler = jest.fn();

    sut = TimeoutTracker.start(cancelledHandler, 5000);

    expect(sut.getStatus()).toEqual("running");
    expect(sut.isCancelled()).toBeFalsy();
    expect(cancelledHandler).not.toHaveBeenCalled();
  });
});

describe("complete", () => {
  test("should complete when running", () => {
    const cancelledHandler = jest.fn();
    sut = TimeoutTracker.start(cancelledHandler, 5000);

    const result = sut.complete();

    expect(result).toBeTruthy();
    expect(sut.getStatus()).toEqual("completed");
    expect(sut.isCancelled()).toBeFalsy();
    expect(cancelledHandler).not.toHaveBeenCalled();
  });

  test("should succeed and take no action when already completed", () => {
    const cancelledHandler = jest.fn();
    sut = TimeoutTracker.start(cancelledHandler, 5000);
    sut.complete();

    const result = sut.complete();

    expect(result).toBeTruthy();
    expect(sut.getStatus()).toEqual("completed");
    expect(sut.isCancelled()).toBeFalsy();
    expect(cancelledHandler).not.toHaveBeenCalled();
  });

  test("should return false when completing after already cancelled", (done) => {
    const cancelledHandler = () => {
      sut.complete();
      const [logger] = LoggerMock.mock.instances;
      expect(logger.info).toHaveBeenCalledTimes(2);
      expect(sut.getStatus()).toEqual("cancelled");
      done();
    };

    sut = TimeoutTracker.start(cancelledHandler, 1);
  });
});

describe("when tracker reaches timeout", () => {
  test("should call callback function", (done) => {
    const cancelledHandler = () => {
      const [logger] = LoggerMock.mock.instances;
      expect(logger.info).toHaveBeenCalledTimes(1);
      expect(sut.getStatus()).toEqual("cancelled");
      expect(sut.isCancelled()).toBeTruthy();
      done();
    };

    sut = TimeoutTracker.start(cancelledHandler, 1);
  });

  test("should log error when cancelled callback throw an error", async () => {
    const handlerError = new Error("handler error");
    const cancelledHandler = jest.fn().mockImplementation(() => {
      throw handlerError;
    });
    sut = TimeoutTracker.start(cancelledHandler, 1);
    const [logger] = LoggerMock.mock.instances;

    // Wait for cancel to happen and handler to throw an error
    while (!sut.isCancelled())
      await new Promise((resolve) => setTimeout(resolve, 1));

    expect(sut.getStatus()).toEqual("cancelled");
    expect(sut.isCancelled()).toBeTruthy();
    expect(logger.info).toHaveBeenCalledTimes(1);
    expect(logger.error).toHaveBeenCalledTimes(1);
    expect((logger.error.mock.calls[0][1] as { error: Error }).error).toEqual(
      handlerError
    );
  });
});
