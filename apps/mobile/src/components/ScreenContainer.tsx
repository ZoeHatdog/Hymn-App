import type { ReactNode } from "react";
import { SafeAreaView, StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import type { ThemeColors } from "@hymn-app/shared-themes";
import { fontSizes, spacing } from "@hymn-app/shared-themes";
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style={isDark ? "light" : "dark"} />
      {(title || subtitle) && (
        <View style={styles.header}>
          <View style={styles.headerText}>
            {title ? <Text style={styles.title}>{title}</Text> : null}
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          </View>
          {headerRight ? <View>{headerRight}</View> : null}
        </View>
      )}
      <View style={[styles.body, padded && styles.bodyPadded]}>{children}</View>
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
      flexDirection: "row",
      alignItems: "flex-end",
      justifyContent: "space-between",
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.lg,
      paddingBottom: spacing.md,
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
    bodyPadded: {
      paddingHorizontal: spacing.xl,
    },
  });
