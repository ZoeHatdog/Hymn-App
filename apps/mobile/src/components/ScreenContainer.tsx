import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import type { ThemeColors } from "@hymn-app/shared-themes";
import { fontSizes, spacing } from "@hymn-app/shared-themes";
import { useResponsiveLayout } from "../hooks/useResponsiveLayout";
import { useThemedStyles } from "../hooks/useThemedStyles";
import { useTheme } from "../state/ThemeContext";

interface ScreenContainerProps {
  title?: string;
  subtitle?: string;
  /** Optional element rendered on the right of the header (e.g. an action). */
  headerRight?: ReactNode;
  /** When false, the body is not padded (useful for full-bleed lists). */
  padded?: boolean;
  children: ReactNode;
}

/**
 * Shared shell for every tab section: safe-area aware, branded background,
 * and a consistent header. Keeps individual screens focused on their content.
 */
export function ScreenContainer({
  title,
  subtitle,
  headerRight,
  padded = true,
  children,
}: ScreenContainerProps) {
  const { isDark } = useTheme();
  const styles = useThemedStyles(createStyles);
  const layout = useResponsiveLayout();

  return (
    <SafeAreaView style={styles.safeArea} edges={["left", "right", "bottom"]}>
      <StatusBar style={isDark ? "light" : "dark"} />
      {(title || subtitle) && (
        <View
          style={[
            styles.header,
            {
              paddingTop: layout.headerPaddingTop,
              paddingHorizontal: layout.headerPaddingHorizontal,
            },
          ]}
        >
          <View
            style={[
              styles.headerRow,
              layout.isTablet && {
                maxWidth: layout.contentMaxWidth,
                width: "100%",
                alignSelf: "center",
              },
            ]}
          >
            <View style={styles.headerText}>
              {title ? (
                <Text
                  style={[
                    styles.title,
                    layout.isTablet && { fontSize: fontSizes.display },
                  ]}
                >
                  {title}
                </Text>
              ) : null}
              {subtitle ? (
                <Text
                  style={[
                    styles.subtitle,
                    layout.isTablet && { fontSize: fontSizes.md },
                  ]}
                >
                  {subtitle}
                </Text>
              ) : null}
            </View>
            {headerRight ? <View>{headerRight}</View> : null}
          </View>
        </View>
      )}
      <View
        style={[
          styles.body,
          padded && {
            paddingHorizontal: layout.screenPadding,
          },
          layout.isTablet &&
            padded && {
              maxWidth: layout.contentMaxWidth + layout.screenPadding * 2,
              width: "100%",
              alignSelf: "center",
            },
        ]}
      >
        {children}
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      paddingBottom: spacing.md,
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "flex-end",
      justifyContent: "space-between",
    },
    headerText: {
      flex: 1,
    },
    title: {
      fontSize: fontSizes.xxl,
      fontWeight: "700",
      color: colors.textPrimary,
    },
    subtitle: {
      fontSize: fontSizes.sm,
      color: colors.textSecondary,
      marginTop: spacing.xs,
    },
    body: {
      flex: 1,
    },
  });
