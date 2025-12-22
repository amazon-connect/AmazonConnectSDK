import { Theme as CloudscapeTheme } from "@cloudscape-design/components/theming";
export interface Theme {
  theme?: CloudscapeTheme;
}

export type VisualMode = "light" | "dark" | "auto";

export type VisualModeChanged = {
  visualMode: VisualMode;
  previous: {
    visualMode: VisualMode | null;
  };
};
