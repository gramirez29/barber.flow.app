import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  resolveLanguageFromDevice,
  setI18nLanguage,
  type TranslationOptions,
  translate,
} from "../localization/i18n";
import * as Localization from "expo-localization";
import { settingsService } from "../services/apis/settingsService";
import type { Language, LanguageSource } from "../types/settings";

type LanguageContextType = {
  isUsingSystemLanguage: boolean;
  language: Language;
  languageSource: LanguageSource;
  resetToSystemLanguage: () => Promise<void>;
  setLanguage: (language: Language) => Promise<void>;
  systemLanguage: Language;
  translateText: (key: string, options?: TranslationOptions) => string;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const locales = useMemo(() => Localization.getLocales?.() ?? [], []);
  const systemLanguage = useMemo(() => resolveLanguageFromDevice(locales), [locales]);
  const [storedLanguage, setStoredLanguage] = useState<Language>("es");
  const [languageSource, setLanguageSource] = useState<LanguageSource>("system");

  useEffect(() => {
    let mounted = true;

    const loadStoredLanguage = async () => {
      const preferences = await settingsService.getStoredPreferences();

      if (!mounted || !preferences) {
        return;
      }

      setStoredLanguage(preferences.language);
      setLanguageSource(preferences.languageSource);
    };

    void loadStoredLanguage();

    return () => {
      mounted = false;
    };
  }, []);

  const language = languageSource === "system" ? systemLanguage : storedLanguage;

  useEffect(() => {
    setI18nLanguage(language);
  }, [language]);

  const setLanguage = useCallback(async (nextLanguage: Language) => {
    setStoredLanguage(nextLanguage);
    setLanguageSource("manual");
    await settingsService.setLanguagePreference(nextLanguage, "manual");
  }, []);

  const resetToSystemLanguage = useCallback(async () => {
    setStoredLanguage(systemLanguage);
    setLanguageSource("system");
    await settingsService.setLanguagePreference(systemLanguage, "system");
  }, [systemLanguage]);

  const translateText = useCallback(
    (key: string, options?: TranslationOptions) => translate(key, options),
    [],
  );

  const value = useMemo(
    () => ({
      isUsingSystemLanguage: languageSource === "system",
      language,
      languageSource,
      resetToSystemLanguage,
      setLanguage,
      systemLanguage,
      translateText,
    }),
    [
      language,
      languageSource,
      resetToSystemLanguage,
      setLanguage,
      systemLanguage,
      translateText,
    ],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error("useLanguage must be used inside LanguageProvider");
  }

  return context;
};

export const useTranslation = () => {
  const { language, translateText } = useLanguage();
  return { language, translateText };
};