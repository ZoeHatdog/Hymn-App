import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { HymnSummary } from "@hymn-app/shared-types";
import type { ThemeColors } from "@hymn-app/shared-themes";
import { fontSizes, radii, spacing } from "@hymn-app/shared-themes";
import { getHymns, searchHymns } from "../api";
import { ScreenContainer } from "../components/ScreenContainer";
import { HymnCard } from "../components/HymnCard";
import { useThemedStyles } from "../hooks/useThemedStyles";
import { useFavorites } from "../state/FavoritesContext";
import { useTheme } from "../state/ThemeContext";
import type { RootStackParamList } from "../navigation/types";

type Navigation = NativeStackNavigationProp<RootStackParamList>;

export function HymnListScreen() {
  const navigation = useNavigation<Navigation>();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  const [hymns, setHymns] = useState<HymnSummary[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadHymns = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getHymns();
      setHymns(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load hymns");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      loadHymns();
      return;
    }

    const timeout = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const results = await searchHymns(searchQuery);
        setHymns(results);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Search failed");
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [searchQuery, loadHymns]);

  return (
    <ScreenContainer
      title="Browse"
      subtitle="Search and read every hymn"
      padded={false}
    >
      <View style={styles.searchWrap}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search hymns, tags, or library..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {loading && (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      )}

      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable onPress={loadHymns} style={styles.retryButton}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      )}

      {!loading && !error && (
        <FlatList
          data={hymns}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No hymns found.</Text>
          }
          renderItem={({ item }) => (
            <HymnCard
              hymn={item}
              isFavorite={isFavorite(item.id)}
              onPress={() =>
                navigation.navigate("HymnViewPicker", { hymnId: item.id })
              }
              onToggleFavorite={() => toggleFavorite(item.id)}
            />
          )}
        />
      )}
    </ScreenContainer>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    searchWrap: {
      paddingHorizontal: spacing.xl,
      paddingBottom: spacing.md,
    },
    searchInput: {
      backgroundColor: colors.surface,
      borderRadius: radii.md,
      paddingHorizontal: 14,
      paddingVertical: spacing.md - 2,
      color: colors.textPrimary,
      fontSize: fontSizes.md,
    },
    list: {
      paddingHorizontal: spacing.xl,
      paddingBottom: spacing.xl,
      gap: spacing.md,
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
    emptyText: {
      color: colors.textSecondary,
      textAlign: "center",
      marginTop: 40,
      fontSize: fontSizes.md,
    },
  });
