import { useCallback, useEffect, useState } from "react";
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
import { colors, fontSizes, radii, spacing } from "@hymn-app/shared-themes";
import { getHymns } from "../api";
import { ScreenContainer } from "../components/ScreenContainer";
import type { RootStackParamList } from "../navigation/types";

type Navigation = NativeStackNavigationProp<RootStackParamList>;

export function ContentsScreen() {
  const navigation = useNavigation<Navigation>();

  const [hymns, setHymns] = useState<HymnSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        <FlatList
          data={hymns}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No hymns found.</Text>
          }
          renderItem={({ item, index }) => (
            <Pressable
              style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
              onPress={() =>
                navigation.navigate("HymnViewPicker", { hymnId: item.id })
              }
            >
              <View style={styles.number}>
                <Text style={styles.numberText}>{index + 1}</Text>
              </View>
              <View style={styles.rowText}>
                <Text style={styles.rowTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={styles.rowAuthor} numberOfLines={1}>
                  {item.author}
                </Text>
              </View>
            </Pressable>
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
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.primaryLight,
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
