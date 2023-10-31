export type ModeValues = { light: string; dark: string };
export type ModeDependentValue = string | Partial<ModeValues>;

export interface SupportedOverrides {
  /**
   * The default font family that will be applied globally to the product interface.
   */
  fontFamily: string;
  /**
   * The primary brand color used for buttons, links and form controls.
   */
  brandColor: ModeDependentValue;
  /**
   * Slightly lighter or darker version brand color, applied when brand color elements become active,
   * focused or hovered.
   */
  brandColorActive: ModeDependentValue;
}

export type Overrides = Partial<SupportedOverrides>;

// Not much other choice than to duplicate this to have it available at runtime, unfortunately.
const TOKENS = new Set<keyof SupportedOverrides>([
  "fontFamily",
  "brandColor",
  "brandColorActive",
]);

export function validateToken(
  token: string,
): token is keyof SupportedOverrides {
  // Either we cast here or we type TOKENS as a set of strings, which is less safe against typos.
  return TOKENS.has(token as keyof SupportedOverrides);
}
