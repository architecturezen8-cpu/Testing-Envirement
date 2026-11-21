"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";

type FavoriteItem = {
  slug: string;
  name: string;
  price: number;
  image: string;
  addedAt: number;
};

type FavoritesContextValue = {
  favorites: FavoriteItem[];
  slugs: Set<string>;
  toggle: (item: FavoriteItem) => void;
  isFavorite: (slug: string) => boolean;
  remove: (slug: string) => void;
  count: number;
};

const FavoritesContext = createContext<FavoritesContextValue | null>(null);
const STORAGE_KEY = "nova-favorites-v1";

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as FavoriteItem[];
        if (Array.isArray(parsed)) setFavorites(parsed);
      }
    } catch {
      // ignore
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
    } catch {
      // ignore
    }
  }, [favorites, hydrated]);

  const toggle = useCallback((item: FavoriteItem) => {
    setFavorites((prev) => {
      if (prev.some((f) => f.slug === item.slug)) {
        return prev.filter((f) => f.slug !== item.slug);
      }
      return [...prev, item];
    });
  }, []);

  const remove = useCallback((slug: string) => {
    setFavorites((prev) => prev.filter((f) => f.slug !== slug));
  }, []);

  const slugs = new Set(favorites.map((f) => f.slug));
  const isFavorite = (slug: string) => slugs.has(slug);

  return (
    <FavoritesContext.Provider
      value={{ favorites, slugs, toggle, isFavorite, remove, count: favorites.length }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error("useFavorites must be used within FavoritesProvider");
  return ctx;
}
