import {
  TEAL_100,
  TEAL_300,
  TEAL_400,
  TEAL_600,
  TEAL_700,
} from "./connect-constants";
import { Overrides } from "./supported-overrides";

export const CONNECT_OVERRIDES: Overrides = {
  brandColor: { light: TEAL_600, dark: TEAL_400 },
  brandColorActive: { light: TEAL_700, dark: TEAL_300 },
  lightBrandBackground: TEAL_100,
};
