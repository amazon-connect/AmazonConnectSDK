/* eslint-disable no-undef */
import {
  AmazonConnectProvider,
  ConnectLogger,
  Proxy,
} from "@amazon-connect/core";
import { applyTheme } from "@cloudscape-design/components/theming";
import { applyMode, Mode } from "@cloudscape-design/global-styles";
import { mock } from "jest-mock-extended";

import { applyConnectTheme } from "./apply-connect-theme";
import { ThemeClient } from "./theme-client";
import { applyConnectTheme as applyConnectThemeDeprecated } from "./theming";
import { VisualModeChanged } from "./types";

// Mock external dependencies
jest.mock("@cloudscape-design/components/theming");
jest.mock("@cloudscape-design/global-styles");
jest.mock("@amazon-connect/core");
jest.mock("./theming");
jest.mock("./theme-client");

const MockedThemeClient = ThemeClient as jest.MockedClass<typeof ThemeClient>;
const MockedConnectLogger = ConnectLogger as jest.MockedClass<
  typeof ConnectLogger
>;
const mockedApplyConnectThemeDeprecated =
  applyConnectThemeDeprecated as jest.MockedFunction<
    typeof applyConnectThemeDeprecated
  >;
const mockedApplyMode = applyMode as jest.MockedFunction<typeof applyMode>;
const mockedApplyTheme = applyTheme as jest.MockedFunction<typeof applyTheme>;

const mockMatchMedia = (matchMedia: boolean) => {
  const mockMediaQueryList = mock<MediaQueryList>({
    matches: matchMedia,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  });

  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: jest.fn().mockReturnValue(mockMediaQueryList),
  });

  return mockMediaQueryList;
};

describe("applyConnectTheme", () => {
  let mockProvider: AmazonConnectProvider;
  let mockProxy: Proxy;
  let mockThemeClient: jest.Mocked<ThemeClient>;
  let mockLogger: jest.Mocked<ConnectLogger>;
  let visualModeChangeCallback:
    | ((data: VisualModeChanged) => Promise<void>)
    | null;

  beforeEach(() => {
    jest.resetAllMocks();
    visualModeChangeCallback = null;

    mockProxy = mock<Proxy>({
      subscribe: jest.fn().mockImplementation((_, callback) => {
        /* eslint-disable-next-line @typescript-eslint/no-unsafe-assignment */
        visualModeChangeCallback = callback;
      }),
    });

    mockProvider = mock<AmazonConnectProvider>({
      getProxy: jest.fn().mockReturnValue(mockProxy),
    });
    mockThemeClient = mock<ThemeClient>();
    mockLogger = mock<ConnectLogger>();

    MockedThemeClient.mockImplementation(() => mockThemeClient);
    MockedConnectLogger.mockImplementation(() => mockLogger);

    mockMatchMedia(true);
  });

  describe("when no provider is provided", () => {
    it("should call deprecated applyConnectTheme function", async () => {
      applyConnectTheme();

      expect(mockedApplyConnectThemeDeprecated).toHaveBeenCalledTimes(1);
      expect(MockedThemeClient).not.toHaveBeenCalled();
      expect(MockedConnectLogger).not.toHaveBeenCalled();
    });
  });

  describe("when provider is provided", () => {
    it("should create logger with correct configuration", async () => {
      const mockTheme = {
        tokens: { colorBackgroundButtonPrimaryActive: "#ffffff" },
      };
      mockThemeClient.getTheme.mockResolvedValue({ theme: mockTheme });

      await applyConnectTheme(mockProvider);

      expect(MockedConnectLogger).toHaveBeenCalledWith({
        provider: mockProvider,
        source: "theme.applyConnectTheme",
      });
    });

    it("should create ThemeClient with provider", async () => {
      const mockTheme = {
        tokens: { colorBackgroundButtonPrimaryActive: "#ffffff" },
      };
      mockThemeClient.getTheme.mockResolvedValue({ theme: mockTheme });

      await applyConnectTheme(mockProvider);

      expect(MockedThemeClient).toHaveBeenCalledWith({
        provider: mockProvider,
      });
    });

    describe("when theme is successfully retrieved", () => {
      it("should apply theme when theme exists and not call deprecated function", async () => {
        const mockTheme = {
          tokens: { colorBackgroundButtonPrimaryActive: "#ffffff" },
        };
        mockThemeClient.getTheme.mockResolvedValue({
          theme: mockTheme,
        });

        await applyConnectTheme(mockProvider);

        expect(mockThemeClient.getTheme).toHaveBeenCalled();
        expect(mockedApplyTheme).toHaveBeenCalledWith({ theme: mockTheme });
        expect(mockLogger.error).not.toHaveBeenCalled();
        expect(mockedApplyConnectThemeDeprecated).not.toHaveBeenCalled();
      });

      it("should call deprecated function when theme is undefined", async () => {
        mockThemeClient.getTheme.mockResolvedValue({ theme: undefined });

        await applyConnectTheme(mockProvider);

        expect(mockThemeClient.getTheme).toHaveBeenCalled();
        expect(mockLogger.error).not.toHaveBeenCalled();
        expect(mockedApplyConnectThemeDeprecated).toHaveBeenCalledTimes(1);
      });

      it("should call deprecated function when getTheme returns empty object", async () => {
        mockThemeClient.getTheme.mockResolvedValue({});

        await applyConnectTheme(mockProvider);

        expect(mockThemeClient.getTheme).toHaveBeenCalled();
        expect(mockLogger.error).not.toHaveBeenCalled();
        expect(mockedApplyConnectThemeDeprecated).toHaveBeenCalledTimes(1);
      });

      it("should not subscribe to visual mode changes if no theme", async () => {
        mockThemeClient.getTheme.mockResolvedValue({
          theme: undefined,
        });

        const mockMediaQueryList = mockMatchMedia(true);

        await applyConnectTheme(mockProvider);

        expect(mockProvider.getProxy).not.toHaveBeenCalled();
        expect(mockMediaQueryList.addEventListener).not.toHaveBeenCalled();
        expect(mockedApplyMode).not.toHaveBeenCalled();
      });
    });

    describe("when error occurs during theme retrieval", () => {
      it("should log error and call deprecated function when getTheme throws", async () => {
        const mockError = new Error("Theme retrieval failed");
        mockThemeClient.getTheme.mockRejectedValue(mockError);

        await applyConnectTheme(mockProvider);

        expect(mockThemeClient.getTheme).toHaveBeenCalled();
        expect(mockLogger.error).toHaveBeenCalledWith(
          "An error occurred while retreiving theme",
          { error: mockError },
        );
        expect(mockedApplyConnectThemeDeprecated).toHaveBeenCalledTimes(1);
      });

      it("should handle network errors gracefully and call deprecated function", async () => {
        const networkError = new Error("Network timeout");
        mockThemeClient.getTheme.mockRejectedValue(networkError);

        await applyConnectTheme(mockProvider);

        expect(mockLogger.error).toHaveBeenCalledWith(
          "An error occurred while retreiving theme",
          { error: networkError },
        );
        expect(mockedApplyConnectThemeDeprecated).toHaveBeenCalledTimes(1);
      });

      it("should handle ThemeClient constructor errors and call deprecated function", async () => {
        const mockError = new Error("ThemeClient initialization failed");
        MockedThemeClient.mockImplementation(() => {
          throw mockError;
        });

        await applyConnectTheme(mockProvider);

        expect(mockLogger.error).toHaveBeenCalledWith(
          "An error occurred while retreiving theme",
          { error: mockError },
        );
        expect(mockedApplyConnectThemeDeprecated).toHaveBeenCalledTimes(1);
      });
    });

    describe("when visual mode changes", () => {
      beforeEach(async () => {
        // Reset mocks before each test
        jest.clearAllMocks();

        const mockTheme = {
          tokens: { colorBackgroundButtonPrimaryActive: "#ffffff" },
        };
        mockThemeClient.getTheme.mockResolvedValue({ theme: mockTheme });
      });

      describe("when visualMode is 'auto'", () => {
        it("should apply dark mode when user system is dark mode and add event listener", async () => {
          const mockMediaQueryList = mockMatchMedia(true);

          await applyConnectTheme(mockProvider);

          // Trigger the visual mode change callback
          expect(visualModeChangeCallback).not.toBeNull();
          await visualModeChangeCallback!({
            visualMode: "auto",
            previous: { visualMode: "light" },
          });

          expect(mockedApplyMode).toHaveBeenCalledWith(Mode.Dark);
          expect(mockMediaQueryList.addEventListener).toHaveBeenCalledWith(
            "change",
            expect.any(Function),
          );
        });

        it("should apply light mode when user prefers light color scheme and add event listener", async () => {
          const mockMediaQueryList = mockMatchMedia(false);

          await applyConnectTheme(mockProvider);

          // Trigger the visual mode change callback
          expect(visualModeChangeCallback).not.toBeNull();
          await visualModeChangeCallback!({
            visualMode: "auto",
            previous: { visualMode: "light" },
          });

          expect(mockedApplyMode).toHaveBeenCalledWith(Mode.Light);
          expect(mockMediaQueryList.addEventListener).toHaveBeenCalledWith(
            "change",
            expect.any(Function),
          );
        });

        it("should handle media query change events when in auto mode", async () => {
          const mockMediaQueryList = mockMatchMedia(false);

          await applyConnectTheme(mockProvider);

          // Trigger the visual mode change callback to set auto mode
          expect(visualModeChangeCallback).not.toBeNull();
          await visualModeChangeCallback!({
            visualMode: "auto",
            previous: { visualMode: null },
          });

          // Verify event listener was added
          expect(mockMediaQueryList.addEventListener).toHaveBeenCalledWith(
            "change",
            expect.any(Function),
          );

          // Get the event listener that was added
          const eventListener = mockMediaQueryList.addEventListener.mock
            .calls[0][1] as EventListener;

          // Simulate a change to dark mode
          const darkModeEvent = { matches: true } as MediaQueryListEvent;
          eventListener(darkModeEvent);

          expect(mockedApplyMode).toHaveBeenCalledWith(Mode.Dark);

          // Simulate a change to light mode
          const lightModeEvent = { matches: false } as MediaQueryListEvent;
          eventListener(lightModeEvent);

          expect(mockedApplyMode).toHaveBeenCalledWith(Mode.Light);
        });
      });

      describe("when visualMode is not 'auto'", () => {
        it("should apply light mode directly and remove event listener when visualMode is 'light'", async () => {
          const mockMediaQueryList = mockMatchMedia(false);

          await applyConnectTheme(mockProvider);

          // Trigger the visual mode change callback
          expect(visualModeChangeCallback).not.toBeNull();
          await visualModeChangeCallback!({
            visualMode: "light",
            previous: { visualMode: null },
          });

          expect(mockedApplyMode).toHaveBeenCalledWith(Mode.Light);
          expect(mockMediaQueryList.removeEventListener).toHaveBeenCalledWith(
            "change",
            expect.any(Function),
          );
        });

        it("should apply dark mode directly and remove event listener when visualMode is 'dark'", async () => {
          const mockMediaQueryList = mockMatchMedia(false);

          await applyConnectTheme(mockProvider);

          // Trigger the visual mode change callback
          expect(visualModeChangeCallback).not.toBeNull();
          await visualModeChangeCallback!({
            visualMode: "dark",
            previous: { visualMode: null },
          });

          expect(mockedApplyMode).toHaveBeenCalledWith(Mode.Dark);
          expect(mockMediaQueryList.removeEventListener).toHaveBeenCalledWith(
            "change",
            expect.any(Function),
          );
        });
      });
    });
  });
});
