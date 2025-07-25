import {
  AppConfig,
  AppParameters,
  AppScope,
  ContactScope,
  LaunchSource,
} from "@amazon-connect/workspace-types";
import { mock } from "jest-mock-extended";

import { AmazonConnectApp } from "./amazon-connect-app";
import { AppContext } from "./app-context";

describe("AppContext", () => {
  test("constructor should set all properties correctly", () => {
    const mockProvider = mock<AmazonConnectApp>();
    const mockConfig = mock<AppConfig>();
    const mockParameters = mock<AppParameters>();
    const mockContactScope = mock<ContactScope>();
    const mockScope = mock<AppScope>();
    const launchedBy = mock<LaunchSource>();

    const instanceId = "test-instance-id";

    const params = {
      provider: mockProvider,
      instanceId,
      config: mockConfig,
      parameters: mockParameters,
      contactScope: mockContactScope,
      scope: mockScope,
      launchedBy,
    };

    const context = new AppContext(params);

    expect(context.appInstanceId).toBe(instanceId);
    expect(context.instanceId).toBe(instanceId);
    expect(context.config).toBe(mockConfig);
    expect(context.appConfig).toBe(mockConfig);
    expect(context.parameters).toBe(mockParameters);
    expect(context.contactScope).toBe(mockContactScope);
    expect(context.scope).toBe(mockScope);
    expect(context.launchedBy).toBe(launchedBy);
  });

  test("constructor should handle undefined optional parameters", () => {
    const mockProvider = mock<AmazonConnectApp>();
    const mockConfig = mock<AppConfig>();
    const instanceId = "test-instance-id";

    const params = {
      provider: mockProvider,
      instanceId,
      config: mockConfig,
      parameters: undefined,
      contactScope: undefined,
      scope: undefined,
      launchSource: undefined,
    };

    const context = new AppContext(params);

    expect(context.appInstanceId).toBe(instanceId);
    expect(context.instanceId).toBe(instanceId);
    expect(context.config).toBe(mockConfig);
    expect(context.appConfig).toBe(mockConfig);
    expect(context.parameters).toBeUndefined();
    expect(context.contactScope).toBeUndefined();
    expect(context.scope).toBeUndefined();
    expect(context.launchedBy).toEqual({ type: "unknown" });
  });
});
