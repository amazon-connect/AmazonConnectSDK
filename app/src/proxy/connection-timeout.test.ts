import { AmazonConnectAppConfig } from "../config";
import {
  defaultValue,
  getConnectionTimeout,
  maxValue,
  minValue,
} from "./connection-timeout";

describe("getConnectionTimeout", () => {
  test("should use default value when workspace not set in config", () => {
    const config: AmazonConnectAppConfig = {} as AmazonConnectAppConfig;

    const result = getConnectionTimeout(config);

    expect(result).toEqual(defaultValue);
  });

  test("should use default value when workspace connectionTimeout set in config", () => {
    const config: AmazonConnectAppConfig = {
      workspace: {},
    } as AmazonConnectAppConfig;

    const result = getConnectionTimeout(config);

    expect(result).toEqual(defaultValue);
  });

  test("should accept config override of default", () => {
    const config: AmazonConnectAppConfig = {
      workspace: { connectionTimeout: 11001 },
    } as AmazonConnectAppConfig;

    const result = getConnectionTimeout(config);

    expect(result).toEqual(11001);
  });

  test("should enforce minimum value when value is less than that in config", () => {
    const value = minValue - 1000;
    const config: AmazonConnectAppConfig = {
      workspace: { connectionTimeout: value },
    } as AmazonConnectAppConfig;

    const result = getConnectionTimeout(config);

    expect(result).toEqual(minValue);
  });

  test("should enforce maximum value when value is less than that in config", () => {
    const value = maxValue + 1000;
    const config: AmazonConnectAppConfig = {
      workspace: { connectionTimeout: value },
    } as AmazonConnectAppConfig;

    const result = getConnectionTimeout(config);

    expect(result).toEqual(maxValue);
  });
});
