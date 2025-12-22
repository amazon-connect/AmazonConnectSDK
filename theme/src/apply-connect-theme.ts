/* eslint-disable no-redeclare */
/* eslint-disable no-undef */

import { AmazonConnectProvider, ConnectLogger } from "@amazon-connect/core";
import { applyTheme } from "@cloudscape-design/components/theming";
import { applyMode, Mode } from "@cloudscape-design/global-styles";

import { ThemeClient } from "./theme-client";
import { applyConnectTheme as applyConnectThemeDeprecated } from "./theming";
import { VisualMode } from "./types";

export async function applyConnectTheme(
  provider: AmazonConnectProvider,
): Promise<void>;
/**
 * @deprecated Use `applyConnectTheme(provider: AmazonConnectProvider)` instead.
 */
export function applyConnectTheme(): void;

export async function applyConnectTheme(provider?: AmazonConnectProvider) {
  if (!provider) {
    applyConnectThemeDeprecated();
    return;
  }

  const logger = new ConnectLogger({
    provider: provider,
    source: "theme.applyConnectTheme",
  });

  let theme;

  try {
    const themeClient = new ThemeClient({ provider });
    theme = (await themeClient.getTheme()).theme;

    if (theme) {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

      provider
        .getProxy()
        .subscribe(
          { key: "visualModeChange", namespace: "aws.connect.user" },
          ({ visualMode }: { visualMode: VisualMode }) => {
            if (visualMode === "auto") {
              applySystemVisualMode(mediaQuery);

              mediaQuery.addEventListener(
                "change",
                handleApplySystemVisualMode,
              );
            } else {
              applyMode(visualMode as Mode);
              mediaQuery.removeEventListener(
                "change",
                handleApplySystemVisualMode,
              );
            }
            return Promise.resolve();
          },
        );
    }
  } catch (error) {
    logger.error("An error occurred while retreiving theme", {
      error,
    });
  }

  if (!theme) {
    applyConnectThemeDeprecated();
    return;
  }

  applyTheme({ theme: theme });
  return;
}

function handleApplySystemVisualMode(e: MediaQueryListEvent) {
  applySystemVisualMode(e);
}

function applySystemVisualMode(
  mediaQuery: MediaQueryList | MediaQueryListEvent,
) {
  if (mediaQuery.matches) {
    applyMode(Mode.Dark);
  } else {
    applyMode(Mode.Light);
  }
}
