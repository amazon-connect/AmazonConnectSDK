import {
  AmazonConnectNamespace,
  AmazonConnectProvider,
} from "@amazon-connect/core";

import { ExtensibilityManager } from "./extensibility-manager";
import { getExtensibilityManager } from "./get-extensibility-manager";

jest.mock("./extensibility-manager");

beforeEach(jest.resetAllMocks);

describe("getExtensibilityManager", () => {
  let mockNamespace: AmazonConnectNamespace;
  let mockProvider: AmazonConnectProvider;

  beforeEach(() => {
    mockNamespace = "test-namespace" as AmazonConnectNamespace;
    mockProvider = {
      id: "test-provider-id",
    } as AmazonConnectProvider;
  });

  test("should create and return a new ExtensibilityManager when none exists", () => {
    const manager = getExtensibilityManager(mockNamespace, mockProvider);
    expect(manager).toBeInstanceOf(ExtensibilityManager);
    expect(manager).toBeDefined();
  });

  test("should return the same manager instance for the same namespace and provider", () => {
    const firstManager = getExtensibilityManager(mockNamespace, mockProvider);
    const secondManager = getExtensibilityManager(
      mockNamespace,
      mockProvider,
    );
    expect(firstManager).toBe(secondManager);
  });

  test("should create different managers for different namespaces", () => {
    const manager1 = getExtensibilityManager(mockNamespace, mockProvider);
    const manager2 = getExtensibilityManager(
      "other-namespace" as AmazonConnectNamespace,
      mockProvider,
    );

    expect(manager1).not.toBe(manager2);
  });

  test("should create different managers for different provider IDs", () => {
    const manager1 = getExtensibilityManager(mockNamespace, mockProvider);
    const manager2 = getExtensibilityManager(mockNamespace, {
      ...mockProvider,
      id: "different-provider-id",
    });

    expect(manager1).not.toBe(manager2);
  });
});
