import { applyTheme } from "@cloudscape-design/components/theming";

import { applyConnectTheme } from "./theming";

jest.mock("@cloudscape-design/components/theming");
const applyThemeMock = applyTheme as jest.MockedFn<typeof applyTheme>;

// Not deleting this as it'll come back as soon as the theme override API is stable
// function expectTokens(tokens: Theme["tokens"]) {
//   expect(applyThemeMock).toHaveBeenCalledWith({
//     theme: {
//       // Need to cast as unknown because this whole repo uses @typescript-eslint/no-unsafe-assignment
//       // which produces false positives like this one. The typical recommendation is to instead rely on
//       // noImplicitAny from the Typescript compiler and no-explicit-any from ESLint.
//       tokens: expect.objectContaining(tokens) as unknown,
//     },
//   });
// }

describe("theming", () => {
  beforeEach(() => applyThemeMock.mockReset());

  it("applies default Connect theme", () => {
    applyConnectTheme();
    expect(applyThemeMock).toHaveBeenCalledTimes(1);
    // This is the only use-case that ever makes sense for snapshot tests.
    // We need an exact, precise output, and we want changes to it to be reviewed carefully.
    expect(applyThemeMock.mock.lastCall?.[0]).toMatchSnapshot();
  });

  // Not deleting these tests as they'll come back as soon as the theme override API is stable
  // it("allows non-modal overrides", () => {
  //   applyConnectTheme({ fontFamily: "Comic Sans", brandColor: "hotpink" });
  //   expectTokens({
  //     fontFamilyBase: "Comic Sans",
  //     colorBackgroundButtonPrimaryDefault: "hotpink",
  //     colorBackgroundButtonPrimaryActive: {
  //       dark: "#A7C1D1",
  //       light: "#065B78",
  //     },
  //     colorBackgroundButtonPrimaryHover: {
  //       dark: "#A7C1D1",
  //       light: "#065B78",
  //     },
  //   });
  // });
  //
  // it("allows modal overrides", () => {
  //   applyConnectTheme({ brandColor: { light: "deeppink", dark: "hotpink" } });
  //   expectTokens({
  //     colorBackgroundButtonPrimaryDefault: {
  //       light: "deeppink",
  //       dark: "hotpink",
  //     },
  //     colorBackgroundButtonPrimaryActive: {
  //       dark: "#A7C1D1",
  //       light: "#065B78",
  //     },
  //     colorBackgroundButtonPrimaryHover: {
  //       dark: "#A7C1D1",
  //       light: "#065B78",
  //     },
  //   });
  // });
  //
  // it("ignores unknown tokens", () => {
  //   applyConnectTheme();
  //   const defaultTheme = applyThemeMock.mock.lastCall;
  //   // @ts-expect-error - We use a property that doesn't exist on purpose to mimic non-TS customers.
  //   applyConnectTheme({ pageBorderRadius: "0" });
  //   expect(applyThemeMock.mock.lastCall).toEqual(defaultTheme);
  // });
  //
  // it("ignores modal overrides on non-modal properties", () => {
  //   applyConnectTheme();
  //   const defaultTheme = applyThemeMock.mock.lastCall;
  //   // @ts-expect-error - We use the wrong value type for fontFamily to mimic non-TS customers.
  //   applyConnectTheme({ fontFamily: { light: "deeppink", dark: "hotpink" } });
  //   expect(applyThemeMock.mock.lastCall).toEqual(defaultTheme);
  // });
});
