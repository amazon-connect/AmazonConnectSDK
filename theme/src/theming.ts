import { applyTheme, Theme } from "@cloudscape-design/components/theming";

const connectTeal600 = "#077398";
const connectTeal700 = "#065B78";

const theme: Theme = {
  tokens: {
    colorBackgroundButtonPrimaryDefault: connectTeal600,
    colorBackgroundButtonPrimaryActive: connectTeal700,
    colorBackgroundButtonPrimaryHover: connectTeal700,

    colorBackgroundControlChecked: connectTeal600,
    // TODO waiting for latest public version
    // colorBackgroundSegmentActive: connectTeal600,
    // Not themable
    // colorBackgroundProgressBarContentDefault: connectTeal600,

    colorBorderButtonNormalDefault: connectTeal600,
    colorBorderButtonNormalHover: connectTeal700,

    colorTextLinkDefault: connectTeal600,
    colorTextLinkHover: connectTeal700,
    // TODO waiting for latest public version
    // colorTextSegmentHover: connectTeal600,

    colorTextButtonNormalDefault: connectTeal600,
    colorTextButtonNormalHover: connectTeal700,

    colorBorderItemSelected: connectTeal600,
    // TODO contrast super low
    colorBorderItemFocused: connectTeal600,
    // TODO what should this be?
    // colorBackgroundItemSelected: connectTeal600,

    colorTextAccent: {
      light: connectTeal600,
      dark: connectTeal600,
    },
  },
};

// Preparing the public signature for when we support overrides, but typing it so it's not usable for now.
export function applyConnectTheme(overrides?: never) {
  if (overrides) {
    throw new Error(
      "Connect theming for Cloudscape does not support overrides yet",
    );
  } else {
    applyTheme({ theme });
  }
}
