import { applyTheme } from "@cloudscape-design/components/theming";

import { buildTheme } from "./build-theme";
import { CONNECT_OVERRIDES } from "./connect-overrides";
import { mergeOverrides } from "./merge-overrides";
import type { Overrides } from "./supported-overrides";

// Preparing the public signature for when we support overrides, but typing it so it's not usable for now.
export function applyConnectTheme(overrides?: Overrides) {
  const withConnectOverrides = overrides
    ? mergeOverrides(overrides)
    : CONNECT_OVERRIDES;
  applyTheme({ theme: buildTheme(withConnectOverrides) });
}
