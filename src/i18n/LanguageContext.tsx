/**
 * React context carrying the active UI/PDF language and its dictionary.
 * Persists the choice to localStorage so a returning user skips the
 * language selector — see Screen0LanguageSelect for where it's first set.
 */
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { DEFAULT_LANGUAGE, type Language } from './language';
import { ca } from './dictionaries/ca';
import { es } from './dictionaries/es';
import { en } from './dictionaries/en';
import type { Dictionary } from './dictionaries/ca';
import { getFormatters, type Formatters } from './formatters';

const STORAGE_KEY = 'brossessor.language.v1';

const DICTIONARIES: Record<Language, Dictionary> = { ca, es, en };

export function getDictionary(language: Language): Dictionary {
  return DICTIONARIES[language];
}

function loadStoredLanguage(): Language | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw === 'ca' || raw === 'es' || raw === 'en' ? raw : null;
  } catch {
    return null;
  }
}

function persistLanguage(language: Language): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, language);
  } catch {
    // Best-effort persistence only — an unavailable localStorage must not break language switching.
  }
}

export interface LanguageContextValue {
  language: Language;
  setLanguage: (language: Language) => void;
  t: Dictionary;
  formatters: Formatters;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => loadStoredLanguage() ?? DEFAULT_LANGUAGE);

  const setLanguage = useCallback((next: Language) => {
    setLanguageState(next);
    persistLanguage(next);
  }, []);

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      setLanguage,
      t: getDictionary(language),
      formatters: getFormatters(language),
    }),
    [language, setLanguage]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider.');
  }
  return context;
}
