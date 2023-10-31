import { TEAL_300, TEAL_400, TEAL_600, TEAL_700 } from "./connect-constants";
import type { ModeValues, SupportedOverrides } from "./supported-overrides";

// Forcing explicit light and dark mode support for every token in our theme for safety, even if it's the same color.
export type ForcedModeSupport = {
  [Token in keyof SupportedOverrides as SupportedOverrides[Token] extends string
    ? never
    : Token]: ModeValues;
};

export const CONNECT_OVERRIDES: ForcedModeSupport = {
  brandColor: { light: TEAL_600, dark: TEAL_400 },
  brandColorActive: { light: TEAL_700, dark: TEAL_300 },
};
