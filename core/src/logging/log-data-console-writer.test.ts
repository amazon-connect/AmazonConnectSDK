import { logToConsole } from "./log-data-console-writer";
import { LogLevel } from "./log-level";

const testMessage = "hello";

beforeEach(() => jest.resetAllMocks());

describe("when log entry has data", () => {
  const data = { foo: "bar" };

  test("should log to error level", () => {
    const spy = jest.spyOn(global.console, "error").mockImplementation();

    logToConsole(LogLevel.error, testMessage, data);

    expect(spy).toHaveBeenCalledWith(testMessage, data);
  });

  test("should log to warn level", () => {
    const spy = jest.spyOn(global.console, "warn").mockImplementation();

    logToConsole(LogLevel.warn, testMessage, data);

    expect(spy).toHaveBeenCalledWith(testMessage, data);
  });

  test("should log to info level", () => {
    const spy = jest.spyOn(global.console, "info").mockImplementation();

    logToConsole(LogLevel.info, testMessage, data);

    expect(spy).toHaveBeenCalledWith(testMessage, data);
  });

  test("should log to debug level", () => {
    const spy = jest.spyOn(global.console, "debug").mockImplementation();

    logToConsole(LogLevel.debug, testMessage, data);

    expect(spy).toHaveBeenCalledWith(testMessage, data);
  });

  test("should log to trace level", () => {
    const spy = jest.spyOn(global.console, "trace").mockImplementation();

    logToConsole(LogLevel.trace, testMessage, data);

    expect(spy).toHaveBeenCalledWith(testMessage, data);
  });

  test("should log to no level", () => {
    const spy = jest.spyOn(global.console, "log").mockImplementation();

    logToConsole(undefined, testMessage, data);

    expect(spy).toHaveBeenCalledWith(testMessage, data);
  });
});

describe("when log entry does not data", () => {
  test("should log to error level", () => {
    const spy = jest.spyOn(global.console, "error").mockImplementation();

    logToConsole(LogLevel.error, testMessage);

    expect(spy).toHaveBeenCalledWith(testMessage);
  });

  test("should log to warn level", () => {
    const spy = jest.spyOn(global.console, "warn").mockImplementation();

    logToConsole(LogLevel.warn, testMessage);

    expect(spy).toHaveBeenCalledWith(testMessage);
  });

  test("should log to info level", () => {
    const spy = jest.spyOn(global.console, "info").mockImplementation();

    logToConsole(LogLevel.info, testMessage);

    expect(spy).toHaveBeenCalledWith(testMessage);
  });

  test("should log to debug level", () => {
    const spy = jest.spyOn(global.console, "debug").mockImplementation();

    logToConsole(LogLevel.debug, testMessage);

    expect(spy).toHaveBeenCalledWith(testMessage);
  });

  test("should log to trace level", () => {
    const spy = jest.spyOn(global.console, "trace").mockImplementation();

    logToConsole(LogLevel.trace, testMessage);

    expect(spy).toHaveBeenCalledWith(testMessage);
  });

  test("should log to no level", () => {
    const spy = jest.spyOn(global.console, "log").mockImplementation();

    logToConsole(undefined, testMessage);

    expect(spy).toHaveBeenCalledWith(testMessage);
  });
});
