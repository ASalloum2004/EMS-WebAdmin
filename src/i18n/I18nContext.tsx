import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import { ar } from "./locales/ar";
import { en } from "./locales/en";
import type {
  Direction,
  I18nContextValue,
  I18nDictionary,
  SupportedLanguage,
} from "./types";

const LANGUAGE_STORAGE_KEY = "ems-language";
const DEFAULT_LANGUAGE: SupportedLanguage = "en";

const dictionaries: Record<SupportedLanguage, I18nDictionary> = {
  en,
  ar,
};

const directions: Record<SupportedLanguage, Direction> = {
  en: "ltr",
  ar: "rtl",
};

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

function isSupportedLanguage(value: string | null): value is SupportedLanguage {
  return value === "en" || value === "ar";
}

function getStoredLanguage(): SupportedLanguage {
  try {
    const storedLanguage = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    return isSupportedLanguage(storedLanguage)
      ? storedLanguage
      : DEFAULT_LANGUAGE;
  } catch {
    return DEFAULT_LANGUAGE;
  }
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] =
    useState<SupportedLanguage>(getStoredLanguage);
  const direction = directions[language];

  const setLanguage = useCallback((nextLanguage: SupportedLanguage) => {
    setLanguageState(nextLanguage);
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = direction;

    try {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    } catch {
      // Ignore storage failures so the visible UI direction still updates.
    }
  }, [direction, language]);

  const value = useMemo<I18nContextValue>(
    () => ({
      direction,
      language,
      setLanguage,
      t: dictionaries[language] ?? dictionaries.en,
    }),
    [direction, language, setLanguage],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);

  if (!context) {
    throw new Error("useI18n must be used within I18nProvider");
  }

  return context;
}
