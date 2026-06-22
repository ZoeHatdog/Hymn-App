import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
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
import { colors, fontSizes, radii, spacing } from "@hymn-app/shared-themes";
import { getHymn } from "../api";
import { useFavorites } from "../state/FavoritesContext";
import type { RootStackParamList } from "../navigation/types";

type ImageDetailRoute = RouteProp<RootStackParamList, "HymnImageDetail">;

function SheetMusicPage({
  uri,
  pageNumber,
  totalPages,
  width,
  onError,
}: {
  uri: string;
  pageNumber: number;
  totalPages: number;
  width: number;
  onError: () => void;
}) {
  const [loading, setLoading] = useState(true);

  return (
    <View style={styles.pageBlock}>
      {totalPages > 1 && (
        <Text style={styles.pageLabel}>
          Page {pageNumber} of {totalPages}
        </Text>
      )}
      {loading && (
        <View style={styles.pageLoading}>
          <ActivityIndicator size="small" color={colors.accent} />
        </View>
      )}
      <Image
        source={{ uri }}
        style={[styles.image, { width }]}
        resizeMode="contain"
        onLoadEnd={() => setLoading(false)}
        onError={() => {
          setLoading(false);
          onError();
        }}
      />
    </View>
  );
}

export function HymnImageDetailScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { params } = useRoute<ImageDetailRoute>();
  const { hymnId } = params;
  const { width: windowWidth } = useWindowDimensions();
  const { isFavorite, toggleFavorite } = useFavorites();
  const imageWidth = windowWidth - spacing.xl * 2;

  const [hymn, setHymn] = useState<Hymn | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [failedPages, setFailedPages] = useState<number[]>([]);
  const [reloadKey, setReloadKey] = useState(0);

  const loadHymn = useCallback(async () => {
    setLoading(true);
    setError(null);
    setFailedPages([]);
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
  const imageUrls = hymn?.imageUrls ?? [];
  const hasImages = imageUrls.length > 0;
  const allPagesFailed =
    hasImages && failedPages.length === imageUrls.length;

  const markPageFailed = (index: number) => {
    setFailedPages((prev) => (prev.includes(index) ? prev : [...prev, index]));
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={20} color={colors.accent} />
            <Text style={styles.backText}>Back</Text>
          </Pressable>
          <View style={styles.headerActions}>
            <Pressable
              hitSlop={10}
              onPress={() =>
                navigation.navigate("HymnTextDetail", { hymnId })
              }
              accessibilityRole="button"
              accessibilityLabel="View lyrics"
              style={styles.headerActionButton}
            >
              <Ionicons name="document-text-outline" size={22} color={colors.accent} />
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

      {!loading && !error && hymn && !hasImages && (
        <View style={styles.centered}>
          <Ionicons name="musical-notes-outline" size={48} color={colors.textSecondary} />
          <Text style={styles.emptyTitle}>Sheet music not available</Text>
          <Text style={styles.emptyText}>
            No sheet music images have been added for this hymn yet.
          </Text>
        </View>
      )}

      {!loading && !error && hymn && hasImages && (
        <ScrollView contentContainerStyle={styles.imageContainer}>
          {allPagesFailed ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>Failed to load sheet music images.</Text>
              <Pressable
                onPress={() => {
                  setFailedPages([]);
                  setReloadKey((key) => key + 1);
                }}
                style={styles.retryButton}
              >
                <Text style={styles.retryText}>Retry</Text>
              </Pressable>
            </View>
          ) : (
            imageUrls.map((url, index) =>
              failedPages.includes(index) ? (
                <View key={`${reloadKey}-${url}`} style={styles.pageBlock}>
                  {imageUrls.length > 1 && (
                    <Text style={styles.pageLabel}>
                      Page {index + 1} of {imageUrls.length}
                    </Text>
                  )}
                  <View style={styles.pageError}>
                    <Text style={styles.pageErrorText}>Failed to load this page.</Text>
                  </View>
                </View>
              ) : (
                <SheetMusicPage
                  key={`${reloadKey}-${url}`}
                  uri={url}
                  pageNumber={index + 1}
                  totalPages={imageUrls.length}
                  width={imageWidth}
                  onError={() => markPageFailed(index)}
                />
              ),
            )
          )}
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
  imageContainer: {
    padding: spacing.xl,
    paddingBottom: 40,
    alignItems: "center",
  },
  pageBlock: {
    width: "100%",
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  pageLabel: {
    fontSize: fontSizes.sm,
    fontWeight: "600",
    color: colors.textSecondary,
    alignSelf: "flex-start",
    marginBottom: spacing.sm,
  },
  pageLoading: {
    paddingVertical: spacing.lg,
  },
  pageError: {
    padding: spacing.lg,
    backgroundColor: colors.errorBackground,
    borderRadius: radii.md,
    width: "100%",
  },
  pageErrorText: {
    color: colors.errorText,
    fontSize: fontSizes.sm,
    textAlign: "center",
  },
  image: {
    minHeight: 400,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    fontSize: fontSizes.lg,
    fontWeight: "600",
    color: colors.textPrimary,
    marginTop: spacing.lg,
    textAlign: "center",
  },
  emptyText: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    textAlign: "center",
    lineHeight: 22,
  },
  errorBox: {
    margin: spacing.xl,
    padding: spacing.lg,
    backgroundColor: colors.errorBackground,
    borderRadius: radii.md,
    width: "100%",
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
