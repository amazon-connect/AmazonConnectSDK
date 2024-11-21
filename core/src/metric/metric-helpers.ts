import { MetricMessage, UpstreamMessageOrigin } from "../messaging";
import { ProxyMetricData } from "./proxy-metric-data";

export const MAX_METRIC_DIMENSIONS = 30;

/**
 * Check if the the sum of the length of dimensions and optional dimentions is exceeding maximum dimension length acceptable by back-end
 * @param {Record<string, string>} dimensions - The dimensions of the duration metric with keys and values
 * @param {Record<string, string>} optionalDimensions -The optional dimensions of the duration metric with keys and values
 */
export function checkDimensionLength(
  dimensions: Record<string, string>,
  optionalDimensions?: Record<string, string>,
): void {
  if (
    Object.keys(dimensions).length +
      Object.keys(optionalDimensions ?? {}).length >
    MAX_METRIC_DIMENSIONS
  ) {
    throw new Error("Cannot add more than 30 dimensions to a metric");
  }
}

/**
 * Transform the metric message into the format acceptable by back-end
 * @param {MetricData} metricData - The metric data
 * @param {string} timestamp - The timestamp of the metric
 * @param {string} namespace - The namespace of the metric
 * @param {UpstreamMessageOrigin} messageOrigin - The origin of the metric message
 * @return {MetricMessage} - Return a MetricMessage object
 */
export function createMetricMessage(
  { metricData, time, namespace }: ProxyMetricData,
  messageOrigin: UpstreamMessageOrigin,
): MetricMessage {
  return {
    type: "metric",
    namespace: namespace,
    metricName: metricData.metricName,
    unit: metricData.unit,
    value: metricData.value,
    time: time,
    dimensions: metricData.dimensions ?? {},
    optionalDimensions: metricData.optionalDimensions ?? {},
    messageOrigin,
  };
}
