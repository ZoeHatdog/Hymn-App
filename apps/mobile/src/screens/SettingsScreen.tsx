import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { ThemeColors } from "@hymn-app/shared-themes";
import { fontSizes, radii, spacing } from "@hymn-app/shared-themes";
import { deleteAllHymnsFromCache, saveAllHymnsToCache } from "../api";
import { formatBytes } from "../cache/disk";
import type { SaveAllHymnsResult } from "../cache/types";
import { ScreenContainer } from "../components/ScreenContainer";
import { useThemedStyles } from "../hooks/useThemedStyles";
import { useFavorites } from "../state/FavoritesContext";
import { useTheme } from "../state/ThemeContext";
import { getApiUrl } from "../config";
import type { RootStackParamList } from "../navigation/types";

type Navigation = NativeStackNavigationProp<RootStackParamList>;

type IconName = keyof typeof Ionicons.glyphMap;

interface InfoRow {
  icon: IconName;
  label: string;
  value: string;
}

export function SettingsScreen() {
  const navigation = useNavigation<Navigation>();
  const { favoriteIds } = useFavorites();
  const { colors, isDark, setColorScheme } = useTheme();
  const styles = useThemedStyles(createStyles);
  const [caching, setCaching] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [cacheProgress, setCacheProgress] = useState<string | null>(null);

  const busy = caching || clearing;

  const infoRows: InfoRow[] = [
    { icon: "star-outline", label: "Saved favorites", value: `${favoriteIds.length}` },
    { icon: "server-outline", label: "API endpoint", value: getApiUrl() },
    { icon: "information-circle-outline", label: "Version", value: "0.1.0" },
  ];

  function alertSaveAllResult(result: SaveAllHymnsResult) {
    const spaceHint =
      result.estimateBytes !== undefined && result.freeBytes !== undefined
        ? ` Estimated need ${formatBytes(result.estimateBytes)}; ${formatBytes(result.freeBytes)} free.`
        : "";

    if (result.abortedReason === "storage") {
      if (result.saved === 0 && result.failed === 0) {
        Alert.alert(
          "Not enough storage",
          `Download all was blocked to avoid filling the device.${spaceHint}`,
        );
        return;
      }

      Alert.alert(
        "Storage full",
        `Saved ${result.saved} of ${result.total} hymns, then stopped because the device is out of space.${spaceHint}`,
      );
      return;
    }

    if (result.failed === 0 && result.saved === 0 && result.skipped === result.total) {
      Alert.alert(
        "Already downloaded",
        result.total === 0
          ? "There are no hymns to save."
          : "All hymns are already downloaded for offline use.",
      );
      return;
    }

    if (result.failed === 0) {
      Alert.alert(
        "Hymns saved",
        `${result.saved} hymn${result.saved === 1 ? "" : "s"} saved for offline use.`,
      );
      return;
    }

    Alert.alert(
      "Partially saved",
      `Saved ${result.saved} of ${result.total} hymns. ${result.failed} failed (connection or server). Already-saved hymns remain available offline.`,
    );
  }

  async function handleSaveAllHymns() {
    if (busy) return;

    setCaching(true);
    setCacheProgress(null);

    try {
      const result = await saveAllHymnsToCache((done, total) => {
        setCacheProgress(`${done} / ${total}`);
      });
      alertSaveAllResult(result);
    } catch (err) {
      Alert.alert(
        "Could not save hymns",
        err instanceof Error
          ? err.message
          : "Something went wrong. Check your connection and try again.",
      );
    } finally {
      setCaching(false);
      setCacheProgress(null);
    }
  }

  function handleDeleteAllCache() {
    if (busy) return;

    Alert.alert(
      "Delete all cache?",
      "This will remove all saved hymns and their images from this device. Favorites will not be removed.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            void confirmDeleteAllCache();
          },
        },
      ],
    );
  }

  async function confirmDeleteAllCache() {
    setClearing(true);

    try {
      const cleared = await deleteAllHymnsFromCache();
      Alert.alert(
        "Cache cleared",
        cleared === 0
          ? "No cached hymns were found."
          : `Deleted ${cleared} cached hymn${cleared === 1 ? "" : "s"}.`,
      );
    } catch (err) {
      Alert.alert(
        "Could not clear cache",
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setClearing(false);
    }
  }

  return (
    <ScreenContainer title="Settings" subtitle="App info & preferences" padded={false}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionLabel}>Appearance</Text>
        <View style={styles.group}>
          <View style={styles.row}>
            <Ionicons
              name={isDark ? "moon" : "sunny"}
              size={20}
              color={colors.accent}
            />
            <Text style={styles.rowLabel}>Dark mode</Text>
            <Switch
              value={isDark}
              onValueChange={(value) => setColorScheme(value ? "dark" : "light")}
              trackColor={{ false: colors.border, true: colors.primaryLight }}
              thumbColor={isDark ? colors.accent : colors.surface}
            />
          </View>
        </View>

        <Text style={styles.sectionLabel}>Offline</Text>
        <View style={styles.group}>
          <Pressable
            style={({ pressed }) => [
              styles.row,
              styles.actionRow,
              pressed && !busy && styles.rowPressed,
            ]}
            onPress={handleSaveAllHymns}
            disabled={busy}
          >
            <Ionicons
              name="download-outline"
              size={20}
              color={colors.accent}
            />
            <Text style={styles.rowLabel}>
              {caching ? "Saving hymns…" : "Save all hymns"}
            </Text>
            {caching ? (
              <View style={styles.progress}>
                {cacheProgress ? (
                  <Text style={styles.rowValue}>{cacheProgress}</Text>
                ) : null}
                <ActivityIndicator size="small" color={colors.accent} />
              </View>
            ) : (
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.textSecondary}
              />
            )}
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.row,
              styles.actionRow,
              styles.rowBorder,
              pressed && !busy && styles.rowPressed,
            ]}
            onPress={handleDeleteAllCache}
            disabled={busy}
          >
            <Ionicons
              name="trash-outline"
              size={20}
              color={colors.accent}
            />
            <Text style={styles.rowLabel}>
              {clearing ? "Deleting cache…" : "Delete all cache"}
            </Text>
            {clearing ? (
              <ActivityIndicator size="small" color={colors.accent} />
            ) : (
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.textSecondary}
              />
            )}
          </Pressable>
        </View>

        <Text style={styles.sectionLabel}>About</Text>
        <View style={styles.group}>
          {infoRows.map((row, index) => (
            <View
              key={row.label}
              style={[styles.row, index > 0 && styles.rowBorder]}
            >
              <Ionicons name={row.icon} size={20} color={colors.accent} />
              <Text style={styles.rowLabel}>{row.label}</Text>
              <Text style={styles.rowValue} numberOfLines={1}>
                {row.value}
              </Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionLabel}>General</Text>
        <View style={styles.group}>
          <Pressable
            style={({ pressed }) => [
              styles.row,
              styles.actionRow,
              pressed && styles.rowPressed,
            ]}
            onPress={() => navigation.navigate("Landing")}
          >
            <Ionicons name="home-outline" size={20} color={colors.accent} />
            <Text style={styles.rowLabel}>Back to welcome screen</Text>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.textSecondary}
            />
          </Pressable>
        </View>

        <Text style={styles.footnote}>Made for the TBC community.</Text>
      </ScrollView>
    </ScreenContainer>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    content: {
      padding: spacing.xl,
      paddingBottom: spacing.xxl,
    },
    sectionLabel: {
      fontSize: fontSizes.sm,
      fontWeight: "700",
      color: colors.textSecondary,
      textTransform: "uppercase",
      letterSpacing: 1,
      marginBottom: spacing.sm,
    },
    group: {
      backgroundColor: colors.surface,
      borderRadius: radii.lg,
      paddingHorizontal: spacing.lg,
      marginBottom: spacing.xl,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: spacing.lg,
      gap: spacing.md,
    },
    actionRow: {},
    rowPressed: {
      opacity: 0.6,
    },
    rowBorder: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
    },
    rowLabel: {
      flex: 1,
      fontSize: fontSizes.md,
      color: colors.textPrimary,
    },
    rowValue: {
      fontSize: fontSizes.sm,
      color: colors.textSecondary,
      maxWidth: "45%",
    },
    progress: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
    },
    footnote: {
      textAlign: "center",
      color: colors.textSecondary,
      fontSize: fontSizes.xs,
    },
  });
