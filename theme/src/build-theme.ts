import { Overrides } from "./supported-overrides";

export function buildTheme({
  fontFamily,
  brandColor,
  brandColorActive,
}: Overrides) {
  return {
    tokens: {
      fontFamilyBase: fontFamily,
      colorBackgroundButtonPrimaryDefault: brandColor,
      colorBackgroundButtonPrimaryActive: brandColorActive,
      colorBackgroundButtonPrimaryHover: brandColorActive,

      colorBackgroundControlChecked: brandColor,
      // TODO waiting for latest public version
      // colorBackgroundSegmentActive: brandColor,
      // Not themable
      // colorBackgroundProgressBarContentDefault: brandColor,

      colorBorderButtonNormalDefault: brandColor,
      colorBorderButtonNormalActive: brandColorActive,
      colorBorderButtonNormalHover: brandColorActive,

      colorTextLinkDefault: brandColor,
      colorTextLinkHover: brandColorActive,
      // TODO waiting for latest public version
      // colorTextSegmentHover: brandColor,

      colorTextButtonNormalDefault: brandColor,
      colorTextButtonNormalActive: brandColorActive,
      colorTextButtonNormalHover: brandColorActive,

      colorBorderItemSelected: brandColor,
      // TODO contrast super low
      colorBorderItemFocused: brandColor,
      // TODO what should this be?
      // colorBackgroundItemSelected: brandColor,

      colorTextAccent: brandColor,
    },
  };
}
