import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
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
import { useResponsiveLayout } from "../hooks/useResponsiveLayout";
import { useThemedStyles } from "../hooks/useThemedStyles";
import { useFavorites } from "../state/FavoritesContext";
import { useTheme } from "../state/ThemeContext";
import type { RootStackParamList } from "../navigation/types";

type TextDetailRoute = RouteProp<RootStackParamList, "HymnTextDetail">;

export function HymnTextDetailScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { params } = useRoute<TextDetailRoute>();
  const { hymnId } = params;
  const { isFavorite, toggleFavorite } = useFavorites();
  const { colors, isDark } = useTheme();
  const styles = useThemedStyles(createStyles);
  const layout = useResponsiveLayout();

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

  return (
    <SafeAreaView style={styles.container} edges={["left", "right", "bottom"]}>
      <StatusBar style={isDark ? "light" : "dark"} />
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
            styles.headerInner,
            layout.isTablet && { maxWidth: layout.contentMaxWidth, alignSelf: "center", width: "100%" },
          ]}
        >
          <View style={styles.headerRow}>
            <Pressable
              onPress={() => navigation.goBack()}
              style={styles.backButton}
              hitSlop={8}
            >
              <Ionicons
                name="chevron-back"
                size={layout.backIconSize}
                color={colors.accent}
              />
              <Text style={styles.backText}>Back</Text>
            </Pressable>
            <View style={styles.headerActions}>
              <Pressable
                hitSlop={10}
                onPress={() => navigation.navigate("HymnImageDetail", { hymnId })}
                accessibilityRole="button"
                accessibilityLabel="View sheet music"
                style={styles.headerActionButton}
              >
                <Ionicons
                  name="musical-notes-outline"
                  size={layout.actionIconSize}
                  color={colors.accent}
                />
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
                  size={layout.actionIconSize + 2}
                  color={favorite ? colors.accent : colors.textSecondary}
                />
              </Pressable>
            </View>
          </View>
          {hymn && (
            <>
              <Text style={[styles.title, { fontSize: layout.titleFontSize }]}>
                {hymn.title}
              </Text>
              <Text style={[styles.author, { fontSize: layout.authorFontSize }]}>
                by {hymn.author}
              </Text>
            </>
          )}
        </View>
      </View>

      {loading && (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      )}

      {error && (
        <View style={[styles.errorBox, { marginHorizontal: layout.screenPadding }]}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable onPress={loadHymn} style={styles.retryButton}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      )}

      {!loading && !error && hymn && (
        <ScrollView
          contentContainerStyle={[
            styles.lyricsContainer,
            {
              paddingHorizontal: layout.screenPadding,
              maxWidth: layout.contentMaxWidth,
              width: "100%",
              alignSelf: "center",
            },
          ]}
        >
          <Text
            style={[
              styles.lyrics,
              {
                fontSize: layout.lyricsFontSize,
                lineHeight: layout.lyricsLineHeight,
              },
            ]}
          >
            {hymn.lyrics}
          </Text>
        </ScrollView>
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
      paddingBottom: spacing.md,
    },
    headerInner: {
      width: "100%",
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      minHeight: 44,
    },
    headerActions: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
    },
    headerActionButton: {
      padding: spacing.xs,
    },
    backButton: {
      flexDirection: "row",
      alignItems: "center",
      alignSelf: "flex-start",
      paddingVertical: spacing.xs,
      paddingRight: spacing.sm,
    },
    backText: {
      color: colors.accent,
      fontSize: fontSizes.md,
      fontWeight: "600",
    },
    title: {
      fontWeight: "700",
      color: colors.textPrimary,
      marginTop: spacing.md,
    },
    author: {
      color: colors.accent,
      marginTop: spacing.xs,
    },
    lyricsContainer: {
      paddingBottom: 48,
      paddingTop: spacing.sm,
    },
    lyrics: {
      color: colors.textBody,
    },
    centered: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    errorBox: {
      marginVertical: spacing.xl,
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
