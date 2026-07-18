import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  PanResponder,
  Pressable,
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
  type RouteProp,
} from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { Hymn } from "@hymn-app/shared-types";
import type { ThemeColors } from "@hymn-app/shared-themes";
import { fontSizes, radii, spacing } from "@hymn-app/shared-themes";
import { getHymn } from "../api";
import { useResponsiveLayout } from "../hooks/useResponsiveLayout";
import { useThemedStyles } from "../hooks/useThemedStyles";
import { useFavorites } from "../state/FavoritesContext";
import { useTheme } from "../state/ThemeContext";
import type { RootStackParamList } from "../navigation/types";

type PickerRoute = RouteProp<RootStackParamList, "HymnViewPicker">;
type Navigation = NativeStackNavigationProp<RootStackParamList>;
type SwipeHint = "lyrics" | "notes" | null;

const SWIPE_THRESHOLD = 60;
const SWIPE_LOCK = 20;
const HINT_THRESHOLD = 24;

export function HymnViewPickerScreen() {
  const navigation = useNavigation<Navigation>();
  const { params } = useRoute<PickerRoute>();
  const { hymnId } = params;
  const { isFavorite, toggleFavorite } = useFavorites();
  const { colors, isDark } = useTheme();
  const styles = useThemedStyles(createStyles);
  const layout = useResponsiveLayout();

  const [hymn, setHymn] = useState<Hymn | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [swipeHint, setSwipeHint] = useState<SwipeHint>(null);

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
  const canSwipe = !loading && !error && !!hymn;

  const openLyrics = useCallback(() => {
    navigation.navigate("HymnTextDetail", { hymnId });
  }, [hymnId, navigation]);

  const openNotes = useCallback(() => {
    navigation.navigate("HymnImageDetail", { hymnId });
  }, [hymnId, navigation]);

  const openLyricsRef = useRef(openLyrics);
  const openNotesRef = useRef(openNotes);
  const canSwipeRef = useRef(canSwipe);
  const setSwipeHintRef = useRef(setSwipeHint);
  openLyricsRef.current = openLyrics;
  openNotesRef.current = openNotes;
  canSwipeRef.current = canSwipe;
  setSwipeHintRef.current = setSwipeHint;

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        // Don't steal taps — only claim once the finger moves horizontally
        onMoveShouldSetPanResponder: (_, gesture) =>
          canSwipeRef.current &&
          Math.abs(gesture.dx) > SWIPE_LOCK &&
          Math.abs(gesture.dx) > Math.abs(gesture.dy),
        onMoveShouldSetPanResponderCapture: (_, gesture) =>
          canSwipeRef.current &&
          Math.abs(gesture.dx) > SWIPE_LOCK &&
          Math.abs(gesture.dx) > Math.abs(gesture.dy),
        onPanResponderMove: (_, gesture) => {
          if (!canSwipeRef.current) return;
          if (Math.abs(gesture.dx) < HINT_THRESHOLD) {
            setSwipeHintRef.current(null);
            return;
          }
          if (Math.abs(gesture.dy) > Math.abs(gesture.dx)) {
            setSwipeHintRef.current(null);
            return;
          }
          setSwipeHintRef.current(gesture.dx < 0 ? "lyrics" : "notes");
        },
        onPanResponderRelease: (_, gesture) => {
          setSwipeHintRef.current(null);
          if (!canSwipeRef.current) return;
          if (Math.abs(gesture.dx) < SWIPE_THRESHOLD) return;
          if (Math.abs(gesture.dy) > Math.abs(gesture.dx)) return;

          // swipe left → Lyrics, swipe right → Notes
          if (gesture.dx < 0) {
            openLyricsRef.current();
          } else {
            openNotesRef.current();
          }
        },
        onPanResponderTerminate: () => {
          setSwipeHintRef.current(null);
        },
      }),
    [],
  );

  const contentColumn = layout.isTablet
    ? { maxWidth: layout.contentMaxWidth, width: "100%" as const, alignSelf: "center" as const }
    : undefined;

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
        <View style={[styles.headerInner, contentColumn]}>
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
        <View
          style={[
            styles.options,
            { paddingHorizontal: layout.screenPadding },
            contentColumn,
          ]}
          {...panResponder.panHandlers}
        >
          <Pressable
            style={({ pressed }) => [
              styles.optionCard,
              { padding: layout.optionCardPadding },
              pressed && styles.optionPressed,
            ]}
            onPress={openLyrics}
          >
            <View style={[styles.optionIcon, layout.isTablet && styles.optionIconTablet]}>
              <Ionicons
                name="document-text-outline"
                size={layout.isTablet ? 32 : 28}
                color={colors.accent}
              />
            </View>
            <View style={styles.optionText}>
              <Text style={[styles.optionTitle, { fontSize: layout.optionTitleSize }]}>
                Lyrics
              </Text>
              <Text style={styles.optionSubtitle}>Read the full text</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.optionCard,
              { padding: layout.optionCardPadding },
              pressed && styles.optionPressed,
            ]}
            onPress={openNotes}
          >
            <View style={[styles.optionIcon, layout.isTablet && styles.optionIconTablet]}>
              <Ionicons
                name="musical-notes-outline"
                size={layout.isTablet ? 32 : 28}
                color={colors.accent}
              />
            </View>
            <View style={styles.optionText}>
              <Text style={[styles.optionTitle, { fontSize: layout.optionTitleSize }]}>
                Notes
              </Text>
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

          {swipeHint && (
            <View style={styles.swipeHint} pointerEvents="none">
              <Ionicons
                name={swipeHint === "lyrics" ? "chevron-back" : "chevron-forward"}
                size={18}
                color={colors.accent}
              />
              <Text style={styles.swipeHintText}>
                {swipeHint === "lyrics"
                  ? "Swipe left for Lyrics"
                  : "Swipe right for Notes"}
              </Text>
            </View>
          )}
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
    options: {
      flex: 1,
      paddingTop: spacing.xl,
      paddingBottom: spacing.xl,
      gap: spacing.md,
    },
    optionCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.surface,
      borderRadius: radii.lg,
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
    optionIconTablet: {
      width: 56,
      height: 56,
    },
    optionText: {
      flex: 1,
    },
    optionTitle: {
      fontWeight: "600",
      color: colors.textPrimary,
    },
    optionSubtitle: {
      fontSize: fontSizes.sm,
      color: colors.textSecondary,
      marginTop: spacing.xs,
    },
    swipeHint: {
      marginTop: "auto",
      marginBottom: spacing.xl,
      alignSelf: "center",
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      backgroundColor: colors.surface,
      borderRadius: radii.lg,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
    },
    swipeHintText: {
      fontSize: fontSizes.md,
      fontWeight: "600",
      color: colors.textPrimary,
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
