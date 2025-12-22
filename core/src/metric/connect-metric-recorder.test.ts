import { mock } from "jest-mock-extended";

import * as globalProvider from "../provider";
import { AmazonConnectProvider } from "../provider";
import { Proxy } from "../proxy";
import { ConnectMetricRecorder } from "./connect-metric-recorder";
import * as metricHelper from "./metric-helpers";

jest.mock("../provider/global-provider");
jest.mock("../proxy/proxy");
jest.mock("./metric-helpers");
jest.mock("../utility/id-generator");

const testSource = "test-metric-recorder";
const testMetricName = "dummy-metric-name";
const testDimensions = { name1: "value1", name2: "value2" };
const testProcessedDimensions = {
  name1: "value1",
  name2: "value2",
};
const testTimeStamp = "2024-01-01";

const proxyMock = mock<Proxy>();
const providerMock = mock<AmazonConnectProvider>({
  getProxy: () => proxyMock,
});

beforeEach(() => {
  jest.resetAllMocks();
  jest.useFakeTimers().setSystemTime(new Date(testTimeStamp));
});

describe("When ConnectMetricRecorder is created with namespace only", () => {
  beforeEach(() => {
    jest
      .spyOn(globalProvider, "getGlobalProvider")
      .mockReturnValue(providerMock);
  });

  test("should record success metric, with dimensions param", () => {
    const testMetricData = {
      metricName: testMetricName,
      unit: "Count",
      value: 0,
      dimensions: testProcessedDimensions,
      optionalDimensions: testDimensions,
    };
    const sut = new ConnectMetricRecorder({ namespace: testSource });
    const mockRecordCount = jest.spyOn(sut, "recordCount");

    sut.recordSuccess(testMetricName, {
      dimensions: testDimensions,
      optionalDimensions: testDimensions,
    });

    expect(mockRecordCount).toHaveBeenCalledWith(testMetricName, 0, {
      dimensions: testProcessedDimensions,
      optionalDimensions: testDimensions,
    });
    expect(metricHelper.checkDimensionLength).toHaveBeenCalledWith(
      testProcessedDimensions,
      testDimensions,
    );
    expect(proxyMock.sendMetric).toHaveBeenCalledWith({
      metricData: testMetricData,
      time: new Date(testTimeStamp),
      namespace: testSource,
    });
  });

  test("should record success metric, without dimensions param", () => {
    const defaultDimension = {};
    const testMetricData = {
      metricName: testMetricName,
      unit: "Count",
      value: 0,
      dimensions: {},
      optionalDimensions: undefined,
    };
    const sut = new ConnectMetricRecorder({ namespace: testSource });
    const mockRecordCount = jest.spyOn(sut, "recordCount");

    sut.recordSuccess(testMetricName);

    expect(mockRecordCount).toHaveBeenCalledWith(testMetricName, 0, {
      dimensions: defaultDimension,
      optionalDimensions: undefined,
    });
    expect(metricHelper.checkDimensionLength).toHaveBeenCalledWith(
      defaultDimension, 
      undefined,
    );
    expect(proxyMock.sendMetric).toHaveBeenCalledWith({
      metricData: testMetricData,
      time: new Date(testTimeStamp),
      namespace: testSource,
    });
  });

  test("should record error metric, with dimensions param", () => {
    const testMetricData = {
      metricName: testMetricName,
      unit: "Count",
      value: 1,
      dimensions: testProcessedDimensions,
      optionalDimensions: testDimensions,
    };
    const sut = new ConnectMetricRecorder({ namespace: testSource });
    const mockRecordCount = jest.spyOn(sut, "recordCount");

    sut.recordError(testMetricName, {
      dimensions: testDimensions,
      optionalDimensions: testDimensions,
    });

    expect(mockRecordCount).toHaveBeenCalledWith(testMetricName, 1, {
      dimensions: testProcessedDimensions,
      optionalDimensions: testDimensions,
    });
    expect(metricHelper.checkDimensionLength).toHaveBeenCalledWith(
      testProcessedDimensions,
      testDimensions,
    );
    expect(proxyMock.sendMetric).toHaveBeenCalledWith({
      metricData: testMetricData,
      time: new Date(testTimeStamp),
      namespace: testSource,
    });
  });

  test("should record error metric, without dimensions param", () => {
    const defaultDimension = {};
    const testMetricData = {
      metricName: testMetricName,
      unit: "Count",
      value: 1,
      dimensions: {},
      optionalDimensions: undefined,
    };
    const sut = new ConnectMetricRecorder({ namespace: testSource });
    const mockRecordCount = jest.spyOn(sut, "recordCount");

    sut.recordError(testMetricName);

    expect(mockRecordCount).toHaveBeenCalledWith(testMetricName, 1, {
      dimensions: defaultDimension,
      optionalDimensions: undefined,
    });
    expect(metricHelper.checkDimensionLength).toHaveBeenCalledWith(
      defaultDimension,
      undefined,
    );
    expect(proxyMock.sendMetric).toHaveBeenCalledWith({
      metricData: testMetricData,
      time: new Date(testTimeStamp),
      namespace: testSource,
    });
  });

  test("should record count metric, with dimensions param", () => {
    const testMetricData = {
      metricName: testMetricName,
      unit: "Count",
      value: 1,
      dimensions: testDimensions,
      optionalDimensions: testDimensions,
    };
    const sut = new ConnectMetricRecorder({ namespace: testSource });

    sut.recordCount(testMetricName, 1, {
      dimensions: testDimensions,
      optionalDimensions: testDimensions,
    });

    expect(metricHelper.checkDimensionLength).toHaveBeenCalledWith(
      testDimensions,
      testDimensions,
    );
    expect(proxyMock.sendMetric).toHaveBeenCalledWith({
      metricData: testMetricData,
      time: new Date(testTimeStamp),
      namespace: testSource,
    });
  });

  test("should record count metric, without dimensions param", () => {
    const testMetricData = {
      metricName: testMetricName,
      unit: "Count",
      value: 1,
      dimensions: undefined,
      optionalDimensions: undefined,
    };
    const sut = new ConnectMetricRecorder({ namespace: testSource });

    sut.recordCount(testMetricName, 1);

    expect(metricHelper.checkDimensionLength).not.toHaveBeenCalled();
    expect(proxyMock.sendMetric).toHaveBeenCalledWith({
      metricData: testMetricData,
      time: new Date(testTimeStamp),
      namespace: testSource,
    });
  });

  test("should start duration counter and send duration metric when stopDurationCounter is called", () => {
    const sut = new ConnectMetricRecorder({ namespace: testSource });
    const durationMetricRecorder = sut.startDurationCounter(testMetricName, {
      dimensions: testDimensions,
      optionalDimensions: testDimensions,
    });
    durationMetricRecorder.stopDurationCounter();

    expect(proxyMock.sendMetric).toHaveBeenCalledWith({
      metricData: {
        metricName: testMetricName,
        unit: "Milliseconds",
        value: expect.any(Number) as number,
        dimensions: testDimensions,
        optionalDimensions: testDimensions,
      },
      time: new Date(testTimeStamp),
      namespace: testSource,
    });
  });
});

describe("When ConnectMetricRecorder is created with default provider", () => {
  test("should record count metric", () => {
    const testMetricData = {
      metricName: testMetricName,
      unit: "Count",
      value: 1,
      dimensions: testDimensions,
      optionalDimensions: testDimensions,
    };
    const sut = new ConnectMetricRecorder({
      namespace: testSource,
      provider: providerMock,
    });

    sut.recordCount(testMetricName, 1, {
      dimensions: testDimensions,
      optionalDimensions: testDimensions,
    });

    expect(metricHelper.checkDimensionLength).toHaveBeenCalledWith(
      testDimensions,
      testDimensions,
    );
    expect(proxyMock.sendMetric).toHaveBeenCalledWith({
      metricData: testMetricData,
      time: new Date(testTimeStamp),
      namespace: testSource,
    });
  });
  test("should start duration counter and send duration metric when stopDurationCounter is called", () => {
    const sut = new ConnectMetricRecorder({
      namespace: testSource,
      provider: providerMock,
    });
    const durationMetricRecorder = sut.startDurationCounter(testMetricName, {
      dimensions: testDimensions,
      optionalDimensions: testDimensions,
    });
    durationMetricRecorder.stopDurationCounter();

    expect(proxyMock.sendMetric).toHaveBeenCalledWith({
      metricData: {
        metricName: testMetricName,
        unit: "Milliseconds",
        value: expect.any(Number) as number,
        dimensions: testDimensions,
        optionalDimensions: testDimensions,
      },
      time: new Date(testTimeStamp),
      namespace: testSource,
    });
  });
});

describe("When ConnectMetricRecorder is created with provider factory", () => {
  test("should record count metric", () => {
    const testMetricData = {
      metricName: testMetricName,
      unit: "Count",
      value: 1,
      dimensions: testDimensions,
      optionalDimensions: testDimensions,
    };
    const sut = new ConnectMetricRecorder({
      namespace: testSource,
      provider: () => providerMock,
    });

    sut.recordCount(testMetricName, 1, {
      dimensions: testDimensions,
      optionalDimensions: testDimensions,
    });

    expect(metricHelper.checkDimensionLength).toHaveBeenCalledWith(
      testDimensions,
      testDimensions,
    );
    expect(proxyMock.sendMetric).toHaveBeenCalledWith({
      metricData: testMetricData,
      time: new Date(testTimeStamp),
      namespace: testSource,
    });
  });
  test("should start duration counter and send duration metric when stopDurationCounter is called", () => {
    const sut = new ConnectMetricRecorder({
      namespace: testSource,
      provider: () => providerMock,
    });
    const durationMetricRecorder = sut.startDurationCounter(testMetricName, {
      dimensions: testDimensions,
      optionalDimensions: testDimensions,
    });
    durationMetricRecorder.stopDurationCounter();

    expect(proxyMock.sendMetric).toHaveBeenCalledWith({
      metricData: {
        metricName: testMetricName,
        unit: "Milliseconds",
        value: expect.any(Number) as number,
        dimensions: testDimensions,
        optionalDimensions: testDimensions,
      },
      time: new Date(testTimeStamp),
      namespace: testSource,
    });
  });
});

describe("When ConnectMetricRecorder is created with globalDimensions", () => {
  const globalDimensions = { global1: "globalValue1", global2: "globalValue2" };

  beforeEach(() => {
    jest
      .spyOn(globalProvider, "getGlobalProvider")
      .mockReturnValue(providerMock);
  });

  test("should merge globalDimensions with optionalDimensions when both are provided", () => {
    const optionalDimensions = { optional1: "optionalValue1" };
    const expectedMergedDimensions = {
      ...globalDimensions,
      ...optionalDimensions,
    };
    const testMetricData = {
      metricName: testMetricName,
      unit: "Count",
      value: 1,
      dimensions: testDimensions,
      optionalDimensions: expectedMergedDimensions,
    };
    const sut = new ConnectMetricRecorder({
      namespace: testSource,
      globalDimensions,
    });

    sut.recordCount(testMetricName, 1, {
      dimensions: testDimensions,
      optionalDimensions,
    });

    expect(metricHelper.checkDimensionLength).toHaveBeenCalledWith(
      testDimensions,
      expectedMergedDimensions,
    );
    expect(proxyMock.sendMetric).toHaveBeenCalledWith({
      metricData: testMetricData,
      time: new Date(testTimeStamp),
      namespace: testSource,
    });
  });

  test("should use only globalDimensions when optionalDimensions is not provided", () => {
    const testMetricData = {
      metricName: testMetricName,
      unit: "Count",
      value: 1,
      dimensions: testDimensions,
      optionalDimensions: globalDimensions,
    };
    const sut = new ConnectMetricRecorder({
      namespace: testSource,
      globalDimensions,
    });

    sut.recordCount(testMetricName, 1, {
      dimensions: testDimensions,
    });

    expect(metricHelper.checkDimensionLength).toHaveBeenCalledWith(
      testDimensions,
      globalDimensions,
    );
    expect(proxyMock.sendMetric).toHaveBeenCalledWith({
      metricData: testMetricData,
      time: new Date(testTimeStamp),
      namespace: testSource,
    });
  });

  test("should override globalDimensions with optionalDimensions when keys overlap", () => {
    const optionalDimensions = { global1: "overriddenValue", optional1: "optionalValue1" };
    const expectedMergedDimensions = {
      global1: "overriddenValue", // overridden
      global2: "globalValue2",    // from global
      optional1: "optionalValue1", // from optional
    };
    const testMetricData = {
      metricName: testMetricName,
      unit: "Count",
      value: 1,
      dimensions: testDimensions,
      optionalDimensions: expectedMergedDimensions,
    };
    const sut = new ConnectMetricRecorder({
      namespace: testSource,
      globalDimensions,
    });

    sut.recordCount(testMetricName, 1, {
      dimensions: testDimensions,
      optionalDimensions,
    });

    expect(metricHelper.checkDimensionLength).toHaveBeenCalledWith(
      testDimensions,
      expectedMergedDimensions,
    );
    expect(proxyMock.sendMetric).toHaveBeenCalledWith({
      metricData: testMetricData,
      time: new Date(testTimeStamp),
      namespace: testSource,
    });
  });

  test("should not include optionalDimensions when both globalDimensions and optionalDimensions are empty", () => {
    const testMetricData = {
      metricName: testMetricName,
      unit: "Count",
      value: 1,
      dimensions: testDimensions,
      optionalDimensions: undefined,
    };
    const sut = new ConnectMetricRecorder({
      namespace: testSource,
      globalDimensions: {},
    });

    sut.recordCount(testMetricName, 1, {
      dimensions: testDimensions,
      optionalDimensions: {},
    });

    expect(metricHelper.checkDimensionLength).toHaveBeenCalledWith(
      testDimensions,
      undefined,
    );
    expect(proxyMock.sendMetric).toHaveBeenCalledWith({
      metricData: testMetricData,
      time: new Date(testTimeStamp),
      namespace: testSource,
    });
  });
});

describe("When ConnectMetricRecorder is created with globalDimensionProvider", () => {
  const globalDimensions = { provider1: "providerValue1", provider2: "providerValue2" };
  let mockGlobalDimensionProvider: jest.Mock;

  beforeEach(() => {
    jest
      .spyOn(globalProvider, "getGlobalProvider")
      .mockReturnValue(providerMock);
    mockGlobalDimensionProvider = jest.fn(() => globalDimensions);
  });

  test("should call globalDimensionProvider and merge result with optionalDimensions", () => {
    const optionalDimensions = { optional1: "optionalValue1" };
    const expectedMergedDimensions = {
      ...globalDimensions,
      ...optionalDimensions,
    };
    const testMetricData = {
      metricName: testMetricName,
      unit: "Count",
      value: 1,
      dimensions: testDimensions,
      optionalDimensions: expectedMergedDimensions,
    };
    const sut = new ConnectMetricRecorder({
      namespace: testSource,
      globalDimensionProvider: mockGlobalDimensionProvider,
    });

    sut.recordCount(testMetricName, 1, {
      dimensions: testDimensions,
      optionalDimensions,
    });

    expect(mockGlobalDimensionProvider).toHaveBeenCalledTimes(1);
    expect(metricHelper.checkDimensionLength).toHaveBeenCalledWith(
      testDimensions,
      expectedMergedDimensions,
    );
    expect(proxyMock.sendMetric).toHaveBeenCalledWith({
      metricData: testMetricData,
      time: new Date(testTimeStamp),
      namespace: testSource,
    });
  });

  test("should call globalDimensionProvider on each metric emission", () => {
    const sut = new ConnectMetricRecorder({
      namespace: testSource,
      globalDimensionProvider: mockGlobalDimensionProvider,
    });

    sut.recordCount(testMetricName, 1, { dimensions: testDimensions });
    sut.recordCount(testMetricName, 2, { dimensions: testDimensions });
    sut.recordSuccess(testMetricName, { dimensions: testDimensions });

    expect(mockGlobalDimensionProvider).toHaveBeenCalledTimes(3);
  });

  test("should override globalDimensionProvider result with optionalDimensions when keys overlap", () => {
    const optionalDimensions = { provider1: "overriddenValue", optional1: "optionalValue1" };
    const expectedMergedDimensions = {
      provider1: "overriddenValue",  // overridden
      provider2: "providerValue2",   // from provider
      optional1: "optionalValue1",   // from optional
    };
    const testMetricData = {
      metricName: testMetricName,
      unit: "Count",
      value: 1,
      dimensions: testDimensions,
      optionalDimensions: expectedMergedDimensions,
    };
    const sut = new ConnectMetricRecorder({
      namespace: testSource,
      globalDimensionProvider: mockGlobalDimensionProvider,
    });

    sut.recordCount(testMetricName, 1, {
      dimensions: testDimensions,
      optionalDimensions,
    });

    expect(mockGlobalDimensionProvider).toHaveBeenCalledTimes(1);
    expect(metricHelper.checkDimensionLength).toHaveBeenCalledWith(
      testDimensions,
      expectedMergedDimensions,
    );
    expect(proxyMock.sendMetric).toHaveBeenCalledWith({
      metricData: testMetricData,
      time: new Date(testTimeStamp),
      namespace: testSource,
    });
  });

  test("should use only provider result when optionalDimensions is not provided", () => {
    const testMetricData = {
      metricName: testMetricName,
      unit: "Count",
      value: 1,
      dimensions: testDimensions,
      optionalDimensions: globalDimensions,
    };
    const sut = new ConnectMetricRecorder({
      namespace: testSource,
      globalDimensionProvider: mockGlobalDimensionProvider,
    });

    sut.recordCount(testMetricName, 1, {
      dimensions: testDimensions,
    });

    expect(mockGlobalDimensionProvider).toHaveBeenCalledTimes(1);
    expect(metricHelper.checkDimensionLength).toHaveBeenCalledWith(
      testDimensions,
      globalDimensions,
    );
    expect(proxyMock.sendMetric).toHaveBeenCalledWith({
      metricData: testMetricData,
      time: new Date(testTimeStamp),
      namespace: testSource,
    });
  });

  test("should handle empty result from globalDimensionProvider", () => {
    const emptyProvider = jest.fn(() => ({}));
    const optionalDimensions = { optional1: "optionalValue1" };
    const testMetricData = {
      metricName: testMetricName,
      unit: "Count",
      value: 1,
      dimensions: testDimensions,
      optionalDimensions,
    };
    const sut = new ConnectMetricRecorder({
      namespace: testSource,
      globalDimensionProvider: emptyProvider,
    });

    sut.recordCount(testMetricName, 1, {
      dimensions: testDimensions,
      optionalDimensions,
    });

    expect(emptyProvider).toHaveBeenCalledTimes(1);
    expect(metricHelper.checkDimensionLength).toHaveBeenCalledWith(
      testDimensions,
      optionalDimensions,
    );
    expect(proxyMock.sendMetric).toHaveBeenCalledWith({
      metricData: testMetricData,
      time: new Date(testTimeStamp),
      namespace: testSource,
    });
  });

  test("should not include optionalDimensions when provider returns empty and optionalDimensions is empty", () => {
    const emptyProvider = jest.fn(() => ({}));
    const testMetricData = {
      metricName: testMetricName,
      unit: "Count",
      value: 1,
      dimensions: testDimensions,
      optionalDimensions: undefined,
    };
    const sut = new ConnectMetricRecorder({
      namespace: testSource,
      globalDimensionProvider: emptyProvider,
    });

    sut.recordCount(testMetricName, 1, {
      dimensions: testDimensions,
      optionalDimensions: {},
    });

    expect(emptyProvider).toHaveBeenCalledTimes(1);
    expect(metricHelper.checkDimensionLength).toHaveBeenCalledWith(
      testDimensions,
      undefined,
    );
    expect(proxyMock.sendMetric).toHaveBeenCalledWith({
      metricData: testMetricData,
      time: new Date(testTimeStamp),
      namespace: testSource,
    });
  });
});

describe("When ConnectMetricRecorder is created with both globalDimensions and globalDimensionProvider", () => {
  const staticGlobalDimensions = { static1: "staticValue1" };
  const providerGlobalDimensions = { provider1: "providerValue1" };
  let mockGlobalDimensionProvider: jest.Mock;

  beforeEach(() => {
    jest
      .spyOn(globalProvider, "getGlobalProvider")
      .mockReturnValue(providerMock);
    mockGlobalDimensionProvider = jest.fn(() => providerGlobalDimensions);
  });

  test("should prefer globalDimensionProvider over globalDimensions", () => {
    const testMetricData = {
      metricName: testMetricName,
      unit: "Count",
      value: 1,
      dimensions: testDimensions,
      optionalDimensions: providerGlobalDimensions,
    };
    const sut = new ConnectMetricRecorder({
      namespace: testSource,
      globalDimensions: staticGlobalDimensions,
      globalDimensionProvider: mockGlobalDimensionProvider,
    });

    sut.recordCount(testMetricName, 1, {
      dimensions: testDimensions,
    });

    expect(mockGlobalDimensionProvider).toHaveBeenCalledTimes(1);
    expect(metricHelper.checkDimensionLength).toHaveBeenCalledWith(
      testDimensions,
      providerGlobalDimensions,
    );
    expect(proxyMock.sendMetric).toHaveBeenCalledWith({
      metricData: testMetricData,
      time: new Date(testTimeStamp),
      namespace: testSource,
    });
  });
});
