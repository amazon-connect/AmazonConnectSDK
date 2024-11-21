import { mock } from "jest-mock-extended";

import { MetricMessage, UpstreamMessageOrigin } from "..";
import {
  checkDimensionLength,
  createMetricMessage,
  MAX_METRIC_DIMENSIONS,
} from "./metric-helpers";
import { MetricData } from "./metric-types";

jest.mock("..");

const testMetricName = "dummy-metric-name";
const testDimensions = { name1: "value1", name2: "value2" };
const testTimeStamp = new Date("2024-01-01");
const testSource = "test-metric-recorder";
const mockMessageOrigin = mock<UpstreamMessageOrigin>();

beforeEach(() => jest.resetAllMocks());

describe("checkDimensionlength", () => {
  test("should throw error if the sum of dimensions and optional dimensions is exceeding MAX_METRIC_DIMENSIONS", () => {
    const invalidDimension: Record<string, string> = {};
    for (let i = 0; i < MAX_METRIC_DIMENSIONS + 1; i++) {
      invalidDimension[`${i}`] = `${i}`;
    }
    expect(() => {
      checkDimensionLength(invalidDimension);
    }).toThrowError("Cannot add more than 30 dimensions to a metric");
  });

  test("should not throw error if the sum of dimensions and optional dimensions is under MAX_METRIC_DIMENSIONS", () => {
    const validDimension: Record<string, string> = {};
    for (let i = 0; i < MAX_METRIC_DIMENSIONS; i++) {
      validDimension[`${i}`] = `${i}`;
    }
    expect(() => {
      checkDimensionLength(validDimension);
    }).not.toThrowError("Cannot add more than 30 dimensions to a metric");
  });
});

describe("createMetricMessage", () => {
  test("should transform message from ProxyMetricData type into MetricMessage type, when dimensions and optionalDimensions are defined", () => {
    const testMetricData: MetricData = {
      metricName: testMetricName,
      unit: "Count",
      value: 0,
      dimensions: testDimensions,
      optionalDimensions: testDimensions,
    };
    const resultMetricMessage: MetricMessage = {
      type: "metric",
      namespace: testSource,
      metricName: testMetricName,
      unit: "Count",
      value: 0,
      time: testTimeStamp,
      dimensions: testDimensions,
      optionalDimensions: testDimensions,
      messageOrigin: mockMessageOrigin,
    };
    const message = createMetricMessage(
      {
        metricData: testMetricData,
        time: testTimeStamp,
        namespace: testSource,
      },
      mockMessageOrigin,
    );

    expect(message).toEqual(resultMetricMessage);
  });
  test("should transform message from ProxyMetricData type into MetricMessage type, when dimensions and optionalDimensions are NOT defined", () => {
    const testMetricData: MetricData = {
      metricName: testMetricName,
      unit: "Count",
      value: 0,
    };
    const resultMetricMessage: MetricMessage = {
      type: "metric",
      metricName: testMetricName,
      unit: "Count",
      value: 0,
      time: testTimeStamp,
      namespace: testSource,
      dimensions: {},
      optionalDimensions: {},
      messageOrigin: mockMessageOrigin,
    };
    const message = createMetricMessage(
      {
        metricData: testMetricData,
        time: testTimeStamp,
        namespace: testSource,
      },
      mockMessageOrigin,
    );

    expect(message).toEqual(resultMetricMessage);
  });
});
