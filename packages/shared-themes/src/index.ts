/**
 * Shared design tokens for the Hymn App.
 *
 * Brand colors are taken from the TBC logo SVGs in this package
 * (Logo/SVG): deep blue #19347f and slate blue #5777a9.
 * Brand typefaces are Besley (serif) and Noto Sans (sans-serif);
 * see the licenses in "Font Files". Load them with expo-font before
 * applying the font family names below.
 */

export const palette = {
  brandBlue: "#19347f",
  brandSlate: "#5777a9",
  gold: "#ecc94b",
  navyDeep: "#111e4e",
  navySurface: "#243d8c",
  white: "#ffffff",
  offWhite: "#f7fafc",
  mist: "#cbd5e0",
  maroon: "#742a2a",
  blush: "#fed7d7",
} as const;

export type ColorScheme = "light" | "dark";

export const darkColors = {
  background: palette.navyDeep,
  // Matches the white canvas of "TBC logo.jpeg" so the logo blends in seamlessly.
  backgroundLight: palette.white,
  surface: palette.navySurface,
  primary: palette.brandBlue,
  primaryLight: palette.brandSlate,
  accent: palette.gold,
  textPrimary: palette.white,
  textSecondary: palette.mist,
  textBody: palette.offWhite,
  onPrimary: palette.white,
  onAccent: palette.navyDeep,
  border: palette.brandSlate,
  errorBackground: palette.maroon,
  errorText: palette.blush,
} as const;

export const lightColors = {
  background: palette.offWhite,
  backgroundLight: palette.white,
  surface: palette.white,
  primary: palette.brandBlue,
  primaryLight: palette.brandSlate,
  accent: palette.gold,
  textPrimary: palette.navyDeep,
  textSecondary: palette.brandSlate,
  textBody: palette.navyDeep,
  onPrimary: palette.white,
  onAccent: palette.navyDeep,
  border: palette.mist,
  errorBackground: palette.maroon,
  errorText: palette.blush,
} as const;

export type ThemeColors = { [K in keyof typeof darkColors]: string };

/** @deprecated Use `darkColors`, `lightColors`, or `useTheme()` instead. */
export const colors = darkColors;

export function getColorsForScheme(scheme: ColorScheme): ThemeColors {
  return scheme === "dark" ? darkColors : lightColors;
}

export const fonts = {
  serif: "Besley",
  sans: "Noto Sans",
} as const;

export const fontSizes = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 24,
  xxl: 28,
  display: 36,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 32,
} as const;

export const radii = {
  sm: 8,
  md: 10,
  lg: 12,
  pill: 999,
} as const;

export const theme = {
  palette,
  colors,
  fonts,
  fontSizes,
  spacing,
  radii,
} as const;

export type Theme = typeof theme;

export default theme;
