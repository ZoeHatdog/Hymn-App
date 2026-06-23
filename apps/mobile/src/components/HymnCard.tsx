import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { HymnSummary } from "@hymn-app/shared-types";
import type { ThemeColors } from "@hymn-app/shared-themes";
import { fontSizes, radii, spacing } from "@hymn-app/shared-themes";
import { useThemedStyles } from "../hooks/useThemedStyles";
import { useTheme } from "../state/ThemeContext";

interface HymnCardProps {
  hymn: HymnSummary;
  isFavorite: boolean;
  onPress: () => void;
  onToggleFavorite: () => void;
}

export function HymnCard({
  hymn,
  isFavorite,
  onPress,
  onToggleFavorite,
}: HymnCardProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={onPress}
    >
      <View style={styles.text}>
        <Text style={styles.title}>{hymn.title}</Text>
        <Text style={styles.author}>{hymn.author}</Text>
      </View>
      <Pressable
        hitSlop={10}
        onPress={onToggleFavorite}
        accessibilityRole="button"
        accessibilityLabel={
          isFavorite ? "Remove from favorites" : "Add to favorites"
        }
        style={styles.starButton}
      >
        <Ionicons
          name={isFavorite ? "star" : "star-outline"}
          size={22}
          color={isFavorite ? colors.accent : colors.textSecondary}
        />
      </Pressable>
    </Pressable>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    card: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.surface,
      borderRadius: radii.lg,
      padding: spacing.lg,
    },
    cardPressed: {
      opacity: 0.85,
    },
    text: {
      flex: 1,
    },
    title: {
      fontSize: fontSizes.lg,
      fontWeight: "600",
      color: colors.textPrimary,
    },
    author: {
      fontSize: fontSizes.sm,
      color: colors.accent,
      marginTop: spacing.xs,
    },
    starButton: {
      paddingLeft: spacing.md,
    },
  });
