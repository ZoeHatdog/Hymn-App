import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getHymn } from "../api";

const FAVORITES_STORAGE_KEY = "favorite-ids";

interface FavoritesContextValue {
  favoriteIds: string[];
  isFavorite: (hymnId: string) => boolean;
  toggleFavorite: (hymnId: string) => void;
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const raw = await AsyncStorage.getItem(FAVORITES_STORAGE_KEY);
        if (!cancelled && raw) {
          const parsed = JSON.parse(raw) as unknown;
          if (
            Array.isArray(parsed) &&
            parsed.every((id) => typeof id === "string")
          ) {
            setFavoriteIds(parsed);
          }
        }
      } catch {
        // Ignore corrupt storage; start with empty favorites
      } finally {
        if (!cancelled) setHydrated(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    void AsyncStorage.setItem(
      FAVORITES_STORAGE_KEY,
      JSON.stringify(favoriteIds),
    );
  }, [favoriteIds, hydrated]);

  const toggleFavorite = useCallback(
    (hymnId: string) => {
      const alreadyFavorite = favoriteIds.includes(hymnId);

      if (alreadyFavorite) {
        setFavoriteIds((current) => current.filter((id) => id !== hymnId));
        return;
      }

      setFavoriteIds((current) =>
        current.includes(hymnId) ? current : [...current, hymnId],
      );

      // Best-effort: fetch + cache so the hymn works offline
      void getHymn(hymnId).catch(() => {});
    },
    [favoriteIds],
  );

  const isFavorite = useCallback(
    (hymnId: string) => favoriteIds.includes(hymnId),
    [favoriteIds],
  );

  const value = useMemo(
    () => ({ favoriteIds, isFavorite, toggleFavorite }),
    [favoriteIds, isFavorite, toggleFavorite],
  );

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites(): FavoritesContextValue {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error("useFavorites must be used within a FavoritesProvider");
  }
  return context;
}
