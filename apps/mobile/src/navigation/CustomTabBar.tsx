import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { colors, fontSizes, radii, spacing } from "@hymn-app/shared-themes";
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

  return (
    <View
      style={[
        styles.bar,
        { paddingBottom: Math.max(insets.bottom, spacing.sm) },
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
            <View style={[styles.iconWrap, isFocused && styles.iconWrapActive]}>
              <Ionicons
                name={isFocused ? meta.iconActive : meta.icon}
                size={22}
                color={isFocused ? colors.background : colors.textSecondary}
              />
            </View>
            <Text
              style={[styles.label, isFocused && styles.labelActive]}
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

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    paddingTop: spacing.sm,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.primaryLight,
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
  iconWrapActive: {
    backgroundColor: colors.accent,
  },
  label: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
  },
  labelActive: {
    color: colors.accent,
    fontWeight: "700",
  },
});
