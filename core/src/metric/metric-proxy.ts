import { ProxyMetricData } from "./proxy-metric-data";

export interface MetricProxy {
  sendMetric({ metricData, time, namespace }: ProxyMetricData): void;
}
