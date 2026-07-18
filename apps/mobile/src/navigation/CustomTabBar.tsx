import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import type { ThemeColors } from "@hymn-app/shared-themes";
import { fontSizes, radii, spacing } from "@hymn-app/shared-themes";
import { useResponsiveLayout } from "../hooks/useResponsiveLayout";
import { useThemedStyles } from "../hooks/useThemedStyles";
import { useTheme } from "../state/ThemeContext";
import type { MainTabParamList } from "./types";

type IconName = keyof typeof Ionicons.glyphMap;

interface TabMeta {
  label: string;
  icon: IconName;
  iconActive: IconName;
}

const TAB_META: Record<keyof MainTabParamList, TabMeta> = {
  Home: { label: "Home", icon: "home-outline", iconActive: "home" },
  Browse: { label: "Browse", icon: "search-outline", iconActive: "search" },
  Favorites: { label: "Favorites", icon: "star-outline", iconActive: "star" },
  Contents: { label: "Contents", icon: "list-outline", iconActive: "list" },
  Settings: {
    label: "Settings",
    icon: "settings-outline",
    iconActive: "settings",
  },
};

export function CustomTabBar({
  state,
  navigation,
}: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const { isTablet } = useResponsiveLayout();
  const iconSize = isTablet ? 24 : 22;

  return (
    <View
      style={[
        styles.bar,
        {
          paddingBottom: Math.max(insets.bottom, spacing.sm),
          paddingTop: isTablet ? spacing.md : spacing.sm,
        },
      ]}
    >
      {state.routes.map((route, index) => {
        const meta = TAB_META[route.name as keyof MainTabParamList];
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <Pressable
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={meta.label}
            onPress={onPress}
            style={styles.tab}
          >
            <View
              style={[
                styles.iconWrap,
                isTablet && styles.iconWrapTablet,
                isFocused && styles.iconWrapActive,
              ]}
            >
              <Ionicons
                name={isFocused ? meta.iconActive : meta.icon}
                size={iconSize}
                color={isFocused ? colors.onAccent : colors.textSecondary}
              />
            </View>
            <Text
              style={[
                styles.label,
                isTablet && styles.labelTablet,
                isFocused && styles.labelActive,
              ]}
              numberOfLines={1}
            >
              {meta.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    bar: {
      flexDirection: "row",
      backgroundColor: colors.surface,
      paddingTop: spacing.sm,
      borderTopLeftRadius: radii.lg,
      borderTopRightRadius: radii.lg,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 12,
    },
    tab: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: 2,
    },
    iconWrap: {
      width: 44,
      height: 32,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: radii.pill,
    },
    iconWrapTablet: {
      width: 52,
      height: 36,
    },
    iconWrapActive: {
      backgroundColor: colors.accent,
    },
    label: {
      fontSize: fontSizes.xs,
      color: colors.textSecondary,
    },
    labelTablet: {
      fontSize: fontSizes.sm,
    },
    labelActive: {
      color: colors.accent,
      fontWeight: "700",
    },
  });
