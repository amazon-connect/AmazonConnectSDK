import { applyIFrameConfig, IFrameAttributeConfig } from "./iframe-config-utils";

describe("iframe-config-utils", () => {
  let iframe: HTMLIFrameElement;

  beforeEach(() => {
    // Mock HTMLIFrameElement
    const mockSandbox = {
      value: "",
      add: jest.fn((value: string) => {
        const values = mockSandbox.value ? mockSandbox.value.split(" ").filter(v => v) : [];
        if (!values.includes(value)) {
          values.push(value);
          mockSandbox.value = values.join(" ");
        }
      }),
      // Mock Array.from behavior for DOMTokenList
      [Symbol.iterator]: function* () {
        const values = this.value ? this.value.split(" ").filter(v => v) : [];
        for (const value of values) {
          yield value;
        }
      },
    };

    iframe = {
      allow: "",
      sandbox: mockSandbox,
    } as unknown as HTMLIFrameElement;
  });

  describe("applyIFrameConfig", () => {
    test("should do nothing when config is undefined", () => {
      applyIFrameConfig(iframe, undefined);

      expect(iframe.allow).toBe("");
      expect(iframe.sandbox.value).toBe("");
    });

    test("should do nothing when config is empty", () => {
      const config: IFrameAttributeConfig = {};

      applyIFrameConfig(iframe, config);

      expect(iframe.allow).toBe("");
      expect(iframe.sandbox.value).toBe("");
    });

    test("should apply allow attributes when provided", () => {
      const config: IFrameAttributeConfig = {
        allow: ["camera", "microphone"],
      };

      applyIFrameConfig(iframe, config);

      expect(iframe.allow).toBe("camera; microphone");
    });

    test("should merge allow attributes with existing values", () => {
      iframe.allow = "geolocation";
      const config: IFrameAttributeConfig = {
        allow: ["camera", "microphone"],
      };

      applyIFrameConfig(iframe, config);

      expect(iframe.allow).toBe("geolocation; camera; microphone");
    });

    test("should not duplicate existing allow values", () => {
      iframe.allow = "camera; geolocation";
      const config: IFrameAttributeConfig = {
        allow: ["camera", "microphone"],
      };

      applyIFrameConfig(iframe, config);

      expect(iframe.allow).toBe("camera; geolocation; microphone");
    });

    test("should not duplicate existing allow values (case insensitive)", () => {
      iframe.allow = "CAMERA; geolocation";
      const config: IFrameAttributeConfig = {
        allow: ["camera", "microphone"],
      };

      applyIFrameConfig(iframe, config);

      expect(iframe.allow).toBe("CAMERA; geolocation; microphone");
    });

    test("should handle mixed case allow values correctly", () => {
      iframe.allow = "Camera; GEOLOCATION";
      const config: IFrameAttributeConfig = {
        allow: ["camera", "CAMERA", "Microphone"],
      };

      applyIFrameConfig(iframe, config);

      expect(iframe.allow).toBe("Camera; GEOLOCATION; Microphone");
    });

    test("should not modify allow when all values already exist", () => {
      iframe.allow = "camera; microphone; geolocation";
      const config: IFrameAttributeConfig = {
        allow: ["camera", "microphone"],
      };

      applyIFrameConfig(iframe, config);

      expect(iframe.allow).toBe("camera; microphone; geolocation");
    });

    test("should apply sandbox attributes when provided", () => {
      const config: IFrameAttributeConfig = {
        sandbox: ["allow-scripts", "allow-forms"],
      };

      applyIFrameConfig(iframe, config);

      expect(iframe.sandbox.value).toBe("allow-scripts allow-forms");
    });

    test("should merge sandbox attributes with existing values", () => {
      iframe.sandbox.add("allow-popups");
      const config: IFrameAttributeConfig = {
        sandbox: ["allow-scripts", "allow-forms"],
      };

      applyIFrameConfig(iframe, config);

      expect(iframe.sandbox.value).toBe("allow-popups allow-scripts allow-forms");
    });

    test("should not duplicate existing sandbox values", () => {
      iframe.sandbox.add("allow-scripts");
      iframe.sandbox.add("allow-popups");
      const config: IFrameAttributeConfig = {
        sandbox: ["allow-scripts", "allow-forms"],
      };

      applyIFrameConfig(iframe, config);

      expect(iframe.sandbox.value).toBe("allow-scripts allow-popups allow-forms");
    });

    test("should not duplicate existing sandbox values (case insensitive)", () => {
      iframe.sandbox.add("ALLOW-SCRIPTS");
      iframe.sandbox.add("allow-popups");
      const config: IFrameAttributeConfig = {
        sandbox: ["allow-scripts", "allow-forms"],
      };

      applyIFrameConfig(iframe, config);

      expect(iframe.sandbox.value).toBe("ALLOW-SCRIPTS allow-popups allow-forms");
    });

    test("should handle mixed case sandbox values correctly", () => {
      iframe.sandbox.add("Allow-Scripts");
      iframe.sandbox.add("ALLOW-POPUPS");
      const config: IFrameAttributeConfig = {
        sandbox: ["allow-scripts", "ALLOW-SCRIPTS", "Allow-Forms"],
      };

      applyIFrameConfig(iframe, config);

      expect(iframe.sandbox.value).toBe("Allow-Scripts ALLOW-POPUPS Allow-Forms");
    });

    test("should not modify sandbox when all values already exist", () => {
      iframe.sandbox.add("allow-scripts");
      iframe.sandbox.add("allow-forms");
      iframe.sandbox.add("allow-popups");
      const config: IFrameAttributeConfig = {
        sandbox: ["allow-scripts", "allow-forms"],
      };

      applyIFrameConfig(iframe, config);

      expect(iframe.sandbox.value).toBe("allow-scripts allow-forms allow-popups");
    });

    test("should apply both allow and sandbox attributes", () => {
      const config: IFrameAttributeConfig = {
        allow: ["camera", "microphone"],
        sandbox: ["allow-scripts", "allow-forms"],
      };

      applyIFrameConfig(iframe, config);

      expect(iframe.allow).toBe("camera; microphone");
      expect(iframe.sandbox.value).toBe("allow-scripts allow-forms");
    });

    test("should handle empty arrays gracefully", () => {
      const config: IFrameAttributeConfig = {
        allow: [],
        sandbox: [],
      };

      applyIFrameConfig(iframe, config);

      expect(iframe.allow).toBe("");
      expect(iframe.sandbox.value).toBe("");
    });

    test("should disable allow config when disableIframeAllowConfig is true", () => {
      const config: IFrameAttributeConfig = {
        allow: ["camera", "microphone"],
        sandbox: ["allow-scripts"],
      };
      const setIframeOptions = {
        disableIframeAllowConfig: true,
      };

      applyIFrameConfig(iframe, config, setIframeOptions);

      expect(iframe.allow).toBe(""); // Should not be applied
      expect(iframe.sandbox.value).toBe("allow-scripts"); // Should still be applied
    });

    test("should disable sandbox config when disableIframeSandboxConfig is true", () => {
      const config: IFrameAttributeConfig = {
        allow: ["camera", "microphone"],
        sandbox: ["allow-scripts"],
      };
      const setIframeOptions = {
        disableIframeSandboxConfig: true,
      };

      applyIFrameConfig(iframe, config, setIframeOptions);

      expect(iframe.allow).toBe("camera; microphone"); // Should still be applied
      expect(iframe.sandbox.value).toBe(""); // Should not be applied
    });

    test("should disable both allow and sandbox config when both options are true", () => {
      const config: IFrameAttributeConfig = {
        allow: ["camera", "microphone"],
        sandbox: ["allow-scripts"],
      };
      const setIframeOptions = {
        disableIframeAllowConfig: true,
        disableIframeSandboxConfig: true,
      };

      applyIFrameConfig(iframe, config, setIframeOptions);

      expect(iframe.allow).toBe(""); // Should not be applied
      expect(iframe.sandbox.value).toBe(""); // Should not be applied
    });

    test("should apply config normally when setIframeOptions is undefined", () => {
      const config: IFrameAttributeConfig = {
        allow: ["camera", "microphone"],
        sandbox: ["allow-scripts"],
      };

      applyIFrameConfig(iframe, config, undefined);

      expect(iframe.allow).toBe("camera; microphone");
      expect(iframe.sandbox.value).toBe("allow-scripts");
    });

    test("should apply config normally when disable options are false", () => {
      const config: IFrameAttributeConfig = {
        allow: ["camera", "microphone"],
        sandbox: ["allow-scripts"],
      };
      const setIframeOptions = {
        disableIframeAllowConfig: false,
        disableIframeSandboxConfig: false,
      };

      applyIFrameConfig(iframe, config, setIframeOptions);

      expect(iframe.allow).toBe("camera; microphone");
      expect(iframe.sandbox.value).toBe("allow-scripts");
    });
  });
});
