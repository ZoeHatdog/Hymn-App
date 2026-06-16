import Constants from "expo-constants";
import { Platform } from "react-native";

const API_PORT = 3000;

function inferDevHost(): string | null {
  const debuggerHost =
    Constants.expoGoConfig?.debuggerHost ?? Constants.expoConfig?.hostUri;

  if (!debuggerHost) {
    return null;
  }

  return debuggerHost.split(":")[0] ?? null;
}

function isLocalhostUrl(url: string): boolean {
  return /\/\/(localhost|127\.0\.0\.1)(:|\/|$)/.test(url);
}

export function getApiUrl(): string {
  const configured = process.env.EXPO_PUBLIC_API_URL?.trim();
  const devHost = inferDevHost();

  // localhost in .env points at the phone/emulator, not your PC. Prefer Metro's host IP.
  if (configured && isLocalhostUrl(configured) && devHost) {
    return `http://${devHost}:${API_PORT}`;
  }

  if (configured) {
    return configured.replace(/\/$/, "");
  }

  if (devHost) {
    return `http://${devHost}:${API_PORT}`;
  }

  if (Platform.OS === "android") {
    return `http://10.0.2.2:${API_PORT}`;
  }

  return `http://localhost:${API_PORT}`;
}
