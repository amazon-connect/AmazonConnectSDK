import { SetIframeOptions } from "../app";

/**
 * Configuration options for iframe attributes.
 */
export interface IFrameAttributeConfig {
  /** Allow attribute values to be added to the iframe */
  allow?: string[];
  /** Sandbox attribute values to be added to the iframe */
  sandbox?: string[];
}

/**
 * Applies iframe configuration to an HTMLIFrameElement.
 * Merges new configuration values with existing iframe attributes.
 * 
 * @param iframe - The iframe element to configure
 * @param config - Configuration containing allow and sandbox values
 * @param setIframeOptions - Configuration options to disable iframe attributes
 */
export function applyIFrameConfig(
iframe: HTMLIFrameElement, config?: IFrameAttributeConfig, setIframeOptions?: SetIframeOptions,
): void {
  if (!config) {
    return;
  }

  applyAllowAttribute(iframe, config.allow, setIframeOptions);
  applySandboxAttribute(iframe, config.sandbox, setIframeOptions);
}

/**
 * Applies allow attribute values to an iframe, merging with existing values.
 * 
 * @param iframe - The iframe element to configure
 * @param allowValues - Array of allow attribute values to add
 * @param setIframeOptions - Configuration options to disable iframe attributes
 */
function applyAllowAttribute(
iframe: HTMLIFrameElement, allowValues?: string[], setIframeOptions?: SetIframeOptions,
): void {
  if (setIframeOptions?.disableIframeAllowConfig || !allowValues?.length) {
    return;
  }

  const existingAllow = iframe.allow || "";
  const allowValuesSeparator = "; ";
  
  const existingAllowValues = existingAllow
    ? existingAllow.split(allowValuesSeparator).map(value => value.trim().toLowerCase())
    : [];

  const uniqueAllowValues = allowValues.filter(
    value => value && !existingAllowValues.includes(value.toLowerCase())
  );

  if (uniqueAllowValues.length > 0) {
    const connector = existingAllow ? allowValuesSeparator : "";
    iframe.allow = existingAllow + connector + uniqueAllowValues.join(allowValuesSeparator);
  }
}

/**
 * Applies sandbox attribute values to an iframe, merging with existing values.
 * 
 * @param iframe - The iframe element to configure
 * @param sandboxValues - Array of sandbox attribute values to add
 */
function applySandboxAttribute(
iframe: HTMLIFrameElement, sandboxValues?: string[], setIframeOptions?: SetIframeOptions,
): void {
  if (setIframeOptions?.disableIframeSandboxConfig || !sandboxValues?.length) {
    return;
  }

  const existingSandboxValues = Array.from(iframe.sandbox);
  const existingLowerCase = existingSandboxValues.map(value => value && value.toLowerCase());
  
  const uniqueSandboxValues = sandboxValues.filter(
    value => value && !existingLowerCase.includes(value.toLowerCase())
  );

  if (uniqueSandboxValues.length > 0) {
    const allSandboxValues = [...existingSandboxValues, ...uniqueSandboxValues];
    iframe.sandbox.value = allSandboxValues.join(" ");
  }
}
