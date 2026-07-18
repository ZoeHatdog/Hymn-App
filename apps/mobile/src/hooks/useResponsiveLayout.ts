import { useMemo } from "react";
import { useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fontSizes, spacing } from "@hymn-app/shared-themes";

/** Shortest side ≥ 600dp is the common Android/iPad tablet breakpoint. */
const TABLET_SHORTEST_SIDE = 600;

/**
 * Layout tokens that scale phone vs tablet so reading screens feel intentional
 * on wide canvases (e.g. 1280×800) instead of phone UI stretched thin.
 */
export function useResponsiveLayout() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  return useMemo(() => {
    const shortestSide = Math.min(width, height);
    const isTablet = shortestSide >= TABLET_SHORTEST_SIDE;
    const isLandscape = width > height;

    // Reading column: keep a comfortable measure on wide screens
    const contentMaxWidth = isTablet ? (isLandscape ? 760 : 680) : width;
    const screenPadding = isTablet ? spacing.xxl : spacing.xl;

    // Pull chrome down from the top edge — tablets often report tiny/zero top insets
    const headerPaddingTop =
      Math.max(insets.top, isTablet ? spacing.md : 0) +
      (isTablet ? spacing.xl : spacing.lg);

    return {
      width,
      height,
      insets,
      isTablet,
      isLandscape,
      contentMaxWidth,
      screenPadding,
      headerPaddingTop,
      headerPaddingHorizontal: screenPadding,
      titleFontSize: isTablet ? fontSizes.xxl + 4 : fontSizes.xl,
      authorFontSize: isTablet ? fontSizes.md : fontSizes.sm,
      lyricsFontSize: isTablet ? 23 : 17,
      lyricsLineHeight: isTablet ? 38 : 28,
      backIconSize: isTablet ? 24 : 20,
      actionIconSize: isTablet ? 26 : 22,
      optionCardPadding: isTablet ? spacing.xl : spacing.lg,
      optionTitleSize: isTablet ? fontSizes.xl : fontSizes.lg,
    };
  }, [width, height, insets.top, insets.bottom, insets.left, insets.right]);
}
