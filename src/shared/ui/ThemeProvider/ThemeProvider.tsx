"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  DEFAULT_THEME,
  isSiteTheme,
  THEME_STORAGE_KEY,
  type SiteTheme,
} from "@/shared/lib/theme";

type ThemeContextValue = {
  theme: SiteTheme;
  setTheme: (next: SiteTheme) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

const LIGHT_QUERY = "(prefers-color-scheme: light)";

const resolveSystemTheme = (): SiteTheme => {
  if (typeof window === "undefined") return DEFAULT_THEME;
  return window.matchMedia(LIGHT_QUERY).matches ? "light" : "dark";
};

const readThemeFromDom = (): SiteTheme | null => {
  if (typeof document === "undefined") return null;
  const value = document.documentElement.dataset.theme;
  return isSiteTheme(value) ? value : null;
};

const applyThemeToDom = (theme: SiteTheme) => {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
};

const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setThemeState] = useState<SiteTheme>(DEFAULT_THEME);

  const setTheme = useCallback((next: SiteTheme) => {
    setThemeState(next);
    applyThemeToDom(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(THEME_STORAGE_KEY, next);
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [setTheme, theme]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    const initialTheme =
      (isSiteTheme(stored) ? stored : readThemeFromDom()) ??
      resolveSystemTheme();

    setThemeState(initialTheme);
    applyThemeToDom(initialTheme);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia(LIGHT_QUERY);

    const handleChange = () => {
      const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
      if (isSiteTheme(stored)) return;
      const systemTheme = media.matches ? "light" : "dark";
      setThemeState(systemTheme);
      applyThemeToDom(systemTheme);
    };

    media.addEventListener("change", handleChange);
    return () => {
      media.removeEventListener("change", handleChange);
    };
  }, []);

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      toggleTheme,
    }),
    [setTheme, theme, toggleTheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
};

export default ThemeProvider;
