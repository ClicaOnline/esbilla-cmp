import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { ast, es, en } from './translations';
import type { Translations } from './translations';

// Supported languages
export const SUPPORTED_LANGUAGES = ['ast', 'es', 'en'] as const;
export type Language = typeof SUPPORTED_LANGUAGES[number];

// Default language
export const DEFAULT_LANGUAGE: Language = 'ast';

// Language labels for the selector
export const LANGUAGE_LABELS: Record<Language, string> = {
  ast: '🌽 Asturianu',
  es: '🇪🇸 Español',
  en: '🇬🇧 English',
};

// Translation maps
const translations: Record<Language, Translations> = {
  ast,
  es,
  en,
};

// Context type
interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
}

// Create context
const I18nContext = createContext<I18nContextType | null>(null);

// Storage key
const STORAGE_KEY = 'esbilla-dashboard-lang';

// Detect browser language
function detectBrowserLanguage(): Language {
  const browserLang = navigator.language.split('-')[0];
  if (SUPPORTED_LANGUAGES.includes(browserLang as Language)) {
    return browserLang as Language;
  }
  return DEFAULT_LANGUAGE;
}

// Provider component
export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    // Try to get from localStorage first
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && SUPPORTED_LANGUAGES.includes(stored as Language)) {
      return stored as Language;
    }
    // Fallback to browser detection
    return detectBrowserLanguage();
  });

  // Persist language choice
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, language);
    // Update document lang attribute
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = (lang: Language) => {
    if (SUPPORTED_LANGUAGES.includes(lang)) {
      setLanguageState(lang);
    }
  };

  const value: I18nContextType = {
    language,
    setLanguage,
    t: translations[language],
  };

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
}

// Hook to use translations
export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}

// Shorthand hook for just translations
export function useTranslations() {
  const { t } = useI18n();
  return t;
}
