import { applyTheme } from "@cloudscape-design/components/theming";

import { applyConnectTheme } from "./theming";

jest.mock("@cloudscape-design/components/theming");

describe("theming", () => {
  test("should apply default theme", () => {
    applyConnectTheme();
    expect(applyTheme).toBeCalledWith({
      theme: {
        tokens: {
          colorBackgroundButtonPrimaryActive: "#065B78",
          colorBackgroundButtonPrimaryDefault: "#077398",
          colorBackgroundButtonPrimaryHover: "#065B78",
          colorBackgroundControlChecked: "#077398",
          colorBorderButtonNormalDefault: "#077398",
          colorBorderButtonNormalHover: "#065B78",
          colorBorderItemFocused: "#077398",
          colorBorderItemSelected: "#077398",
          colorTextAccent: {
            dark: "#077398",
            light: "#077398",
          },
          colorTextButtonNormalDefault: "#077398",
          colorTextButtonNormalHover: "#065B78",
          colorTextLinkDefault: "#077398",
          colorTextLinkHover: "#065B78",
        },
      },
    });
  });

  test("should not allow overrides", () => {
    // @ts-expect-error: We do not support this yet so the argument is typed as never. We still want a unit test for JS customers.
    expect(() => applyConnectTheme({ tokens: {} })).toThrow();
  });
});
