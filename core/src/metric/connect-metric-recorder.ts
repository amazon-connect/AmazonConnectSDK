import { getGlobalProvider } from "../provider";
import { DurationMetricRecorder } from "./duration-metric-recorder";
import { checkDimensionLength } from "./metric-helpers";
import { MetricProvider } from "./metric-provider";
import { MetricProxy } from "./metric-proxy";
import {
  ConnectRecorderMetricParams,
  MetricData,
  MetricOptions,
} from "./metric-types";

/**
 * @classdesc ConnectMetricRecorder class provides APIs to emit metrics based on users' need
 */
export class ConnectMetricRecorder {
  private readonly namespace: string;
  private provider: MetricProvider | undefined;
  private readonly providerFactory: (() => MetricProvider) | undefined;
  private _proxy: MetricProxy | null;

  /**
   * Constructor for ConnectMetricRecorder
   * @param {ConnectRecorderMetricParams} params - The namespace and provider(optional)
   */
  constructor(params: ConnectRecorderMetricParams) {
    this._proxy = null;
    this.namespace = params.namespace;

    if (params.provider && typeof params.provider === "function")
      this.providerFactory = params.provider;
    else this.provider = params.provider;
  }

  /**
   * Emit a metric that counts success
   * @param {string} metricName - The name of the metric
   * @param {Record<string, string>} dimensions - The dimensions of a metric with keys and values (optional)
   * @param {Record<string, string>} optionalDimensions - The optional dimensions of a metric with keys and values (optional)
   */
  recordSuccess(metricName: string, metricOptions?: MetricOptions): void {
    const processedDimensions: Record<string, string> = {
      ...(metricOptions?.dimensions ?? {}),
    };

    const processedMetricOptions = {
      ...metricOptions,
      dimensions: processedDimensions,
    };

    this.recordCount(metricName, 0, processedMetricOptions);
  }

  /**
   * Emit a metric that counts error. Add default dimension { name: "Metric", value: "Error" } to the metric if not added
   * @param {string} metricName - The name of the metric
   * @param {Record<string, string>} dimensions - The dimensions of a metric with keys and values (optional)
   * @param {Record<string, string>} optionalDimensions - The optional dimensions of a metric with keys and values (optional)
   */
  recordError(metricName: string, metricOptions?: MetricOptions): void {
    const processedDimensions: Record<string, string> = {
      ...(metricOptions?.dimensions ?? {}),
    };

    const processedMetricOptions = {
      ...metricOptions,
      dimensions: processedDimensions,
    };

    this.recordCount(metricName, 1, processedMetricOptions);
  }

  /**
   * Emit a counting metric
   * @param {string} metricName - The name of the metric
   * @param {number} count - The count of the metric
   * @param {Record<string, string>} dimensions - The dimensions of a metric with keys and values (optional)
   * @param {Record<string, string>} optionalDimensions - The optional dimensions of a metric with keys and values (optional)
   */
  recordCount(
    metricName: string,
    count: number,
    metricOptions?: MetricOptions,
  ): void {
    this.sendMetric({
      metricName,
      unit: "Count",
      value: count,
      dimensions: metricOptions?.dimensions,
      optionalDimensions: metricOptions?.optionalDimensions,
    });
  }

  /**
   * Start a duration metric
   * @param {string} metricName - The name of the metric
   * @param {Record<string, string>} dimensions - The dimensions of a metric with keys and values (optional)
   * @param {Record<string, string>} optionalDimensions - The optional dimensions of a metric with keys and values (optional)
   * @returns {DurationMetricRecorder} - The DurationMetricRecorder object being created
   */
  startDurationCounter(
    metricName: string,
    metricOptions?: MetricOptions,
  ): DurationMetricRecorder {
    return new DurationMetricRecorder({
      sendMetric: this.sendMetric.bind(this),
      metricName,
      metricOptions,
    });
  }

  /**
   * Emit metric
   * @param {string} metricName - The name of the metric
   * @param {unit} unit - The unit of the metric
   * @param {number} value - The value of the metric
   * @param {Record<string, string>} dimensions - The dimensions of a metric with keys and values (optional)
   * @param {Record<string, string>} optionalDimensions - The optional dimensions of a metric with keys and values (optional)
   */
  private sendMetric({
    metricName,
    unit,
    value,
    dimensions,
    optionalDimensions,
  }: MetricData) {
    if (dimensions) {
      checkDimensionLength(dimensions, optionalDimensions);
    }

    const metricData = {
      metricName,
      unit,
      value,
      dimensions,
      optionalDimensions,
    };

    const time = new Date();
    this.getProxy().sendMetric({
      metricData,
      time,
      namespace: this.namespace,
    });
  }

  /**
   * Get the provider of the ConnectMetricRecorder instance
   */
  private getProvider(): MetricProvider {
    if (!this.provider) {
      this.provider = this.providerFactory
        ? this.providerFactory()
        : getGlobalProvider();
    }

    return this.provider;
  }

  /**
   * Get the proxy of the ConnectMetricRecorder instance
   */
  private getProxy(): MetricProxy {
    if (!this._proxy) {
      this._proxy = this.getProvider().getProxy();
    }

    return this._proxy;
  }
}
