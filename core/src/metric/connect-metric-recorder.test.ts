/* eslint-disable @typescript-eslint/unbound-method */
import { UpstreamMessageOrigin } from "../messaging";
import * as globalProvider from "../provider";
import { AmazonConnectProvider } from "../provider";
import { Proxy } from "../proxy";
import { ConnectMetricRecorder } from "./connect-metric-recorder";
import * as metricHelper from "./metric-helpers";
import { ProxyMetricData } from "./proxy-metric-data";

jest.mock("../provider/global-provider");
jest.mock("../proxy/proxy");
jest.mock("./metric-helpers");
jest.mock("../utility/id-generator");

class TestProxy extends Proxy {
  constructor(provider: AmazonConnectProvider) {
    super(provider);
  }

  protected initProxy(): void {
    throw new Error("Method not implemented.");
  }
  protected sendMessageToSubject(): void {
    throw new Error("Method not implemented.");
  }
  protected addContextToLogger(): Record<string, unknown> {
    throw new Error("Method not implemented.");
  }
  public get proxyType(): string {
    throw new Error("Method not implemented.");
  }
  protected getUpstreamMessageOrigin(): UpstreamMessageOrigin {
    throw new Error("Method not implemented.");
  }
}

const testSource = "test-metric-recorder";
const testMetricName = "dummy-metric-name";
const testDimensions = { name1: "value1", name2: "value2" };
const testProcessedDimensions = {
  name1: "value1",
  name2: "value2",
  Metric: "Error",
};
const testTimeStamp = "2024-01-01";

let provider: AmazonConnectProvider;
let proxyMetricSpy: jest.SpyInstance<void, [ProxyMetricData]>;

const proxyFactory = (p: AmazonConnectProvider) => {
  const proxy = new TestProxy(p);
  proxyMetricSpy = jest.spyOn(proxy, "sendMetric");
  return proxy;
};

beforeEach(() => {
  jest.resetAllMocks();
  jest.useFakeTimers().setSystemTime(new Date(testTimeStamp));
  provider = new AmazonConnectProvider({
    config: {},
    proxyFactory,
  });
});

describe("When ConnectMetricRecorder is created with namespace only", () => {
  beforeEach(() => {
    jest.spyOn(globalProvider, "getGlobalProvider").mockReturnValue(provider);
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

    expect(mockRecordCount).toBeCalledWith(testMetricName, 0, {
      dimensions: testProcessedDimensions,
      optionalDimensions: testDimensions,
    });
    expect(metricHelper.checkDimensionLength).toBeCalledWith(
      testProcessedDimensions,
      testDimensions,
    );
    expect(proxyMetricSpy).toHaveBeenCalledWith({
      metricData: testMetricData,
      time: new Date(testTimeStamp),
      namespace: testSource,
    });
  });

  test("should record success metric, without dimensions param", () => {
    const defaultDimension = { Metric: "Error" };
    const testMetricData = {
      metricName: testMetricName,
      unit: "Count",
      value: 0,
      dimensions: { Metric: "Error" },
      optionalDimensions: undefined,
    };
    const sut = new ConnectMetricRecorder({ namespace: testSource });
    const mockRecordCount = jest.spyOn(sut, "recordCount");

    sut.recordSuccess(testMetricName);

    expect(mockRecordCount).toBeCalledWith(testMetricName, 0, {
      dimensions: defaultDimension,
      optionalDimensions: undefined,
    });
    expect(metricHelper.checkDimensionLength).toBeCalledWith(
      defaultDimension,
      undefined,
    );
    expect(proxyMetricSpy).toHaveBeenCalledWith({
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

    expect(mockRecordCount).toBeCalledWith(testMetricName, 1, {
      dimensions: testProcessedDimensions,
      optionalDimensions: testDimensions,
    });
    expect(metricHelper.checkDimensionLength).toBeCalledWith(
      testProcessedDimensions,
      testDimensions,
    );
    expect(proxyMetricSpy).toHaveBeenCalledWith({
      metricData: testMetricData,
      time: new Date(testTimeStamp),
      namespace: testSource,
    });
  });

  test("should record error metric, without dimensions param", () => {
    const defaultDimension = { Metric: "Error" };
    const testMetricData = {
      metricName: testMetricName,
      unit: "Count",
      value: 1,
      dimensions: { Metric: "Error" },
      optionalDimensions: undefined,
    };
    const sut = new ConnectMetricRecorder({ namespace: testSource });
    const mockRecordCount = jest.spyOn(sut, "recordCount");

    sut.recordError(testMetricName);

    expect(mockRecordCount).toBeCalledWith(testMetricName, 1, {
      dimensions: defaultDimension,
      optionalDimensions: undefined,
    });
    expect(metricHelper.checkDimensionLength).toBeCalledWith(
      defaultDimension,
      undefined,
    );
    expect(proxyMetricSpy).toHaveBeenCalledWith({
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

    expect(metricHelper.checkDimensionLength).toBeCalledWith(
      testDimensions,
      testDimensions,
    );
    expect(proxyMetricSpy).toHaveBeenCalledWith({
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
    expect(proxyMetricSpy).toHaveBeenCalledWith({
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

    expect(proxyMetricSpy).toHaveBeenCalledWith({
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
    const sut = new ConnectMetricRecorder({ namespace: testSource, provider });

    sut.recordCount(testMetricName, 1, {
      dimensions: testDimensions,
      optionalDimensions: testDimensions,
    });

    expect(metricHelper.checkDimensionLength).toBeCalledWith(
      testDimensions,
      testDimensions,
    );
    expect(proxyMetricSpy).toHaveBeenCalledWith({
      metricData: testMetricData,
      time: new Date(testTimeStamp),
      namespace: testSource,
    });
  });
  test("should start duration counter and send duration metric when stopDurationCounter is called", () => {
    const sut = new ConnectMetricRecorder({ namespace: testSource, provider });
    const durationMetricRecorder = sut.startDurationCounter(testMetricName, {
      dimensions: testDimensions,
      optionalDimensions: testDimensions,
    });
    durationMetricRecorder.stopDurationCounter();

    expect(proxyMetricSpy).toHaveBeenCalledWith({
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
      provider: () => provider,
    });

    sut.recordCount(testMetricName, 1, {
      dimensions: testDimensions,
      optionalDimensions: testDimensions,
    });

    expect(metricHelper.checkDimensionLength).toBeCalledWith(
      testDimensions,
      testDimensions,
    );
    expect(proxyMetricSpy).toHaveBeenCalledWith({
      metricData: testMetricData,
      time: new Date(testTimeStamp),
      namespace: testSource,
    });
  });
  test("should start duration counter and send duration metric when stopDurationCounter is called", () => {
    const sut = new ConnectMetricRecorder({
      namespace: testSource,
      provider: () => provider,
    });
    const durationMetricRecorder = sut.startDurationCounter(testMetricName, {
      dimensions: testDimensions,
      optionalDimensions: testDimensions,
    });
    durationMetricRecorder.stopDurationCounter();

    expect(proxyMetricSpy).toHaveBeenCalledWith({
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
