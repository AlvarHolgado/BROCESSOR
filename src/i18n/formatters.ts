/**
 * Centralized Intl formatters per language, so every screen/PDF shares the
 * same locale-correct number/date formatting instead of each hardcoding its
 * own 'ca-ES' Intl instance (see the language rule in .clauderules).
 */
import { LOCALE_BY_LANGUAGE, type Language } from './language';

export interface Formatters {
  /** Whole-euro amount, e.g. "200.000 €" (ca/es) or "€200,000" (en). */
  currency0: Intl.NumberFormat;
  /** Compact whole/1-decimal euro amount for chart axis ticks, e.g. "200 mil €". */
  currencyCompact1: Intl.NumberFormat;
  /** Plain number, 1 decimal max — used for DSTI/rate figures shown as "X%" with a literal suffix. */
  percent1: Intl.NumberFormat;
  /** Plain number, fixed 2 decimals — used for TIN/TAE/LTV shown as "X%" with a literal suffix. */
  percent2: Intl.NumberFormat;
  /** True Intl percent style (input as a 0-1 fraction), 1 decimal — for DSTI badges. */
  dstiPercent: Intl.NumberFormat;
  /** Long date, e.g. "12 de setembre del 2026". */
  dateLong: Intl.DateTimeFormat;
  /** Medium date + short time, e.g. for "saved on" timestamps. */
  dateMedium: Intl.DateTimeFormat;
}

const cache = new Map<Language, Formatters>();

export function getFormatters(language: Language): Formatters {
  const cached = cache.get(language);
  if (cached) {
    return cached;
  }

  const locale = LOCALE_BY_LANGUAGE[language];
  const formatters: Formatters = {
    currency0: new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }),
    currencyCompact1: new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'EUR',
      notation: 'compact',
      maximumFractionDigits: 1,
    }),
    percent1: new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }),
    percent2: new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    dstiPercent: new Intl.NumberFormat(locale, { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 }),
    dateLong: new Intl.DateTimeFormat(locale, { dateStyle: 'long' }),
    dateMedium: new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }),
  };
  cache.set(language, formatters);
  return formatters;
}
