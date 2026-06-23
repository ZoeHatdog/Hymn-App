import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  darkColors,
  lightColors,
  type ColorScheme,
  type ThemeColors,
} from "@hymn-app/shared-themes";

interface ThemeContextValue {
  colorScheme: ColorScheme;
  isDark: boolean;
  colors: ThemeColors;
  setColorScheme: (scheme: ColorScheme) => void;
  toggleColorScheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [colorScheme, setColorScheme] = useState<ColorScheme>("light");

  const isDark = colorScheme === "dark";
  const colors = isDark ? darkColors : lightColors;

  const toggleColorScheme = useCallback(() => {
    setColorScheme((current) => (current === "dark" ? "light" : "dark"));
  }, []);

  const value = useMemo(
    () => ({ colorScheme, isDark, colors, setColorScheme, toggleColorScheme }),
    [colorScheme, isDark, colors, toggleColorScheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
