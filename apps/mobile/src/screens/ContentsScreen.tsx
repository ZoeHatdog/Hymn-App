import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { HymnSummary } from "@hymn-app/shared-types";
import type { ThemeColors } from "@hymn-app/shared-themes";
import { fontSizes, radii, spacing } from "@hymn-app/shared-themes";
import { compareHymnsByLibraryAndPage } from "@hymn-app/shared-utils";
import { getHymns } from "../api";
import { ScreenContainer } from "../components/ScreenContainer";
import { useThemedStyles } from "../hooks/useThemedStyles";
import { useTheme } from "../state/ThemeContext";
import type { RootStackParamList } from "../navigation/types";

type Navigation = NativeStackNavigationProp<RootStackParamList>;
type SortMode = "number" | "title" | "author";

const SORT_OPTIONS: { id: SortMode; label: string }[] = [
  { id: "number", label: "Number" },
  { id: "title", label: "A–Z" },
  { id: "author", label: "Author" },
];

function compareByTitle(a: HymnSummary, b: HymnSummary) {
  return a.title.localeCompare(b.title, undefined, { sensitivity: "base" });
}

function compareByAuthor(a: HymnSummary, b: HymnSummary) {
  const authorCmp = a.author.localeCompare(b.author, undefined, {
    sensitivity: "base",
  });
  if (authorCmp !== 0) return authorCmp;
  return compareByTitle(a, b);
}

export function ContentsScreen() {
  const navigation = useNavigation<Navigation>();
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  const [hymns, setHymns] = useState<HymnSummary[]>([]);
  const [sortMode, setSortMode] = useState<SortMode>("number");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const sortedHymns = useMemo(() => {
    const list = [...hymns];
    if (sortMode === "title") list.sort(compareByTitle);
    else if (sortMode === "author") list.sort(compareByAuthor);
    else list.sort(compareHymnsByLibraryAndPage);
    return list;
  }, [hymns, sortMode]);

  const loadHymns = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setHymns(await getHymns());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load hymns");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHymns();
  }, [loadHymns]);

  return (
    <ScreenContainer
      title="Contents"
      subtitle="The full hymn index"
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
        <View style={styles.sortRow}>
          {SORT_OPTIONS.map((option) => {
            const selected = option.id === sortMode;
            return (
              <Pressable
                key={option.id}
                onPress={() => setSortMode(option.id)}
                style={[styles.sortChip, selected && styles.sortChipSelected]}
              >
                <Text
                  style={[
                    styles.sortChipText,
                    selected && styles.sortChipTextSelected,
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}

      {!loading && !error && (
        <FlatList
          data={sortedHymns}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No hymns found.</Text>
          }
          renderItem={({ item }) => (
            <Pressable
              style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
              onPress={() =>
                navigation.navigate("HymnViewPicker", { hymnId: item.id })
              }
            >
              <View style={styles.number}>
                <Text style={styles.numberText}>
                  {item.page != null ? String(item.page) : "—"}
                </Text>
              </View>
              <View style={styles.rowText}>
                <Text style={styles.rowTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={styles.rowAuthor} numberOfLines={1}>
                  {item.library
                    ? `${item.library} · ${item.author}`
                    : item.author}
                </Text>
              </View>
            </Pressable>
          )}
        />
      )}
    </ScreenContainer>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    sortRow: {
      flexDirection: "row",
      gap: spacing.sm,
      paddingHorizontal: spacing.xl,
      paddingBottom: spacing.md,
    },
    sortChip: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radii.pill,
      backgroundColor: colors.surface,
    },
    sortChipSelected: {
      backgroundColor: colors.accent,
    },
    sortChipText: {
      fontSize: fontSizes.sm,
      fontWeight: "600",
      color: colors.textSecondary,
    },
    sortChipTextSelected: {
      color: colors.onAccent,
    },
    list: {
      paddingHorizontal: spacing.xl,
      paddingBottom: spacing.xl,
    },
    separator: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.border,
      opacity: 0.3,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: spacing.md,
      gap: spacing.md,
    },
    rowPressed: {
      opacity: 0.6,
    },
    number: {
      width: 36,
      height: 36,
      borderRadius: radii.pill,
      backgroundColor: colors.surface,
      alignItems: "center",
      justifyContent: "center",
    },
    numberText: {
      color: colors.accent,
      fontWeight: "700",
      fontSize: fontSizes.sm,
    },
    rowText: {
      flex: 1,
    },
    rowTitle: {
      fontSize: fontSizes.md,
      fontWeight: "600",
      color: colors.textPrimary,
    },
    rowAuthor: {
      fontSize: fontSizes.sm,
      color: colors.textSecondary,
      marginTop: 2,
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
