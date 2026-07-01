import type { en } from "./locales/en";

export type SupportedLanguage = "en" | "ar";

export type Direction = "ltr" | "rtl";

export type I18nDictionary = typeof en;

export interface I18nContextValue {
  direction: Direction;
  language: SupportedLanguage;
  setLanguage: (language: SupportedLanguage) => void;
  t: I18nDictionary;
}
