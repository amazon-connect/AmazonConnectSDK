/**
 * Theme configuration for Amazon Connect workspace applications.
 * Defines color scheme and visual styling properties with enhanced configuration options.
 */

/**
 * Header theme configuration.
 */
export interface HeaderTheme {
  /** Background color for the header */
  background?: string;
  /** Text color for header content */
  text?: string;
  /** Text color when hovering over header elements */
  textHover?: string;
  /** Whether to invert action colors in the header */
  invertActionsColors?: boolean;
}

/**
 * Navigation theme configuration.
 */
export interface NavigationTheme {
  /** Background color for the navigation area */
  background?: string;
  /** Background color when hovering over navigation text */
  textBackgroundHover?: string;
  /** Background color for active navigation text */
  textBackgroundActive?: string;
  /** Default text color for navigation items */
  text?: string;
  /** Text color when hovering over navigation items */
  textHover?: string;
  /** Text color for active navigation items */
  textActive?: string;
  /** Whether to invert action colors in navigation */
  invertActionsColors?: boolean;
}

/**
 * Canvas theme configuration.
 */
export interface CanvasTheme {
  /** Background color for the page */
  pageBackground?: string;
  /** Background color for containers */
  containerBackground?: string;
  /** Background color for active elements */
  activeBackground?: string;
}

/**
 * Color theme configuration.
 */
export interface ColorTheme {
  /** Default color */
  default?: string;
  /** Color for active elements */
  active?: string;
  /** Contrast text color */
  contrastText?: string;
}

/**
 * Logo theme configuration.
 */
export interface LogoTheme {
  /** Horizontal logo image URL or path */
  horizontal?: string;
  /** Vertical logo image URL or path */
  vertical?: string;
  /** Favicon image URL or path */
  favicon?: string;
}

/**
 * Font family theme configuration.
 */
export interface FontFamilyTheme {
  /** Default font family */
  default?: string;
}

/**
 * Palette configuration containing all color-related theme settings.
 */
export interface Palette {
  /** Navigation component styling */
  navigation?: NavigationTheme;
  /** Header component styling */
  header?: HeaderTheme;
  /** Canvas component styling */
  canvas?: CanvasTheme;
  /** Primary color definitions */
  primary?: ColorTheme;
}

/**
 * Images configuration containing logo and visual assets.
 */
export interface Images {
  /** Logo configuration */
  logo?: LogoTheme;
}

/**
 * Typography configuration containing font settings.
 */
export interface Typography {
  /** Font family configuration */
  fontFamily?: FontFamilyTheme;
}

/**
 * Main theme configuration containing all theme components.
 */
export interface Theme {
  /** Color palette configuration */
  palette?: Palette;
  /** Images and visual assets configuration */
  images?: Images;
  /** Typography configuration */
  typography?: Typography;
}

/**
 * Workspace theme supporting both light and dark themes.
 */
export interface WorkspaceTheme {
  /** Light theme configuration */
  light?: Theme;
  /** Dark theme configuration */
  dark?: Theme;
}
