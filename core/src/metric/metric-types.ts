import { MetricProvider } from "./metric-provider";

export type ConnectRecorderMetricParams = {
  namespace: string;
  provider?: MetricProvider | (() => MetricProvider);
};

export type MetricData = {
  metricName: string;
  unit: Unit;
  value: number;
  dimensions?: Record<string, string>;
  optionalDimensions?: Record<string, string>;
};

export type Unit = "Count" | "Milliseconds";

export type MetricOptions = {
  dimensions?: Record<string, string>;
  optionalDimensions?: Record<string, string>;
};
