import { ConnectLogger } from "./connect-logger";
import * as util from "../utility";
import {
  AmazonConnectProvider,
  AmazonConnectProviderParams,
} from "../provider";
import { AmazonConnectConfig } from "../amazon-connect-config";
import { LogLevel } from "./log-level";
import { Proxy } from "../proxy";

beforeEach(() => {
  jest.resetAllMocks();
  const testLoggerId = "12345678";
  jest.spyOn(util, "generateStringId").mockImplementation(() => testLoggerId);
});
jest.mock("../utility");
jest.mock("../provider");
jest.mock("../proxy");

const testProvider = new AmazonConnectProvider(
  {} as unknown as AmazonConnectProviderParams<AmazonConnectConfig>
);
const testConnectLoggerParams = {
  source: "test",
  provider: testProvider,
  options: {
    duplicateMessageToConsole: false,
  },
  mixin: () => {
    return {
      data: {
        testKey: "testValue",
      },
      level: 5,
    };
  },
};
const testLoggerId = "12345678";
jest.spyOn(util, "generateStringId");

describe("ConnectLogger", () => {
  test("should call generateStringId when initialized with string param", () => {
    const testConnectLogger = new ConnectLogger("test");

    expect(util.generateStringId).toHaveBeenCalled();
  });

  test("should call generateStringId when initialized with ConnectLoggerParams", () => {
    const testConnectLogger = new ConnectLogger(testConnectLoggerParams);

    expect(util.generateStringId).toHaveBeenCalled();
  });
});

describe("trace", () => {
  test("should call log with type trace", () => {
    const testConnectLogger = new ConnectLogger(testConnectLoggerParams);
    jest.spyOn(testConnectLogger, "log").mockImplementation(() => {});

    testConnectLogger.trace("testMessage");

    expect(testConnectLogger.log).toHaveBeenCalledWith(
      LogLevel.trace,
      "testMessage",
      undefined,
      undefined
    );
  });
});

describe("debug", () => {
  test("should call log with type debug", () => {
    const testConnectLogger = new ConnectLogger(testConnectLoggerParams);
    jest.spyOn(testConnectLogger, "log").mockImplementation(() => {});

    testConnectLogger.debug("testMessage");

    expect(testConnectLogger.log).toHaveBeenCalledWith(
      LogLevel.debug,
      "testMessage",
      undefined,
      undefined
    );
  });
});

describe("info", () => {
  test("should call log with type info", () => {
    const testConnectLogger = new ConnectLogger(testConnectLoggerParams);
    jest.spyOn(testConnectLogger, "log").mockImplementation(() => {});

    testConnectLogger.info("testMessage");

    expect(testConnectLogger.log).toHaveBeenCalledWith(
      LogLevel.info,
      "testMessage",
      undefined,
      undefined
    );
  });
});

describe("warn", () => {
  test("should call log with type warn", () => {
    const testConnectLogger = new ConnectLogger(testConnectLoggerParams);
    jest.spyOn(testConnectLogger, "log").mockImplementation(() => {});

    testConnectLogger.warn("testMessage");

    expect(testConnectLogger.log).toHaveBeenCalledWith(
      LogLevel.warn,
      "testMessage",
      undefined,
      undefined
    );
  });
});

describe("error", () => {
  test("should call log with type error", () => {
    const testConnectLogger = new ConnectLogger(testConnectLoggerParams);
    jest.spyOn(testConnectLogger, "log").mockImplementation(() => {});

    testConnectLogger.error("testMessage");

    expect(testConnectLogger.log).toHaveBeenCalledWith(
      LogLevel.error,
      "testMessage",
      undefined,
      undefined
    );
  });
});

describe("log", () => {
  test("should call getProxy().log() with type error and also call console.error", () => {
    const testConnectLogger = new ConnectLogger(testConnectLoggerParams);
    let logParams;
    jest.spyOn(testProvider, "getProxy").mockImplementation(() => {
      return {
        log: jest.fn().mockImplementation((params) => {
          logParams = params;
        }),
      } as unknown as Proxy;
    });
    jest.spyOn(testProvider.getProxy(), "log");
    jest.spyOn(console, "error").mockImplementation(() => {});

    testConnectLogger.log(LogLevel.error, "testMessage");

    expect(testProvider.getProxy).toHaveBeenCalled();
    expect(logParams).toEqual({
      level: LogLevel.error,
      source: "test",
      loggerId: testLoggerId,
      message: "testMessage",
      data: { data: { testKey: "testValue" }, level: 5 },
    });
    expect(console.error).toHaveBeenCalledWith("testMessage", undefined);
  });

  test("should call getProxy().log() with type warn and also call console.warn", () => {
    const { source, provider, options } = testConnectLoggerParams;
    const testConnectLogger = new ConnectLogger({
      source,
      provider,
      options,
    });
    let logParams;
    jest.spyOn(testProvider, "getProxy").mockImplementation(() => {
      return {
        log: jest.fn().mockImplementation((params) => {
          logParams = params;
        }),
      } as unknown as Proxy;
    });
    jest.spyOn(testProvider.getProxy(), "log");
    jest.spyOn(console, "warn").mockImplementation(() => {});

    testConnectLogger.log(LogLevel.warn, "testMessage");

    expect(testProvider.getProxy).toHaveBeenCalled();
    expect(logParams).toEqual({
      level: LogLevel.warn,
      source: "test",
      loggerId: testLoggerId,
      message: "testMessage",
      data: undefined,
    });
    expect(console.warn).toHaveBeenCalledWith("testMessage", undefined);
  });

  test("should call getProxy().log() with type info and also call console.info", () => {
    const { source, provider, options } = testConnectLoggerParams;
    const testConnectLogger = new ConnectLogger({
      source,
      provider,
      options,
    });
    let logParams;
    jest.spyOn(testProvider, "getProxy").mockImplementation(() => {
      return {
        log: jest.fn().mockImplementation((params) => {
          logParams = params;
        }),
      } as unknown as Proxy;
    });
    jest.spyOn(testProvider.getProxy(), "log");
    jest.spyOn(console, "info").mockImplementation(() => {});

    testConnectLogger.log(LogLevel.info, "testMessage");

    expect(testProvider.getProxy).toHaveBeenCalled();
    expect(logParams).toEqual({
      level: LogLevel.info,
      source: "test",
      loggerId: testLoggerId,
      message: "testMessage",
      data: undefined,
    });
    expect(console.info).toHaveBeenCalledWith("testMessage", undefined);
  });

  test("should call getProxy().log() with type debug and also call console.debug", () => {
    const { source, provider, options } = testConnectLoggerParams;
    const testConnectLogger = new ConnectLogger({
      source,
      provider,
      options,
    });
    let logParams;
    jest.spyOn(testProvider, "getProxy").mockImplementation(() => {
      return {
        log: jest.fn().mockImplementation((params) => {
          logParams = params;
        }),
      } as unknown as Proxy;
    });
    jest.spyOn(testProvider.getProxy(), "log");
    jest.spyOn(console, "debug").mockImplementation(() => {});

    testConnectLogger.log(LogLevel.debug, "testMessage");

    expect(testProvider.getProxy).toHaveBeenCalled();
    expect(logParams).toEqual({
      level: LogLevel.debug,
      source: "test",
      loggerId: testLoggerId,
      message: "testMessage",
      data: undefined,
    });
    expect(console.debug).toHaveBeenCalledWith("testMessage", undefined);
  });

  test("should call getProxy().log() with type trace and also call console.trace", () => {
    const { source, provider, options } = testConnectLoggerParams;
    const testConnectLogger = new ConnectLogger({
      source,
      provider,
      options,
    });
    let logParams;
    jest.spyOn(testProvider, "getProxy").mockImplementation(() => {
      return {
        log: jest.fn().mockImplementation((params) => {
          logParams = params;
        }),
      } as unknown as Proxy;
    });
    jest.spyOn(testProvider.getProxy(), "log");
    jest.spyOn(console, "trace").mockImplementation(() => {});

    testConnectLogger.log(LogLevel.trace, "testMessage");

    expect(testProvider.getProxy).toHaveBeenCalled();
    expect(logParams).toEqual({
      level: LogLevel.trace,
      source: "test",
      loggerId: testLoggerId,
      message: "testMessage",
      data: undefined,
    });
    expect(console.trace).toHaveBeenCalledWith("testMessage", undefined);
  });

  test("should call getProxy().log() with type log and also call console.log", () => {
    const { source, provider, options } = testConnectLoggerParams;
    const testConnectLogger = new ConnectLogger({
      source,
      provider,
      options,
    });
    let logParams;
    jest.spyOn(testProvider, "getProxy").mockImplementation(() => {
      return {
        log: jest.fn().mockImplementation((params) => {
          logParams = params;
        }),
      } as unknown as Proxy;
    });
    jest.spyOn(testProvider.getProxy(), "log");
    jest.spyOn(console, "log").mockImplementation(() => {});

    testConnectLogger.log(0 as LogLevel, "testMessage");

    expect(testProvider.getProxy).toHaveBeenCalled();
    expect(logParams).toEqual({
      level: 0,
      source: "test",
      loggerId: testLoggerId,
      message: "testMessage",
      data: undefined,
    });
    expect(console.log).toHaveBeenCalledWith("testMessage", undefined);
  });

  test("should call getProxy().log() with type log and call console.log for logLevel 0 (<5) but not call console.log for invalid logLevel 10", () => {
    const { source, provider, options } = testConnectLoggerParams;
    const testConnectLogger = new ConnectLogger({
      source,
      provider,
      options,
    });
    let logParams: any[] = [];
    jest.spyOn(testProvider, "getProxy").mockImplementation(() => {
      return {
        log: jest.fn().mockImplementation((params) => {
          logParams.push(params);
        }),
      } as unknown as Proxy;
    });
    jest.spyOn(testProvider.getProxy(), "log");
    jest.spyOn(console, "log").mockImplementation(() => {});

    testConnectLogger.log(0 as LogLevel, "testMessage");
    testConnectLogger.log(10 as LogLevel, "testMessage");

    expect(testProvider.getProxy).toHaveBeenCalled();
    expect(logParams[0]).toEqual({
      level: 0,
      source: "test",
      loggerId: testLoggerId,
      message: "testMessage",
      data: undefined,
    });
    expect(logParams[1]).toEqual({
      level: 10,
      source: "test",
      loggerId: testLoggerId,
      message: "testMessage",
      data: undefined,
    });
    expect(console.log).toHaveBeenCalledTimes(1);
    expect(console.log).toHaveBeenCalledWith("testMessage", undefined);
  });
});
