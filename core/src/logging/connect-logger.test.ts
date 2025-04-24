/* eslint-disable @typescript-eslint/unbound-method */
import { MockedClass, MockedObject } from "jest-mock";
import { mock } from "jest-mock-extended";

import * as globalProvider from "../provider";
import { AmazonConnectProvider } from "../provider";
import { Proxy } from "../proxy";
import * as util from "../utility/id-generator";
import { ConnectLogger } from "./connect-logger";
import * as consoleWriter from "./log-data-console-writer";
import { LogDataTransformer } from "./log-data-transformer";
import { LogLevel } from "./log-level";
import { ConnectLogData } from "./logger-types";

jest.mock("../utility/id-generator");
jest.mock("../provider/global-provider");
jest.mock("../proxy/proxy");
jest.mock("./log-data-transformer");
jest.mock("./log-data-console-writer");

const LogDataTransformerMock = LogDataTransformer as MockedClass<
  typeof LogDataTransformer
>;

const testSource = "test-logger";
const testLoggerId = "12345678";
const testMessage = "test-message";
const testData = { foo: 1 };
const transformTestData = { foo: 1, bar: 2 };

const proxyMock = mock<Proxy>();
const providerMock = mock<AmazonConnectProvider>({
  getProxy: () => proxyMock,
});
let consoleWriteSpy: jest.SpyInstance<
  void,
  [
    level: LogLevel | undefined,
    message: string,
    data?: ConnectLogData | undefined,
  ]
>;

beforeEach(() => {
  jest.resetAllMocks();
  jest.spyOn(util, "generateStringId").mockReturnValue(testLoggerId);
  jest.spyOn(consoleWriter, "logToConsole");
  consoleWriteSpy = jest.spyOn(consoleWriter, "logToConsole");
});

describe("when not using any provider level options", () => {
  describe("when the logger is created with a source string", () => {
    beforeEach(() => {
      jest
        .spyOn(globalProvider, "getGlobalProvider")
        .mockReturnValue(providerMock);
    });

    test("should log a trace message", () => {
      const sut = new ConnectLogger(testSource);
      const [logDataTransformer] = LogDataTransformerMock.mock.instances;
      logDataTransformer.getTransformedData.mockReturnValueOnce(
        transformTestData,
      );

      sut.trace(testMessage, testData, {});

      expect(proxyMock.log).toHaveBeenCalledWith({
        level: LogLevel.trace,
        source: testSource,
        loggerId: testLoggerId,
        message: testMessage,
        data: transformTestData,
      });
      expect(logDataTransformer.getTransformedData).toHaveBeenCalledWith(
        LogLevel.trace,
        testData,
      );
    });

    test("should log a debug message", () => {
      const sut = new ConnectLogger(testSource);
      const [logDataTransformer] = LogDataTransformerMock.mock.instances;
      logDataTransformer.getTransformedData.mockReturnValueOnce(
        transformTestData,
      );

      sut.debug(testMessage, testData, {});

      expect(proxyMock.log).toHaveBeenCalledWith({
        level: LogLevel.debug,
        source: testSource,
        loggerId: testLoggerId,
        message: testMessage,
        data: transformTestData,
      });
      expect(logDataTransformer.getTransformedData).toHaveBeenCalledWith(
        LogLevel.debug,
        testData,
      );
    });

    test("should log a info message", () => {
      const sut = new ConnectLogger(testSource);
      const [logDataTransformer] = LogDataTransformerMock.mock.instances;
      logDataTransformer.getTransformedData.mockReturnValueOnce(
        transformTestData,
      );

      sut.info(testMessage, testData, {});

      expect(proxyMock.log).toHaveBeenCalledWith({
        level: LogLevel.info,
        source: testSource,
        loggerId: testLoggerId,
        message: testMessage,
        data: transformTestData,
      });
      expect(logDataTransformer.getTransformedData).toHaveBeenCalledWith(
        LogLevel.info,
        testData,
      );
    });

    test("should log a warn message", () => {
      const sut = new ConnectLogger(testSource);
      const [logDataTransformer] = LogDataTransformerMock.mock.instances;
      logDataTransformer.getTransformedData.mockReturnValueOnce(
        transformTestData,
      );

      sut.warn(testMessage, testData, {});

      expect(proxyMock.log).toHaveBeenCalledWith({
        level: LogLevel.warn,
        source: testSource,
        loggerId: testLoggerId,
        message: testMessage,
        data: transformTestData,
      });
      expect(logDataTransformer.getTransformedData).toHaveBeenCalledWith(
        LogLevel.warn,
        testData,
      );
    });

    test("should log a error message", () => {
      const sut = new ConnectLogger(testSource);
      const [logDataTransformer] = LogDataTransformerMock.mock.instances;
      logDataTransformer.getTransformedData.mockReturnValueOnce(
        transformTestData,
      );

      sut.error(testMessage, testData, {});

      expect(proxyMock.log).toHaveBeenCalledWith({
        level: LogLevel.error,
        source: testSource,
        loggerId: testLoggerId,
        message: testMessage,
        data: transformTestData,
      });
      expect(logDataTransformer.getTransformedData).toHaveBeenCalledWith(
        LogLevel.error,
        testData,
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

      expect(proxyMock.log).toHaveBeenCalledWith({
        level: LogLevel.info,
        source: testSource,
        loggerId: testLoggerId,
        message: testMessage,
        data: transformTestData,
      });
      expect(proxyMock.log).toHaveBeenCalledWith({
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
        transformTestData,
      );

      sut.log(LogLevel.info, testMessage, testData, {});

      expect(proxyMock.log).toHaveBeenCalledWith({
        level: LogLevel.info,
        source: testSource,
        loggerId: testLoggerId,
        message: testMessage,
        data: transformTestData,
      });
      expect(logDataTransformer.getTransformedData).toHaveBeenCalledWith(
        LogLevel.info,
        testData,
      );
    });
  });

  describe("when setting a provider and using default options", () => {
    let sut: ConnectLogger;
    let logDataTransformer: MockedObject<LogDataTransformer>;

    beforeEach(() => {
      sut = new ConnectLogger({ source: testSource, provider: providerMock });
      logDataTransformer = LogDataTransformerMock.mock.instances[0];
      logDataTransformer.getTransformedData.mockReturnValueOnce(
        transformTestData,
      );
    });

    test("should be able to send a log message", () => {
      sut.log(LogLevel.info, testMessage, testData, {});

      expect(proxyMock.log).toHaveBeenCalledWith({
        level: LogLevel.info,
        source: testSource,
        loggerId: testLoggerId,
        message: testMessage,
        data: transformTestData,
      });
      expect(logDataTransformer.getTransformedData).toHaveBeenCalledWith(
        LogLevel.info,
        testData,
      );
    });

    test("should not send to remote when log message remoteIgnore is true", () => {
      sut.log(LogLevel.info, testMessage, testData, { remoteIgnore: true });

      expect(proxyMock.log).not.toHaveBeenCalled();
    });

    test("should not send trace to console when duplicateMessageToConsole is false", () => {
      sut.log(LogLevel.trace, testMessage, testData, {
        duplicateMessageToConsole: false,
      });

      expect(proxyMock.log).toHaveBeenCalledWith({
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

      expect(proxyMock.log).toHaveBeenCalledWith({
        level: LogLevel.error,
        source: testSource,
        loggerId: testLoggerId,
        message: testMessage,
        data: transformTestData,
      });
      expect(consoleWriteSpy).toHaveBeenCalledWith(
        LogLevel.error,
        testMessage,
        transformTestData,
      );
    });

    test("should send to trace console when duplicateMessageToConsole is true", () => {
      sut.log(LogLevel.trace, testMessage, testData, {
        duplicateMessageToConsole: true,
      });

      expect(proxyMock.log).toHaveBeenCalledWith({
        level: LogLevel.trace,
        source: testSource,
        loggerId: testLoggerId,
        message: testMessage,
        data: transformTestData,
      });
      expect(consoleWriteSpy).toHaveBeenCalledWith(
        LogLevel.trace,
        testMessage,
        transformTestData,
      );
    });
  });

  describe("when creating with a provider factory", () => {
    let sut: ConnectLogger;
    let logDataTransformer: MockedObject<LogDataTransformer>;

    beforeEach(() => {
      sut = new ConnectLogger({
        source: testSource,
        provider: () => providerMock,
      });
      logDataTransformer = LogDataTransformerMock.mock.instances[0];
      logDataTransformer.getTransformedData.mockReturnValueOnce(
        transformTestData,
      );
    });

    test("should be able to send a log message", () => {
      sut.log(LogLevel.info, testMessage, testData, {});

      expect(proxyMock.log).toHaveBeenCalledWith({
        level: LogLevel.info,
        source: testSource,
        loggerId: testLoggerId,
        message: testMessage,
        data: transformTestData,
      });
      expect(logDataTransformer.getTransformedData).toHaveBeenCalledWith(
        LogLevel.info,
        testData,
      );
    });
  });

  describe("when setting custom logger options", () => {
    test("should ignore remote when set logger level", () => {
      const sut = new ConnectLogger({
        source: testSource,
        provider: providerMock,
        options: { remoteIgnore: true },
      });
      const logDataTransformer = LogDataTransformerMock.mock.instances[0];
      logDataTransformer.getTransformedData.mockReturnValueOnce(
        transformTestData,
      );

      sut.log(LogLevel.trace, testMessage, testData);

      expect(proxyMock.log).not.toBeCalled();
    });

    test("should ignore remote when set logger level even when log entry is false", () => {
      const sut = new ConnectLogger({
        source: testSource,
        provider: providerMock,
        options: { remoteIgnore: true },
      });
      const logDataTransformer = LogDataTransformerMock.mock.instances[0];
      logDataTransformer.getTransformedData.mockReturnValueOnce(
        transformTestData,
      );

      sut.log(LogLevel.trace, testMessage, testData, {
        remoteIgnore: false,
      });

      expect(proxyMock.log).not.toBeCalled();
    });

    test("should ignore remote logger is set to false but entry is set to true", () => {
      const sut = new ConnectLogger({
        source: testSource,
        provider: providerMock,
        options: { remoteIgnore: false },
      });
      const logDataTransformer = LogDataTransformerMock.mock.instances[0];
      logDataTransformer.getTransformedData.mockReturnValueOnce(
        transformTestData,
      );

      sut.log(LogLevel.trace, testMessage, testData, {
        remoteIgnore: true,
      });

      expect(proxyMock.log).not.toBeCalled();
    });

    describe("when the logger logToConsole level is set to info", () => {
      let sut: ConnectLogger;

      beforeEach(() => {
        sut = new ConnectLogger({
          source: testSource,
          provider: providerMock,
          options: { minLogToConsoleLevelOverride: LogLevel.info },
        });
        const logDataTransformer = LogDataTransformerMock.mock.instances[0];
        logDataTransformer.getTransformedData.mockReturnValueOnce(
          transformTestData,
        );
      });

      test("should log warn to console", () => {
        sut.log(LogLevel.warn, testMessage, testData, {
          remoteIgnore: true,
        });

        expect(consoleWriteSpy).toHaveBeenCalledWith(
          LogLevel.warn,
          testMessage,
          transformTestData,
        );
      });

      test("should log info to console", () => {
        sut.log(LogLevel.info, testMessage, testData, {
          remoteIgnore: true,
        });

        expect(consoleWriteSpy).toHaveBeenCalledWith(
          LogLevel.info,
          testMessage,
          transformTestData,
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
  const providerWithConfig = mock<AmazonConnectProvider>({
    getProxy: () => proxyMock,
    config: { logging: { minLogToConsoleLevel: LogLevel.info } },
  });

  describe("when the logger does not have an override set", () => {
    let sut: ConnectLogger;

    beforeEach(() => {
      sut = new ConnectLogger({
        source: testSource,
        provider: providerWithConfig,
      });
      const logDataTransformer = LogDataTransformerMock.mock.instances[0];
      logDataTransformer.getTransformedData.mockReturnValueOnce(
        transformTestData,
      );
    });

    test("should log warn to console", () => {
      sut.log(LogLevel.warn, testMessage, testData, {
        remoteIgnore: true,
      });

      expect(consoleWriteSpy).toHaveBeenCalledWith(
        LogLevel.warn,
        testMessage,
        transformTestData,
      );
    });

    test("should log info to console", () => {
      sut.log(LogLevel.info, testMessage, testData, {
        remoteIgnore: true,
      });

      expect(consoleWriteSpy).toHaveBeenCalledWith(
        LogLevel.info,
        testMessage,
        transformTestData,
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
        provider: providerWithConfig,

        options: { minLogToConsoleLevelOverride: LogLevel.warn },
      });
      const logDataTransformer = LogDataTransformerMock.mock.instances[0];
      logDataTransformer.getTransformedData.mockReturnValueOnce(
        transformTestData,
      );
    });

    test("should not log debug to console", () => {
      sut.log(LogLevel.error, testMessage, testData, {
        remoteIgnore: true,
      });

      expect(consoleWriteSpy).toHaveBeenCalledWith(
        LogLevel.error,
        testMessage,
        transformTestData,
      );
    });

    test("should log warn to console", () => {
      sut.log(LogLevel.warn, testMessage, testData, {
        remoteIgnore: true,
      });

      expect(consoleWriteSpy).toHaveBeenCalledWith(
        LogLevel.warn,
        testMessage,
        transformTestData,
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
