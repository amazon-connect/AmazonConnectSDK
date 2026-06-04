import "./provider";

import { AmazonConnectProvider } from "@amazon-connect/core";
import { mock } from "jest-mock-extended";

import { addAppManagerPluginKey } from "./provider-plugins";

beforeEach(jest.resetAllMocks);

/**
 * Helper to get a fresh, isolated copy of the provider-plugins module with
 * its own independent globalPlugins array.
 */
function isolatedModule() {
  let addPlugin: (name: string) => void;
  let getPlugins: (provider: AmazonConnectProvider) => string[];

  jest.isolateModules(() => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
    const mod = require("./provider-plugins") as {
      addAppManagerPluginKey: (name: string) => void;
      getProviderPlugins: (provider: AmazonConnectProvider) => string[];
    };
    addPlugin = mod.addAppManagerPluginKey;
    getPlugins = mod.getProviderPlugins;
  });

  return {
    addAppManagerPluginKey: addPlugin!,

    getProviderPlugins: getPlugins!,
  };
}

describe("addAppManagerPluginKey", () => {
  test("should be exported", () => {
    expect(addAppManagerPluginKey).toBeDefined();
  });
});

describe("getProviderPlugins", () => {
  describe("when no plugins are set", () => {
    test("should return an empty array", () => {
      const { getProviderPlugins } = isolatedModule();
      const provider = mock<AmazonConnectProvider>();

      const result = getProviderPlugins(provider);

      expect(result).toEqual([]);
    });
  });

  describe("when global plugins are set", () => {
    const plugin1 = "plugin-1";
    const plugin2 = "plugin-2";

    test("should return only global plugins", () => {
      const { addAppManagerPluginKey, getProviderPlugins } = isolatedModule();
      addAppManagerPluginKey(plugin1);
      addAppManagerPluginKey(plugin2);
      const provider = mock<AmazonConnectProvider>();

      const result = getProviderPlugins(provider);

      expect(result).toEqual(expect.arrayContaining([plugin1, plugin2]));
      expect(result.length).toBe(2);
    });
  });

  describe("when provider config has appManager plugins", () => {
    const providerPlugin1 = "provider-plugin-1";
    const providerPlugin2 = "provider-plugin-2";

    test("should return only provider-scoped plugins", () => {
      const { getProviderPlugins } = isolatedModule();
      const provider = mock<AmazonConnectProvider>({
        config: {
          appManager: { plugins: [providerPlugin1, providerPlugin2] },
        },
      });

      const result = getProviderPlugins(provider);

      expect(result).toEqual(
        expect.arrayContaining([providerPlugin1, providerPlugin2]),
      );
      expect(result.length).toBe(2);
    });
  });

  describe("when both global and provider config plugins are set", () => {
    const globalPlugin = "global-plugin";
    const providerPlugin = "provider-plugin";

    test("should return the union of global and provider plugins", () => {
      const { addAppManagerPluginKey, getProviderPlugins } = isolatedModule();
      addAppManagerPluginKey(globalPlugin);
      const provider = mock<AmazonConnectProvider>({
        config: { appManager: { plugins: [providerPlugin] } },
      });

      const result = getProviderPlugins(provider);

      expect(result).toEqual(
        expect.arrayContaining([globalPlugin, providerPlugin]),
      );
      expect(result.length).toBe(2);
    });
  });

  describe("deduplication", () => {
    const sharedPlugin = "shared-plugin";
    const globalOnlyPlugin = "global-only-plugin";

    test("should deduplicate plugins present in both global and provider config", () => {
      const { addAppManagerPluginKey, getProviderPlugins } = isolatedModule();
      addAppManagerPluginKey(sharedPlugin);
      addAppManagerPluginKey(globalOnlyPlugin);
      const provider = mock<AmazonConnectProvider>({
        config: { appManager: { plugins: [sharedPlugin] } },
      });

      const result = getProviderPlugins(provider);

      expect(result).toEqual(
        expect.arrayContaining([sharedPlugin, globalOnlyPlugin]),
      );
      expect(result.length).toBe(2);
    });

    test("should not duplicate a plugin added to global list multiple times", () => {
      const { addAppManagerPluginKey, getProviderPlugins } = isolatedModule();
      addAppManagerPluginKey(sharedPlugin);
      addAppManagerPluginKey(sharedPlugin);
      const provider = mock<AmazonConnectProvider>();

      const result = getProviderPlugins(provider);

      const count = result.filter((p) => p === sharedPlugin).length;
      expect(count).toBe(1);
    });
  });

  describe("when provider config has no appManager property", () => {
    test("should return only global plugins", () => {
      const { addAppManagerPluginKey, getProviderPlugins } = isolatedModule();
      addAppManagerPluginKey("global-plugin");
      const provider = mock<AmazonConnectProvider>({ config: {} });

      const result = getProviderPlugins(provider);

      expect(result).toEqual(["global-plugin"]);
    });
  });

  describe("when provider config has no appManager plugins", () => {
    test("should return only global plugins when config has no appManager", () => {
      const { addAppManagerPluginKey, getProviderPlugins } = isolatedModule();
      addAppManagerPluginKey("global-plugin");
      const provider = mock<AmazonConnectProvider>();

      const result = getProviderPlugins(provider);

      expect(result).toEqual(["global-plugin"]);
    });
  });
});
