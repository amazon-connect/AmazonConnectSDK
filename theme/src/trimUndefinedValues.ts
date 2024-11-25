import type { Theme } from "@cloudscape-design/components/theming";

export function trimUndefinedValues({ tokens }: Theme) {
  for (const key of Object.keys(tokens)) {
    // This is awkward but I'd rather not disable eslint's no-implicit-any in this file
    const typedKey = key as keyof Theme["tokens"];
    if (typeof tokens[typedKey] === "undefined") {
      delete tokens[typedKey];
    }
  }
}
