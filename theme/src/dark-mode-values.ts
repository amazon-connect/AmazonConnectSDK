import { Theme } from "@cloudscape-design/components/theming";

// Visual contexts need every one of our theme values re-applied,
// and some of them are always dark so they need only our values for dark mode
export function darkModeValues(theme: Theme): Theme["tokens"] {
  return Object.fromEntries(
    Object.entries(theme.tokens).map(([token, value]) => [
      token,
      typeof value === "string" ? value : value?.dark,
    ]),
  );
}
