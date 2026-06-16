import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { HymnSummary } from "@hymn-app/shared-types";
import { colors, fontSizes, spacing } from "@hymn-app/shared-themes";
import { getHymns } from "../api";
import { ScreenContainer } from "../components/ScreenContainer";
import { HymnCard } from "../components/HymnCard";
import { useFavorites } from "../state/FavoritesContext";
import type { RootStackParamList } from "../navigation/types";

type Navigation = NativeStackNavigationProp<RootStackParamList>;

export function FavoritesScreen() {
  const navigation = useNavigation<Navigation>();
  const { favoriteIds, isFavorite, toggleFavorite } = useFavorites();

  const [allHymns, setAllHymns] = useState<HymnSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadHymns = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setAllHymns(await getHymns());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load hymns");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHymns();
  }, [loadHymns]);

  const favorites = allHymns.filter((hymn) => favoriteIds.includes(hymn.id));

  return (
    <ScreenContainer
      title="Favorites"
      subtitle="Hymns you've starred"
      padded={false}
    >
      {loading && (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      )}

      {error && !loading && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable onPress={loadHymns} style={styles.retryButton}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      )}

      {!loading && !error && (
        <FlatList
          data={favorites}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons
                name="star-outline"
                size={48}
                color={colors.textSecondary}
              />
              <Text style={styles.emptyTitle}>No favorites yet</Text>
              <Text style={styles.emptyText}>
                Tap the star on any hymn to save it here.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <HymnCard
              hymn={item}
              isFavorite={isFavorite(item.id)}
              onPress={() =>
                navigation.navigate("HymnDetail", { hymnId: item.id })
              }
              onToggleFavorite={() => toggleFavorite(item.id)}
            />
          )}
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  list: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
    gap: spacing.md,
    flexGrow: 1,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
  },
  emptyTitle: {
    fontSize: fontSizes.lg,
    fontWeight: "600",
    color: colors.textPrimary,
    marginTop: spacing.md,
  },
  emptyText: {
    fontSize: fontSizes.md,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: spacing.xs,
  },
  errorBox: {
    margin: spacing.xl,
    padding: spacing.lg,
    backgroundColor: colors.errorBackground,
    borderRadius: 10,
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
