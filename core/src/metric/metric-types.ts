import { MetricProvider } from "./metric-provider";

type BaseMetricRecorderParams = {
  namespace: string;
};

export type ConnectMetricRecorderFromContextParams =
  | string
  | BaseMetricRecorderParams;

export type ConnectRecorderMetricParams = BaseMetricRecorderParams & {
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
