import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import {
  useNavigation,
  useRoute,
  type NavigationProp,
  type RouteProp,
} from "@react-navigation/native";
import type { Hymn } from "@hymn-app/shared-types";
import type { ThemeColors } from "@hymn-app/shared-themes";
import { fontSizes, radii, spacing } from "@hymn-app/shared-themes";
import { getHymn } from "../api";
import { useThemedStyles } from "../hooks/useThemedStyles";
import { useFavorites } from "../state/FavoritesContext";
import { useTheme } from "../state/ThemeContext";
import type { RootStackParamList } from "../navigation/types";

type PickerRoute = RouteProp<RootStackParamList, "HymnViewPicker">;

export function HymnViewPickerScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { params } = useRoute<PickerRoute>();
  const { hymnId } = params;
  const { isFavorite, toggleFavorite } = useFavorites();
  const { colors, isDark } = useTheme();
  const styles = useThemedStyles(createStyles);

  const [hymn, setHymn] = useState<Hymn | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadHymn = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getHymn(hymnId);
      setHymn(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load hymn");
    } finally {
      setLoading(false);
    }
  }, [hymnId]);

  useEffect(() => {
    loadHymn();
  }, [loadHymn]);

  const favorite = isFavorite(hymnId);
  const hasSheetMusic = (hymn?.imageUrls.length ?? 0) > 0;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={20} color={colors.accent} />
            <Text style={styles.backText}>Back</Text>
          </Pressable>
          <Pressable
            hitSlop={10}
            onPress={() => toggleFavorite(hymnId)}
            accessibilityRole="button"
            accessibilityLabel={
              favorite ? "Remove from favorites" : "Add to favorites"
            }
          >
            <Ionicons
              name={favorite ? "star" : "star-outline"}
              size={24}
              color={favorite ? colors.accent : colors.textSecondary}
            />
          </Pressable>
        </View>
        {hymn && (
          <>
            <Text style={styles.title}>{hymn.title}</Text>
            <Text style={styles.author}>by {hymn.author}</Text>
          </>
        )}
      </View>

      {loading && (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      )}

      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable onPress={loadHymn} style={styles.retryButton}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      )}

      {!loading && !error && hymn && (
        <View style={styles.options}>
          <Pressable
            style={({ pressed }) => [styles.optionCard, pressed && styles.optionPressed]}
            onPress={() => navigation.navigate("HymnTextDetail", { hymnId })}
          >
            <View style={styles.optionIcon}>
              <Ionicons name="document-text-outline" size={28} color={colors.accent} />
            </View>
            <View style={styles.optionText}>
              <Text style={styles.optionTitle}>Lyrics</Text>
              <Text style={styles.optionSubtitle}>Read the full text</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.optionCard, pressed && styles.optionPressed]}
            onPress={() => navigation.navigate("HymnImageDetail", { hymnId })}
          >
            <View style={styles.optionIcon}>
              <Ionicons name="musical-notes-outline" size={28} color={colors.accent} />
            </View>
            <View style={styles.optionText}>
              <Text style={styles.optionTitle}>Notes</Text>
              <Text style={styles.optionSubtitle}>
                {hasSheetMusic
                  ? hymn.imageUrls.length > 1
                    ? `View sheet music (${hymn.imageUrls.length} pages)`
                    : "View sheet music"
                  : "View sheet music — none available yet"}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.lg,
      paddingBottom: spacing.md,
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    backButton: {
      flexDirection: "row",
      alignItems: "center",
      alignSelf: "flex-start",
    },
    backText: {
      color: colors.accent,
      fontSize: fontSizes.md,
      fontWeight: "600",
    },
    title: {
      fontSize: fontSizes.xl,
      fontWeight: "700",
      color: colors.textPrimary,
      marginTop: spacing.md,
    },
    author: {
      fontSize: fontSizes.sm,
      color: colors.accent,
      marginTop: spacing.xs,
    },
    options: {
      padding: spacing.xl,
      gap: spacing.md,
    },
    optionCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.surface,
      borderRadius: radii.lg,
      padding: spacing.lg,
    },
    optionPressed: {
      opacity: 0.85,
    },
    optionIcon: {
      width: 48,
      height: 48,
      borderRadius: radii.md,
      backgroundColor: colors.background,
      alignItems: "center",
      justifyContent: "center",
      marginRight: spacing.md,
    },
    optionText: {
      flex: 1,
    },
    optionTitle: {
      fontSize: fontSizes.lg,
      fontWeight: "600",
      color: colors.textPrimary,
    },
    optionSubtitle: {
      fontSize: fontSizes.sm,
      color: colors.textSecondary,
      marginTop: spacing.xs,
    },
    centered: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    errorBox: {
      margin: spacing.xl,
      padding: spacing.lg,
      backgroundColor: colors.errorBackground,
      borderRadius: radii.md,
    },
    errorText: {
      color: colors.errorText,
      fontSize: fontSizes.sm,
    },
    retryButton: {
      marginTop: spacing.md - 2,
      alignSelf: "flex-start",
    },
    retryText: {
      color: colors.accent,
      fontWeight: "600",
    },
  });
