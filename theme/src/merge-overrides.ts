import { CONNECT_OVERRIDES, ForcedModeSupport } from "./connect-overrides";
import {
  Overrides,
  SupportedOverrides,
  validateToken,
} from "./supported-overrides";

type TokenWithModes = keyof ForcedModeSupport;

function hasMode(token: keyof SupportedOverrides): token is TokenWithModes {
  // Obviously this will need to evolve once we support theming border radius and other non-modal tokens.
  return token !== "fontFamily";
}

export function mergeOverrides(overrides: Overrides) {
  const merged: Overrides = { ...CONNECT_OVERRIDES };
  for (const [token, value] of Object.entries(overrides)) {
    if (!validateToken(token)) continue;
    if (typeof value === "string") {
      merged[token] = value;
    } else if (hasMode(token)) {
      merged[token] = { ...CONNECT_OVERRIDES[token], ...value };
    }
    // Last else would be a non-modal token that received a modal value, which we simply ignore as invalid.
  }
  return merged;
}
