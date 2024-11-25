import { MetricData, MetricOptions, Unit } from "./metric-types";

/**
 * @classdesc DurationMetricRecorder class provides APIs to emit duration metrics based on users' need
 */
export class DurationMetricRecorder {
  private readonly sendMetric: (metric: MetricData) => void;
  private readonly startTime: number;
  private readonly metricName: string;
  private readonly unit: Unit = "Milliseconds";
  private readonly dimensions: Record<string, string>;
  private readonly optionalDimensions: Record<string, string>;

  /**
   * Constructor for DurationMetricRecorder
   * @param {(metric: MetricData) => void} sendMetric- The method that sends metric
   * @param {string} metricName - The name of the duration metric
   * @param {Record<string, string>} dimensions - The dimensions of the duration metric with keys and values (optional)
   * @param {Record<string, string>} optionalDimensions - The optional dimensions of the duration metric with keys and values (optional)
   */
  constructor({
    sendMetric,
    metricName,
    metricOptions,
  }: {
    sendMetric: (metric: MetricData) => void;
    metricName: string;
    metricOptions?: MetricOptions;
  }) {
    this.sendMetric = sendMetric;
    this.startTime = performance.now();
    this.metricName = metricName;
    this.dimensions = metricOptions?.dimensions ? metricOptions.dimensions : {};
    this.optionalDimensions = metricOptions?.optionalDimensions
      ? metricOptions.optionalDimensions
      : {};
  }

  /**
   * Stop recording of the duration metric and emit it
   * @returns {durationCount: number} - The duration being recorded
   */
  stopDurationCounter(): { duration: number } {
    const durationResult = Math.round(performance.now() - this.startTime);
    this.sendMetric({
      metricName: this.metricName,
      unit: this.unit,
      value: durationResult,
      dimensions: this.dimensions,
      optionalDimensions: this.optionalDimensions,
    });
    return { duration: durationResult };
  }
}
