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
import type { ThemeColors } from "@hymn-app/shared-themes";
import { fontSizes, palette, radii, spacing } from "@hymn-app/shared-themes";
import { SheetMusicViewerModal } from "../components/SheetMusicViewerModal";
import { getHymn } from "../api";
import { useThemedStyles } from "../hooks/useThemedStyles";
import { useFavorites } from "../state/FavoritesContext";
import { useTheme } from "../state/ThemeContext";
import type { RootStackParamList } from "../navigation/types";
import { computeContainedSize } from "../utils/sheetMusicLayout";

type ImageDetailRoute = RouteProp<RootStackParamList, "HymnImageDetail">;

const PREVIEW_MAX_HEIGHT_RATIO = 0.45;

function SheetMusicPage({
  uri,
  pageNumber,
  totalPages,
  width,
  maxHeight,
  onPress,
  onError,
}: {
  uri: string;
  pageNumber: number;
  totalPages: number;
  width: number;
  maxHeight: number;
  onPress: () => void;
  onError: () => void;
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createPageStyles);
  const [loading, setLoading] = useState(true);
  const [displaySize, setDisplaySize] = useState<{ width: number; height: number } | null>(
    null,
  );

  return (
    <View style={styles.pageBlock}>
      {totalPages > 1 && (
        <Text style={styles.pageLabel}>
          Page {pageNumber} of {totalPages}
        </Text>
      )}
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.imagePressable, pressed && styles.imagePressed]}
        accessibilityRole="button"
        accessibilityLabel={`View page ${pageNumber} full screen`}
        accessibilityHint="Opens sheet music viewer"
      >
        {loading && (
          <View style={styles.pageLoading}>
            <ActivityIndicator size="small" color={colors.accent} />
          </View>
        )}
        <Image
          source={{ uri }}
          style={
            displaySize
              ? { width: displaySize.width, height: displaySize.height }
              : { width, height: maxHeight * 0.5 }
          }
          resizeMode="contain"
          onLoad={(event) => {
            const { width: naturalWidth, height: naturalHeight } = event.nativeEvent.source;
            setDisplaySize(
              computeContainedSize(naturalWidth, naturalHeight, width, maxHeight),
            );
            setLoading(false);
          }}
          onError={() => {
            setLoading(false);
            onError();
          }}
        />
        <View style={styles.expandHint}>
          <Ionicons name="expand-outline" size={18} color={palette.white} />
        </View>
      </Pressable>
    </View>
  );
}

export function HymnImageDetailScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { params } = useRoute<ImageDetailRoute>();
  const { hymnId } = params;
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { colors, isDark } = useTheme();
  const styles = useThemedStyles(createStyles);
  const imageWidth = windowWidth - spacing.xl * 2;
  const previewMaxHeight = windowHeight * PREVIEW_MAX_HEIGHT_RATIO;

  const [hymn, setHymn] = useState<Hymn | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [failedPages, setFailedPages] = useState<number[]>([]);
  const [reloadKey, setReloadKey] = useState(0);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);

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

  const openViewer = (index: number) => {
    setViewerIndex(index);
    setViewerOpen(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style={isDark ? "light" : "dark"} />
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
                  maxHeight={previewMaxHeight}
                  onPress={() => openViewer(index)}
                  onError={() => markPageFailed(index)}
                />
              ),
            )
          )}
        </ScrollView>
      )}

      <SheetMusicViewerModal
        visible={viewerOpen}
        imageUrls={imageUrls}
        initialIndex={viewerIndex}
        onClose={() => setViewerOpen(false)}
      />
    </SafeAreaView>
  );
}

const createPageStyles = (colors: ThemeColors) =>
  StyleSheet.create({
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
    imagePressable: {
      alignItems: "center",
      position: "relative",
    },
    imagePressed: {
      opacity: 0.88,
    },
    expandHint: {
      position: "absolute",
      bottom: spacing.sm,
      right: spacing.sm,
      padding: spacing.xs,
      borderRadius: radii.sm,
      backgroundColor: "rgba(0, 0, 0, 0.45)",
    },
    pageLoading: {
      paddingVertical: spacing.lg,
    },
  });

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
