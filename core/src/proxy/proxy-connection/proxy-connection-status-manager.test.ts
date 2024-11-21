import { MockedClass } from "jest-mock";
import { mock } from "jest-mock-extended";

import { ConnectLogger, LogLevel, LogProvider } from "../../logging";
import { ProxyConnectionStatusManager } from "./proxy-connection-status-manager";
import { ProxyError, ProxyInitializing, ProxyReady } from "./types";

jest.mock("../../logging/connect-logger");

const LoggerMock = ConnectLogger as MockedClass<typeof ConnectLogger>;
const logProvider = mock<LogProvider>();

beforeEach(() => jest.resetAllMocks());

describe("constructor", () => {
  test("should apply the proxy type to logger mix", () => {
    const sut = new ProxyConnectionStatusManager(logProvider);
    const loggerConfig = LoggerMock.mock.calls[0][0];
    expect(typeof loggerConfig).not.toBe("string");
    if (typeof loggerConfig === "string") throw Error("ts needs this");
    const mixin = loggerConfig.mixin!;

    const result = mixin({}, LogLevel.info);

    expect(result.status).toEqual(sut.getStatus());
  });
});

describe("getStatus", () => {
  test("should default to 'notConnected'", () => {
    const sut = new ProxyConnectionStatusManager(logProvider);

    const result = sut.getStatus();

    expect(result).toEqual("notConnected");
  });
});

describe("when calling update", () => {
  test("should update status when no handlers are set", () => {
    const sut = new ProxyConnectionStatusManager(logProvider);
    const initMsg: ProxyInitializing = { status: "initializing" };

    sut.update(initMsg);

    expect(sut.getStatus()).toEqual("initializing");
  });

  test("should invoke two handlers on status change", () => {
    const sut = new ProxyConnectionStatusManager(logProvider);
    const err: ProxyError = { status: "error", reason: "testing" };
    const mockHandler1 = jest.fn();
    const mockHandler2 = jest.fn();
    sut.onChange(mockHandler1);
    sut.onChange(mockHandler2);

    sut.update(err);

    expect(mockHandler1).toHaveBeenCalledWith(err);
    expect(mockHandler2).toHaveBeenCalledWith(err);
    expect(sut.getStatus()).toEqual("error");
  });

  test("should ignore handler that has been unsubscribed", () => {
    const sut = new ProxyConnectionStatusManager(logProvider);
    const readyMsg: ProxyReady = { status: "ready", connectionId: "test-conn" };
    const mockHandler1 = jest.fn();
    const mockHandler2 = jest.fn();
    sut.onChange(mockHandler1);
    sut.onChange(mockHandler2);
    sut.offChange(mockHandler2);

    sut.update(readyMsg);

    expect(mockHandler1).toHaveBeenCalledWith(readyMsg);
    expect(mockHandler2).not.toHaveBeenCalled();
    expect(sut.getStatus()).toEqual("ready");
  });

  test("should catch and log handler error", () => {
    const sut = new ProxyConnectionStatusManager(logProvider);
    const [logger] = LoggerMock.mock.instances;
    const err: ProxyError = { status: "error", reason: "testing" };
    const mockHandler = jest.fn();
    const handlerError = "handlerError";
    mockHandler.mockImplementation(() => {
      throw new Error(handlerError);
    });
    sut.onChange(mockHandler);

    sut.update(err);

    expect(mockHandler).toHaveBeenCalledWith(err);
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(logger.error).toHaveBeenCalled();
    const errorData = logger.error.mock.calls[0][1] as { error: Error };
    expect(errorData?.error).toBeInstanceOf(Error);
    expect(errorData?.error.message).toEqual(handlerError);
  });
});
