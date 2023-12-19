import { applyTheme } from "@cloudscape-design/components/theming";

import { buildTheme } from "./build-theme";
import { CONNECT_OVERRIDES } from "./connect-overrides";

export function applyConnectTheme() {
  // Restore this once we support overrides. Not deleting as the goal is for it to come back soon.
  // const withConnectOverrides = overrides ? mergeOverrides(overrides) : CONNECT_OVERRIDES;
  applyTheme({ theme: buildTheme(CONNECT_OVERRIDES) });
}
