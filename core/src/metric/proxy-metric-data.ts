import { MetricData } from "./metric-types";

export type ProxyMetricData = {
  metricData: MetricData;
  time: Date;
  namespace: string;
};
