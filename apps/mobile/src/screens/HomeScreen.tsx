import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import type { ThemeColors } from "@hymn-app/shared-themes";
import { fontSizes, radii, spacing } from "@hymn-app/shared-themes";
import { ScreenContainer } from "../components/ScreenContainer";
import { useThemedStyles } from "../hooks/useThemedStyles";
import { useFavorites } from "../state/FavoritesContext";
import { useTheme } from "../state/ThemeContext";
import type { MainTabParamList } from "../navigation/types";

import logo from "../../../../packages/shared-themes/TBC logo.jpeg";

type Navigation = BottomTabNavigationProp<MainTabParamList>;

type IconName = keyof typeof Ionicons.glyphMap;

interface QuickAction {
  label: string;
  description: string;
  icon: IconName;
  target: keyof MainTabParamList;
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    label: "Browse hymns",
    description: "Search the full collection",
    icon: "search",
    target: "Browse",
  },
  {
    label: "Your favorites",
    description: "Hymns you've starred",
    icon: "star",
    target: "Favorites",
  },
  {
    label: "Table of contents",
    description: "Jump by number",
    icon: "list",
    target: "Contents",
  },
];

export function HomeScreen() {
  const navigation = useNavigation<Navigation>();
  const { favoriteIds } = useFavorites();
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <ScreenContainer padded={false}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Image source={logo} style={styles.logo} resizeMode="contain" />
          <Text style={styles.welcome}>Welcome back</Text>
          <Text style={styles.heroTitle}>Hymn App</Text>
          <Text style={styles.heroSubtitle}>
            {favoriteIds.length > 0
              ? `You have ${favoriteIds.length} favorite ${
                  favoriteIds.length === 1 ? "hymn" : "hymns"
                } saved.`
              : "Browse, search, and read hymns wherever you are."}
          </Text>
        </View>

        <Text style={styles.sectionLabel}>Quick actions</Text>
        <View style={styles.actions}>
          {QUICK_ACTIONS.map((action) => (
            <Pressable
              key={action.target}
              style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
              onPress={() => navigation.navigate(action.target)}
            >
              <View style={styles.iconBadge}>
                <Ionicons name={action.icon} size={22} color={colors.onAccent} />
              </View>
              <View style={styles.cardText}>
                <Text style={styles.cardTitle}>{action.label}</Text>
                <Text style={styles.cardDescription}>{action.description}</Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.textSecondary}
              />
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    content: {
      padding: spacing.xl,
      paddingBottom: spacing.xxl,
    },
    hero: {
      alignItems: "center",
      marginBottom: spacing.xxl,
    },
    logo: {
      width: 96,
      height: 96,
      marginBottom: spacing.md,
    },
    welcome: {
      fontSize: fontSizes.sm,
      color: colors.textSecondary,
      textTransform: "uppercase",
      letterSpacing: 1,
    },
    heroTitle: {
      fontSize: fontSizes.display,
      fontWeight: "700",
      color: colors.textPrimary,
      marginTop: spacing.xs,
    },
    heroSubtitle: {
      fontSize: fontSizes.md,
      color: colors.textBody,
      textAlign: "center",
      marginTop: spacing.sm,
      lineHeight: 22,
    },
    sectionLabel: {
      fontSize: fontSizes.sm,
      fontWeight: "700",
      color: colors.textSecondary,
      textTransform: "uppercase",
      letterSpacing: 1,
      marginBottom: spacing.md,
    },
    actions: {
      gap: spacing.md,
    },
    card: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.surface,
      borderRadius: radii.lg,
      padding: spacing.lg,
      gap: spacing.md,
    },
    cardPressed: {
      opacity: 0.85,
    },
    iconBadge: {
      width: 44,
      height: 44,
      borderRadius: radii.pill,
      backgroundColor: colors.accent,
      alignItems: "center",
      justifyContent: "center",
    },
    cardText: {
      flex: 1,
    },
    cardTitle: {
      fontSize: fontSizes.lg,
      fontWeight: "600",
      color: colors.textPrimary,
    },
    cardDescription: {
      fontSize: fontSizes.sm,
      color: colors.textSecondary,
      marginTop: 2,
    },
  });
