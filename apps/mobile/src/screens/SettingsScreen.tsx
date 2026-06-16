import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { colors, fontSizes, radii, spacing } from "@hymn-app/shared-themes";
import { ScreenContainer } from "../components/ScreenContainer";
import { useFavorites } from "../state/FavoritesContext";
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

  const infoRows: InfoRow[] = [
    { icon: "star-outline", label: "Saved favorites", value: `${favoriteIds.length}` },
    { icon: "server-outline", label: "API endpoint", value: getApiUrl() },
    { icon: "information-circle-outline", label: "Version", value: "0.1.0" },
  ];

  return (
    <ScreenContainer title="Settings" subtitle="App info & preferences" padded={false}>
      <ScrollView contentContainerStyle={styles.content}>
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

const styles = StyleSheet.create({
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
    borderTopColor: colors.primaryLight,
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
  footnote: {
    textAlign: "center",
    color: colors.textSecondary,
    fontSize: fontSizes.xs,
  },
});
