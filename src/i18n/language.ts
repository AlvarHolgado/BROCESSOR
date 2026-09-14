/**
 * Supported UI/PDF languages. Catalan remains the default and canonical
 * language per .clauderules; Spanish and English are a deliberate,
 * documented exception added for Task 5 (internationalization).
 */
export type Language = 'ca' | 'es' | 'en';

export const DEFAULT_LANGUAGE: Language = 'ca';

export interface LanguageOption {
  code: Language;
  nativeName: string;
}

export const LANGUAGE_OPTIONS: LanguageOption[] = [
  { code: 'ca', nativeName: 'Català' },
  { code: 'es', nativeName: 'Castellano' },
  { code: 'en', nativeName: 'English' },
];

/** BCP-47 locale used for Intl formatters per language — see /i18n/formatters.ts. */
export const LOCALE_BY_LANGUAGE: Record<Language, string> = {
  ca: 'ca-ES',
  es: 'es-ES',
  en: 'en-GB',
};
