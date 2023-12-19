import { CONNECT_OVERRIDES } from "./connect-overrides";
import {
  Overrides,
  SupportedOverrides,
  validateToken,
} from "./supported-overrides";

type TokenWithModes = keyof {
  [Token in keyof SupportedOverrides as SupportedOverrides[Token] extends string
    ? never
    : Token]: true;
};

function hasMode(token: keyof SupportedOverrides): token is TokenWithModes {
  // Obviously this will need to evolve once we support theming border radius and other non-modal tokens.
  return token !== "fontFamily" && token !== "lightBrandBackground";
}

export function mergeOverrides(overrides: Overrides) {
  const merged: Overrides = { ...CONNECT_OVERRIDES };
  for (const [token, value] of Object.entries(overrides)) {
    if (!validateToken(token)) continue;
    if (typeof value === "string") {
      merged[token] = value;
    } else if (hasMode(token)) {
      const connectDefault = CONNECT_OVERRIDES[token];
      if (typeof connectDefault === "undefined") {
        merged[token] = value;
      } else if (typeof connectDefault === "string") {
        merged[token] = {
          light: connectDefault,
          dark: connectDefault,
          ...value,
        };
      } else {
        merged[token] = { ...connectDefault, ...value };
      }
    }
    // Last else would be a non-modal token that received a modal value, which we simply ignore as invalid.
  }
  return merged;
}
