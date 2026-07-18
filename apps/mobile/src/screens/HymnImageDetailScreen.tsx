import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
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
import { fontSizes, palette, radii, spacing } from "@hymn-app/shared-themes";
import { SheetMusicViewerModal } from "../components/SheetMusicViewerModal";
import { getHymn } from "../api";
import { useResponsiveLayout } from "../hooks/useResponsiveLayout";
import { useThemedStyles } from "../hooks/useThemedStyles";
import { useFavorites } from "../state/FavoritesContext";
import { useTheme } from "../state/ThemeContext";
import type { RootStackParamList } from "../navigation/types";
import { computeContainedSize, computeWidthScaledSize } from "../utils/sheetMusicLayout";

type ImageDetailRoute = RouteProp<RootStackParamList, "HymnImageDetail">;

const PREVIEW_MAX_HEIGHT_RATIO = 0.45;

function SheetMusicPage({
  uri,
  pageNumber,
  totalPages,
  width,
  maxHeight,
  scrollable,
  onPress,
  onError,
}: {
  uri: string;
  pageNumber: number;
  totalPages: number;
  width: number;
  maxHeight: number;
  scrollable?: boolean;
  onPress: () => void;
  onError: () => void;
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createPageStyles);
  const [loading, setLoading] = useState(true);
  const [displaySize, setDisplaySize] = useState<{ width: number; height: number } | null>(
    null,
  );

  const computeSize = (naturalWidth: number, naturalHeight: number) =>
    scrollable
      ? computeWidthScaledSize(naturalWidth, naturalHeight, width)
      : computeContainedSize(naturalWidth, naturalHeight, width, maxHeight);

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
        accessibilityLabel={
          scrollable ? "View sheet music full screen" : `View page ${pageNumber} full screen`
        }
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
              : { width, height: scrollable ? width * 1.2 : maxHeight * 0.5 }
          }
          resizeMode="contain"
          onLoad={(event) => {
            const { width: naturalWidth, height: naturalHeight } = event.nativeEvent.source;
            setDisplaySize(computeSize(naturalWidth, naturalHeight));
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
  const { height: windowHeight } = useWindowDimensions();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { colors, isDark } = useTheme();
  const styles = useThemedStyles(createStyles);
  const layout = useResponsiveLayout();
  const imageWidth = Math.min(
    layout.contentMaxWidth,
    layout.width - layout.screenPadding * 2,
  );
  const previewMaxHeight =
    windowHeight * (layout.isTablet ? 0.55 : PREVIEW_MAX_HEIGHT_RATIO);

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
  const isScrollableSinglePage = imageUrls.length === 1;
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
            layout.isTablet && {
              maxWidth: layout.contentMaxWidth,
              alignSelf: "center",
              width: "100%",
            },
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
                onPress={() => navigation.navigate("HymnTextDetail", { hymnId })}
                accessibilityRole="button"
                accessibilityLabel="View lyrics"
                style={styles.headerActionButton}
              >
                <Ionicons
                  name="document-text-outline"
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
        <ScrollView
          contentContainerStyle={[
            styles.imageContainer,
            {
              paddingHorizontal: layout.screenPadding,
              maxWidth: layout.contentMaxWidth + layout.screenPadding * 2,
              width: "100%",
              alignSelf: "center",
            },
          ]}
        >
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
                  scrollable={isScrollableSinglePage}
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
    imageContainer: {
      paddingBottom: 48,
      paddingTop: spacing.sm,
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
