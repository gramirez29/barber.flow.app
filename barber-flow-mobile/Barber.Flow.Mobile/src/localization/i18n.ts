import { I18n } from "i18n-js";
import { en } from "./en";
import { es } from "./es";
import type { Language } from "../types/settings";

type DeviceLocale = {
  languageCode?: string | null;
  languageTag?: string | null;
};

const i18n = new I18n({ en, es });

export type TranslationOptions = Record<
  string,
  string | number | boolean | null | undefined
>;

i18n.defaultLocale = "es";
i18n.enableFallback = true;
i18n.locale = "es";

export const resolveLanguageFromDevice = (locales: DeviceLocale[] = []): Language => {
  for (const locale of locales) {
    const rawCode = locale.languageCode ?? locale.languageTag?.split("-")[0] ?? "";
    const normalizedCode = rawCode.trim().toLowerCase();

    if (normalizedCode === "es" || normalizedCode === "en") {
      return normalizedCode;
    }
  }

  return "es";
};

export const setI18nLanguage = (language: Language) => {
  i18n.locale = language;
};

export const getIntlLocale = (language: Language) =>
  language === "en" ? "en-US" : "es-CR";

export const translate = (
  key: string,
  options?: TranslationOptions,
) => i18n.t(key, { ...options, defaultValue: key });