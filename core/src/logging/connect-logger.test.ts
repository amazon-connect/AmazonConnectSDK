import { MockedClass, MockedObject } from "jest-mock";

import { ConnectLogger } from "./connect-logger";
import * as util from "../utility/id-generator";
import * as globalProvider from "../provider";
import * as consoleWriter from "./log-data-console-writer";
import { AmazonConnectProvider } from "../provider";
import { LogLevel } from "./log-level";
import { Proxy } from "../proxy";
import { ProxyLogData } from "../proxy/proxy-log-data";
import { LogDataTransformer } from "./log-data-transformer";
import { ConnectLogData } from "./logger-types";
import { AmazonConnectConfig } from "../amazon-connect-config";

jest.mock("../utility/id-generator");
jest.mock("../provider/global-provider");
jest.mock("../proxy/proxy");
jest.mock("./log-data-transformer");
jest.mock("./log-data-console-writer");

const LogDataTransformerMock = LogDataTransformer as MockedClass<
  typeof LogDataTransformer
>;

class TestProxy extends Proxy {
  constructor(provider: AmazonConnectProvider) {
    super(provider);
  }

  protected initProxy(): void {
    throw new Error("Method not implemented.");
  }
  protected sendMessageToSubject(message: any): void {
    throw new Error("Method not implemented.");
  }
  protected addContextToLogger(): Record<string, unknown> {
    throw new Error("Method not implemented.");
  }
  public get proxyType(): string {
    throw new Error("Method not implemented.");
  }
}

const testSource = "test-logger";
const testLoggerId = "12345678";
const testMessage = "test-message";
const testData = { foo: 1 };
const transformTestData = { foo: 1, bar: 2 };

let provider: AmazonConnectProvider;
let proxyLogSpy: jest.SpyInstance<void, [ProxyLogData]>;
let consoleWriteSpy: jest.SpyInstance<
  void,
  [
    level: LogLevel | undefined,
    message: string,
    data?: ConnectLogData | undefined
  ]
>;

const proxyFactory = (p: AmazonConnectProvider) => {
  const proxy = new TestProxy(p);
  proxyLogSpy = jest.spyOn(proxy, "log");
  return proxy;
};

beforeEach(() => {
  jest.resetAllMocks();
  jest.spyOn(util, "generateStringId").mockReturnValue(testLoggerId);
  const test = jest.spyOn(consoleWriter, "logToConsole");
  consoleWriteSpy = jest.spyOn(consoleWriter, "logToConsole");
});

describe("when not using any provider level options level options", () => {
  beforeEach(() => {
    provider = new AmazonConnectProvider({
      config: {},
      proxyFactory,
    });
  });

  describe("when the logger is created with a source string", () => {
    beforeEach(() => {
      jest.spyOn(globalProvider, "getGlobalProvider").mockReturnValue(provider);
    });

    test("should log a trace message", () => {
      const sut = new ConnectLogger(testSource);
      const [logDataTransformer] = LogDataTransformerMock.mock.instances;
      logDataTransformer.getTransformedData.mockReturnValueOnce(
        transformTestData
      );

      sut.trace(testMessage, testData, {});

      expect(proxyLogSpy).toHaveBeenCalledWith({
        level: LogLevel.trace,
        source: testSource,
        loggerId: testLoggerId,
        message: testMessage,
        data: transformTestData,
      });
      expect(logDataTransformer.getTransformedData).toHaveBeenCalledWith(
        LogLevel.trace,
        testData
      );
    });

    test("should log a debug message", () => {
      const sut = new ConnectLogger(testSource);
      const [logDataTransformer] = LogDataTransformerMock.mock.instances;
      logDataTransformer.getTransformedData.mockReturnValueOnce(
        transformTestData
      );

      sut.debug(testMessage, testData, {});

      expect(proxyLogSpy).toHaveBeenCalledWith({
        level: LogLevel.debug,
        source: testSource,
        loggerId: testLoggerId,
        message: testMessage,
        data: transformTestData,
      });
      expect(logDataTransformer.getTransformedData).toHaveBeenCalledWith(
        LogLevel.debug,
        testData
      );
    });

    test("should log a info message", () => {
      const sut = new ConnectLogger(testSource);
      const [logDataTransformer] = LogDataTransformerMock.mock.instances;
      logDataTransformer.getTransformedData.mockReturnValueOnce(
        transformTestData
      );

      sut.info(testMessage, testData, {});

      expect(proxyLogSpy).toHaveBeenCalledWith({
        level: LogLevel.info,
        source: testSource,
        loggerId: testLoggerId,
        message: testMessage,
        data: transformTestData,
      });
      expect(logDataTransformer.getTransformedData).toHaveBeenCalledWith(
        LogLevel.info,
        testData
      );
    });

    test("should log a warn message", () => {
      const sut = new ConnectLogger(testSource);
      const [logDataTransformer] = LogDataTransformerMock.mock.instances;
      logDataTransformer.getTransformedData.mockReturnValueOnce(
        transformTestData
      );

      sut.warn(testMessage, testData, {});

      expect(proxyLogSpy).toHaveBeenCalledWith({
        level: LogLevel.warn,
        source: testSource,
        loggerId: testLoggerId,
        message: testMessage,
        data: transformTestData,
      });
      expect(logDataTransformer.getTransformedData).toHaveBeenCalledWith(
        LogLevel.warn,
        testData
      );
    });

    test("should log a error message", () => {
      const sut = new ConnectLogger(testSource);
      const [logDataTransformer] = LogDataTransformerMock.mock.instances;
      logDataTransformer.getTransformedData.mockReturnValueOnce(
        transformTestData
      );

      sut.error(testMessage, testData, {});

      expect(proxyLogSpy).toHaveBeenCalledWith({
        level: LogLevel.error,
        source: testSource,
        loggerId: testLoggerId,
        message: testMessage,
        data: transformTestData,
      });
      expect(logDataTransformer.getTransformedData).toHaveBeenCalledWith(
        LogLevel.error,
        testData
      );
    });

    test("should log a message by setting an info level", () => {
      const sut = new ConnectLogger(testSource);
      const [logDataTransformer] = LogDataTransformerMock.mock.instances;

      const testErrorMessage = "error";
      const testErrorData = { err: true };
      const testTransformedErrorData = { err: true, foo: 1 };

      logDataTransformer.getTransformedData
        .mockReturnValueOnce(transformTestData)
        .mockReturnValueOnce(testTransformedErrorData);

      sut.log(LogLevel.info, testMessage, testData, {});
      sut.log(LogLevel.error, testErrorMessage, testErrorData);

      expect(proxyLogSpy).toHaveBeenCalledWith({
        level: LogLevel.info,
        source: testSource,
        loggerId: testLoggerId,
        message: testMessage,
        data: transformTestData,
      });
      expect(proxyLogSpy).toHaveBeenCalledWith({
        level: LogLevel.error,
        source: testSource,
        loggerId: testLoggerId,
        message: testErrorMessage,
        data: testTransformedErrorData,
      });
    });

    test("should log two entries in a row", () => {
      const sut = new ConnectLogger(testSource);
      const [logDataTransformer] = LogDataTransformerMock.mock.instances;
      logDataTransformer.getTransformedData.mockReturnValueOnce(
        transformTestData
      );

      sut.log(LogLevel.info, testMessage, testData, {});

      expect(proxyLogSpy).toHaveBeenCalledWith({
        level: LogLevel.info,
        source: testSource,
        loggerId: testLoggerId,
        message: testMessage,
        data: transformTestData,
      });
      expect(logDataTransformer.getTransformedData).toHaveBeenCalledWith(
        LogLevel.info,
        testData
      );
    });
  });

  describe("when setting a provider and using default options", () => {
    let sut: ConnectLogger;
    let logDataTransformer: MockedObject<LogDataTransformer>;

    beforeEach(() => {
      sut = new ConnectLogger({ source: testSource, provider });
      logDataTransformer = LogDataTransformerMock.mock.instances[0];
      logDataTransformer.getTransformedData.mockReturnValueOnce(
        transformTestData
      );
    });

    test("should be able to send a log message", () => {
      sut.log(LogLevel.info, testMessage, testData, {});

      expect(proxyLogSpy).toHaveBeenCalledWith({
        level: LogLevel.info,
        source: testSource,
        loggerId: testLoggerId,
        message: testMessage,
        data: transformTestData,
      });
      expect(logDataTransformer.getTransformedData).toHaveBeenCalledWith(
        LogLevel.info,
        testData
      );
    });

    test("should not send to remote when log message remoteIgnore is true", () => {
      sut.log(LogLevel.info, testMessage, testData, { remoteIgnore: true });

      expect(proxyLogSpy).not.toHaveBeenCalled();
    });

    test("should not send trace to console when duplicateMessageToConsole is false", () => {
      sut.log(LogLevel.trace, testMessage, testData, {
        duplicateMessageToConsole: false,
      });

      expect(proxyLogSpy).toHaveBeenCalledWith({
        level: LogLevel.trace,
        source: testSource,
        loggerId: testLoggerId,
        message: testMessage,
        data: transformTestData,
      });
      expect(consoleWriteSpy).not.toHaveBeenCalled();
    });

    test("should not send error to console even when duplicateMessageToConsole is false", () => {
      sut.log(LogLevel.error, testMessage, testData, {
        duplicateMessageToConsole: false,
      });

      expect(proxyLogSpy).toHaveBeenCalledWith({
        level: LogLevel.error,
        source: testSource,
        loggerId: testLoggerId,
        message: testMessage,
        data: transformTestData,
      });
      expect(consoleWriteSpy).toHaveBeenCalledWith(
        LogLevel.error,
        testMessage,
        transformTestData
      );
    });

    test("should send to trace console when duplicateMessageToConsole is true", () => {
      sut.log(LogLevel.trace, testMessage, testData, {
        duplicateMessageToConsole: true,
      });

      expect(proxyLogSpy).toHaveBeenCalledWith({
        level: LogLevel.trace,
        source: testSource,
        loggerId: testLoggerId,
        message: testMessage,
        data: transformTestData,
      });
      expect(consoleWriteSpy).toHaveBeenCalledWith(
        LogLevel.trace,
        testMessage,
        transformTestData
      );
    });
  });

  describe("when setting custom logger options", () => {
    test("should ignore remote when set logger level", () => {
      provider = new AmazonConnectProvider({
        config: {},
        proxyFactory,
      });
      const sut = new ConnectLogger({
        source: testSource,
        provider,
        options: { remoteIgnore: true },
      });
      const logDataTransformer = LogDataTransformerMock.mock.instances[0];
      logDataTransformer.getTransformedData.mockReturnValueOnce(
        transformTestData
      );

      sut.log(LogLevel.trace, testMessage, testData);

      expect(proxyLogSpy).not.toBeCalled();
    });

    test("should ignore remote when set logger level even when log entry is false", () => {
      provider = new AmazonConnectProvider({
        config: {},
        proxyFactory,
      });
      const sut = new ConnectLogger({
        source: testSource,
        provider,
        options: { remoteIgnore: true },
      });
      const logDataTransformer = LogDataTransformerMock.mock.instances[0];
      logDataTransformer.getTransformedData.mockReturnValueOnce(
        transformTestData
      );

      sut.log(LogLevel.trace, testMessage, testData, {
        remoteIgnore: false,
      });

      expect(proxyLogSpy).not.toBeCalled();
    });

    test("should ignore remote logger is set to false but entry is set to true", () => {
      provider = new AmazonConnectProvider({
        config: {},
        proxyFactory,
      });
      const sut = new ConnectLogger({
        source: testSource,
        provider,
        options: { remoteIgnore: false },
      });
      const logDataTransformer = LogDataTransformerMock.mock.instances[0];
      logDataTransformer.getTransformedData.mockReturnValueOnce(
        transformTestData
      );

      sut.log(LogLevel.trace, testMessage, testData, {
        remoteIgnore: true,
      });

      expect(proxyLogSpy).not.toBeCalled();
    });

    describe("when the logger logToConsole level is set to info", () => {
      let sut: ConnectLogger;

      beforeEach(() => {
        sut = new ConnectLogger({
          source: testSource,
          provider,
          options: { minLogToConsoleLevelOverride: LogLevel.info },
        });
        const logDataTransformer = LogDataTransformerMock.mock.instances[0];
        logDataTransformer.getTransformedData.mockReturnValueOnce(
          transformTestData
        );
      });

      test("should log warn to console", () => {
        sut.log(LogLevel.warn, testMessage, testData, {
          remoteIgnore: true,
        });

        expect(consoleWriteSpy).toHaveBeenCalledWith(
          LogLevel.warn,
          testMessage,
          transformTestData
        );
      });

      test("should log info to console", () => {
        sut.log(LogLevel.info, testMessage, testData, {
          remoteIgnore: true,
        });

        expect(consoleWriteSpy).toHaveBeenCalledWith(
          LogLevel.info,
          testMessage,
          transformTestData
        );
      });

      test("should not log debug to console", () => {
        sut.log(LogLevel.debug, testMessage, testData, {
          remoteIgnore: true,
        });

        expect(consoleWriteSpy).not.toHaveBeenCalled();
      });
    });
  });
});

describe("when setting the provider minLogToConsoleLevel to info", () => {
  beforeEach(() => {
    provider = new AmazonConnectProvider<AmazonConnectConfig>({
      proxyFactory,
      config: { logging: { minLogToConsoleLevel: LogLevel.info } },
    });
  });

  describe("when the logger does not have an override set", () => {
    let sut: ConnectLogger;

    beforeEach(() => {
      sut = new ConnectLogger({
        source: testSource,
        provider,
      });
      const logDataTransformer = LogDataTransformerMock.mock.instances[0];
      logDataTransformer.getTransformedData.mockReturnValueOnce(
        transformTestData
      );
    });

    test("should log warn to console", () => {
      sut.log(LogLevel.warn, testMessage, testData, {
        remoteIgnore: true,
      });

      expect(consoleWriteSpy).toHaveBeenCalledWith(
        LogLevel.warn,
        testMessage,
        transformTestData
      );
    });

    test("should log info to console", () => {
      sut.log(LogLevel.info, testMessage, testData, {
        remoteIgnore: true,
      });

      expect(consoleWriteSpy).toHaveBeenCalledWith(
        LogLevel.info,
        testMessage,
        transformTestData
      );
    });

    test("should not log debug to console", () => {
      sut.log(LogLevel.debug, testMessage, testData, {
        remoteIgnore: true,
      });

      expect(consoleWriteSpy).not.toHaveBeenCalled();
    });
  });

  describe("when the logger has a override level set to warn", () => {
    let sut: ConnectLogger;

    beforeEach(() => {
      sut = new ConnectLogger({
        source: testSource,
        provider,
        options: { minLogToConsoleLevelOverride: LogLevel.warn },
      });
      const logDataTransformer = LogDataTransformerMock.mock.instances[0];
      logDataTransformer.getTransformedData.mockReturnValueOnce(
        transformTestData
      );
    });

    test("should not log debug to console", () => {
      sut.log(LogLevel.error, testMessage, testData, {
        remoteIgnore: true,
      });

      expect(consoleWriteSpy).toHaveBeenCalledWith(
        LogLevel.error,
        testMessage,
        transformTestData
      );
    });

    test("should log warn to console", () => {
      sut.log(LogLevel.warn, testMessage, testData, {
        remoteIgnore: true,
      });

      expect(consoleWriteSpy).toHaveBeenCalledWith(
        LogLevel.warn,
        testMessage,
        transformTestData
      );
    });

    test("should not log info to console", () => {
      sut.log(LogLevel.info, testMessage, testData, {
        remoteIgnore: true,
      });

      expect(consoleWriteSpy).not.toHaveBeenCalled();
    });
  });
});
