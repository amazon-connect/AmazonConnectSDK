import {
  AmazonConnectNamespace,
  AmazonConnectProvider,
} from "@amazon-connect/core";

import { getUIExtensibilityManager } from "./get-ui-extensibility-manager";
import { UIExtensibilityManager } from "./ui-extensibility-manager";

jest.mock("./ui-extensibility-manager");

describe("getUIExtensibilityManger", () => {
  let mockNamespace: AmazonConnectNamespace;
  let mockProvider: AmazonConnectProvider;

  beforeEach(() => {
    mockNamespace = "test-namespace" as AmazonConnectNamespace;
    mockProvider = {
      id: "test-provider-id",
    } as AmazonConnectProvider;
  });

  test("should create and return a new UIExtensibilityManager when none exists", () => {
    const manager = getUIExtensibilityManager(mockNamespace, mockProvider);
    expect(manager).toBeInstanceOf(UIExtensibilityManager);
    expect(manager).toBeDefined();
  });

  test("should return the same manager instance for the same namespace and provider", () => {
    const firstManager = getUIExtensibilityManager(mockNamespace, mockProvider);
    const secondManager = getUIExtensibilityManager(
      mockNamespace,
      mockProvider,
    );
    expect(firstManager).toBe(secondManager);
  });

  test("should create different managers for different namespaces", () => {
    const manager1 = getUIExtensibilityManager(mockNamespace, mockProvider);
    const manager2 = getUIExtensibilityManager(
      "other-namespace" as AmazonConnectNamespace,
      mockProvider,
    );

    expect(manager1).not.toBe(manager2);
  });

  test("should create different managers for different provider IDs", () => {
    const manager1 = getUIExtensibilityManager(mockNamespace, mockProvider);
    const manager2 = getUIExtensibilityManager(mockNamespace, {
      ...mockProvider,
      id: "different-provider-id",
    });

    expect(manager1).not.toBe(manager2);
  });
});
