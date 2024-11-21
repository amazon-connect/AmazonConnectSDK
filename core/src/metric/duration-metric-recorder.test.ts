import { DurationMetricRecorder } from "./duration-metric-recorder";

const mockAction = jest.fn();
const testMetricName = "dummy-metric-name";
const testDimensions = { name1: "value1", name2: "value2" };

jest.useFakeTimers();

beforeEach(jest.resetAllMocks);

describe("stopDurationCounter", () => {
  beforeEach(() => {
    const currentTime = 1500;
    jest.setSystemTime(currentTime);
  });

  test("should call sendMetric, when dimension and optionalDimensions are set", () => {
    const sut = new DurationMetricRecorder({
      sendMetric: mockAction,
      metricName: testMetricName,
      metricOptions: {
        dimensions: testDimensions,
        optionalDimensions: testDimensions,
      },
    });
    jest.advanceTimersByTime(100);

    sut.stopDurationCounter();

    expect(mockAction).toHaveBeenCalledWith({
      metricName: testMetricName,
      unit: "Milliseconds",
      value: 100,
      dimensions: testDimensions,
      optionalDimensions: testDimensions,
    });
  });

  test("should call sendMetric, when dimension and optionalDimensions are not set", () => {
    const sut = new DurationMetricRecorder({
      sendMetric: mockAction,
      metricName: testMetricName,
    });
    jest.advanceTimersByTime(100);

    sut.stopDurationCounter();

    expect(mockAction).toHaveBeenCalledWith({
      metricName: testMetricName,
      unit: "Milliseconds",
      value: 100,
      dimensions: {},
      optionalDimensions: {},
    });
  });
});
