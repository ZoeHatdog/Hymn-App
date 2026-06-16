import {
  Image,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { colors, fontSizes, radii, spacing } from "@hymn-app/shared-themes";
import type { RootStackParamList } from "../navigation/types";

import logo from "../../../../packages/shared-themes/TBC logo.jpeg";

type Navigation = NativeStackNavigationProp<RootStackParamList, "Landing">;

export function LandingScreen() {
  const navigation = useNavigation<Navigation>();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.content}>
        <Image source={logo} style={styles.logo} resizeMode="contain" />
        <Text style={styles.title}>Hymn App</Text>
        <View style={styles.divider} />
        <Text style={styles.tagline}>
          Browse, search, and read hymns wherever you are.
        </Text>
      </View>

      <View style={styles.footer}>
        <Pressable
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
          onPress={() => navigation.navigate("Main")}
        >
          <Text style={styles.buttonText}>Open Hymn App</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.xxl,
  },
  logo: {
    width: 180,
    height: 180,
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: fontSizes.display,
    fontWeight: "700",
    color: colors.primary,
  },
  divider: {
    width: 56,
    height: 3,
    borderRadius: radii.sm,
    backgroundColor: colors.accent,
    marginVertical: spacing.lg,
  },
  tagline: {
    fontSize: fontSizes.md,
    lineHeight: 24,
    color: colors.primaryLight,
    textAlign: "center",
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: radii.lg,
    paddingVertical: spacing.lg,
    alignItems: "center",
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonText: {
    fontSize: fontSizes.lg,
    fontWeight: "700",
    color: colors.textPrimary,
  },
});
