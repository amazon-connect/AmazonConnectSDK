import { Theme } from "@cloudscape-design/components/theming";

import { darkModeValues } from "./dark-mode-values";
import type { Overrides } from "./supported-overrides";

export function buildTheme({
  fontFamily,
  brandColor,
  brandColorActive,
  lightBrandBackground,
}: Overrides) {
  // Weird swap, but some states like disabling do have the "opposite" effect of highlighting
  const invertedHighlight =
    typeof brandColorActive === "string"
      ? brandColorActive
      : { light: brandColorActive?.dark, dark: brandColorActive?.light };

  const theme: Theme = {
    tokens: {
      fontFamilyBase: fontFamily,

      colorBackgroundButtonNormalActive: { light: lightBrandBackground },
      colorBackgroundButtonNormalHover: { light: lightBrandBackground },
      colorBackgroundButtonPrimaryActive: brandColorActive,
      colorBackgroundButtonPrimaryDefault: brandColor,
      colorBackgroundButtonPrimaryHover: brandColorActive,
      colorBackgroundControlChecked: brandColor,
      colorBackgroundDropdownItemFilterMatch: { light: lightBrandBackground },
      colorBackgroundItemSelected: { light: lightBrandBackground },
      colorBackgroundLayoutToggleSelectedActive: brandColor,
      colorBackgroundLayoutToggleSelectedDefault: brandColor,
      colorBackgroundLayoutToggleSelectedHover: brandColorActive,
      colorBackgroundSegmentActive: brandColor,
      colorBackgroundToggleCheckedDisabled: invertedHighlight,
      // Not themable
      // colorBackgroundProgressBarContentDefault: brandColor,

      colorBorderButtonNormalActive: brandColorActive,
      colorBorderButtonNormalDefault: brandColor,
      colorBorderButtonNormalHover: brandColorActive,
      colorBorderItemFocused: brandColor,
      colorBorderItemSelected: brandColor,

      colorTextAccent: brandColor,
      colorTextButtonNormalActive: brandColorActive,
      colorTextButtonNormalDefault: brandColor,
      colorTextButtonNormalHover: brandColorActive,
      colorTextDropdownItemFilterMatch: brandColor,
      colorTextLayoutToggleHover: brandColor,
      colorTextLinkDefault: brandColor,
      colorTextLinkHover: brandColorActive,
      colorTextSegmentHover: brandColor,
    },
  };

  theme.contexts = {
    "top-navigation": { tokens: darkModeValues(theme) },
    header: { tokens: darkModeValues(theme) },
    // Alerts remove branding colors from most elements, so we only have a few left
    alert: {
      tokens: {
        colorBackgroundControlChecked: brandColor,
        colorBackgroundDropdownItemFilterMatch: { light: lightBrandBackground },
        colorBackgroundItemSelected: { light: lightBrandBackground },
        colorBackgroundSegmentActive: brandColor,
        colorBackgroundToggleCheckedDisabled: invertedHighlight,

        colorTextAccent: brandColor,
        colorTextDropdownItemFilterMatch: brandColor,
        colorTextLinkDefault: brandColor,
        colorTextLinkHover: brandColorActive,
        colorTextSegmentHover: brandColor,
      },
    },
    // Nothing to override on flashbars, they should not include interactive elements that have brand colors.
  };

  return theme;
}
