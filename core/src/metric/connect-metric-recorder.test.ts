/* eslint-disable @typescript-eslint/unbound-method */
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
