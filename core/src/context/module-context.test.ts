/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable @typescript-eslint/unbound-method */
import { mocked } from "jest-mock";
import { mock } from "jest-mock-extended";

import {
  ConnectLogger,
  ConnectLoggerFromContextParams,
  ConnectLoggerParams,
  LogProvider,
} from "../logging";
import {
  ConnectMetricRecorder,
  ConnectMetricRecorderFromContextParams,
  MetricProvider,
} from "../metric";
import { AmazonConnectProvider } from "../provider";
import { createModuleProxy, ModuleProxy, Proxy } from "../proxy";
import { Context, ModuleContext } from "./";

const mockContext = mock<Context>();
const mockProvider = mock<AmazonConnectProvider>();

const testNamespace = "testNamespace";

jest.mock("../logging/connect-logger");
jest.mock("../metric/connect-metric-recorder");
jest.mock("../proxy/module-proxy-factory");

let sut: ModuleContext;

beforeEach(jest.resetAllMocks);

beforeEach(() => {
  mockContext.getProvider.mockReturnValue(mockProvider);

  sut = new ModuleContext(mockContext, testNamespace);
});

describe("proxy", () => {
  const mockProxy = mock<Proxy>();
  const mockModuleProxy = mock<ModuleProxy>();

  beforeEach(() => {
    mockProvider.getProxy.mockReturnValue(mockProxy);
  });

  test("should return ModuleProxy", () => {
    mocked(createModuleProxy).mockReturnValue(mockModuleProxy);

    const result = sut.proxy;

    expect(result).toEqual(mockModuleProxy);
    expect(createModuleProxy).toHaveBeenCalledWith(mockProxy, testNamespace);
  });

  test("should use same module proxy instance", () => {
    mocked(createModuleProxy)
      .mockReturnValueOnce(mockModuleProxy)
      .mockReturnValue(mock<ModuleProxy>());

    const call1 = sut.proxy;
    const call2 = sut.proxy;

    expect(call1).toBe(call2);
    expect(createModuleProxy).toHaveBeenCalledTimes(1);
  });
});

describe("getProvider", () => {
  test("should return provider", () => {
    const result = sut.getProvider();

    expect(result).toEqual(mockProvider);
  });
});

describe("createLogger", () => {
  describe("when params is an object", () => {
    test("should return connect logger", () => {
      const testSource = "testSource";
      const params: ConnectLoggerFromContextParams = {
        source: testSource,
        mixin: jest.fn(),
      };

      const result = sut.createLogger(params);

      expect(result).toBeInstanceOf(ConnectLogger);
      expect(ConnectLogger).toHaveBeenCalledTimes(1);
      expect(ConnectLogger).toHaveBeenCalledWith(
        expect.objectContaining(params),
      );
      const loggerParams = mocked(ConnectLogger).mock
        .calls[0][0] as ConnectLoggerParams;
      const loggerProvider = (loggerParams.provider as () => LogProvider)();
      expect(loggerProvider).toEqual(mockProvider);
    });
  });

  describe("when params is a source string", () => {
    test("should return connect logger", () => {
      const testSource = "testSource";

      const result = sut.createLogger(testSource);

      expect(result).toBeInstanceOf(ConnectLogger);
      expect(ConnectLogger).toHaveBeenCalledTimes(1);
      expect(ConnectLogger).toHaveBeenCalledWith(
        expect.objectContaining({ source: testSource }),
      );
      const loggerParams = mocked(ConnectLogger).mock
        .calls[0][0] as ConnectLoggerParams;
      const loggerProvider = (loggerParams.provider as () => LogProvider)();
      expect(loggerProvider).toEqual(mockProvider);
    });
  });
});

describe("createMetricRecorder", () => {
  describe("when params is an object", () => {
    test("should return connect logger", () => {
      const testNamespace = "testNamespace";
      const params: ConnectMetricRecorderFromContextParams = {
        namespace: testNamespace,
      };

      const result = sut.createMetricRecorder(params);

      expect(result).toBeInstanceOf(ConnectMetricRecorder);
      expect(ConnectMetricRecorder).toHaveBeenCalledTimes(1);
      expect(ConnectMetricRecorder).toHaveBeenCalledWith(
        expect.objectContaining(params),
      );
      const recorderParams = mocked(ConnectMetricRecorder).mock.calls[0][0];
      const metricProvider = (
        recorderParams.provider as () => MetricProvider
      )();
      expect(metricProvider).toEqual(mockProvider);
    });
  });

  describe("when params is a source string", () => {
    test("should return connect logger", () => {
      const testNamespace = "testNamespace";

      const result = sut.createMetricRecorder(testNamespace);

      expect(result).toBeInstanceOf(ConnectMetricRecorder);
      expect(ConnectMetricRecorder).toHaveBeenCalledTimes(1);
      expect(ConnectMetricRecorder).toHaveBeenCalledWith(
        expect.objectContaining({ namespace: testNamespace }),
      );
      const recorderParams = mocked(ConnectMetricRecorder).mock.calls[0][0];
      const metricProvider = (
        recorderParams.provider as () => MetricProvider
      )();
      expect(metricProvider).toEqual(mockProvider);
    });
  });
});
