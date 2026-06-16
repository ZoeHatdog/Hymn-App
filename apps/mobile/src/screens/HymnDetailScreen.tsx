import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { Hymn } from "@hymn-app/shared-types";
import { colors, fontSizes, radii, spacing } from "@hymn-app/shared-themes";
import { getHymn } from "../api";
import { useFavorites } from "../state/FavoritesContext";
import type { RootStackParamList } from "../navigation/types";

type DetailRoute = RouteProp<RootStackParamList, "HymnDetail">;

export function HymnDetailScreen() {
  const navigation = useNavigation();
  const { params } = useRoute<DetailRoute>();
  const { hymnId } = params;
  const { isFavorite, toggleFavorite } = useFavorites();

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
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
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
        <ScrollView contentContainerStyle={styles.lyricsContainer}>
          <Text style={styles.lyrics}>{hymn.lyrics}</Text>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
  lyricsContainer: {
    padding: spacing.xl,
    paddingBottom: 40,
  },
  lyrics: {
    fontSize: 17,
    lineHeight: 28,
    color: colors.textBody,
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
