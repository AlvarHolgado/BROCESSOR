/**
 * Display-only Spanish/English names for each Comunitat Autònoma, keyed by
 * the same `code` used in /data/mortgageData.json's sourced ccaaTaxRates.
 * This is a proper-noun translation layer for the UI/PDF only — it never
 * touches the underlying sourced tax data (CCAA_TAX_RATES), so Rule 1 (Zero
 * Data Hallucination) is unaffected: no financial/tax figure is derived or
 * re-sourced per language, only the region's own name is localized.
 */
import type { Language } from './language';

export const CCAA_NAME_BY_LANGUAGE: Record<string, Record<Language, string>> = {
  AND: { ca: 'Andalusia', es: 'Andalucía', en: 'Andalusia' },
  ARA: { ca: 'Aragó', es: 'Aragón', en: 'Aragon' },
  AST: { ca: 'Astúries', es: 'Asturias', en: 'Asturias' },
  BAL: { ca: 'Illes Balears', es: 'Islas Baleares', en: 'Balearic Islands' },
  CAN: { ca: 'Canàries', es: 'Canarias', en: 'Canary Islands' },
  CTB: { ca: 'Cantàbria', es: 'Cantabria', en: 'Cantabria' },
  CLM: { ca: 'Castella-La Manxa', es: 'Castilla-La Mancha', en: 'Castilla-La Mancha' },
  CYL: { ca: 'Castella i Lleó', es: 'Castilla y León', en: 'Castile and León' },
  CAT: { ca: 'Catalunya', es: 'Cataluña', en: 'Catalonia' },
  VAL: { ca: 'Comunitat Valenciana', es: 'Comunidad Valenciana', en: 'Valencian Community' },
  EXT: { ca: 'Extremadura', es: 'Extremadura', en: 'Extremadura' },
  GAL: { ca: 'Galícia', es: 'Galicia', en: 'Galicia' },
  MAD: { ca: 'Madrid', es: 'Madrid', en: 'Madrid' },
  MUR: { ca: 'Múrcia', es: 'Murcia', en: 'Murcia' },
  NAV: { ca: 'Navarra', es: 'Navarra', en: 'Navarre' },
  PVA: { ca: 'País Basc', es: 'País Vasco', en: 'Basque Country' },
  RIO: { ca: 'La Rioja', es: 'La Rioja', en: 'La Rioja' },
  CEU: { ca: 'Ceuta', es: 'Ceuta', en: 'Ceuta' },
  MEL: { ca: 'Melilla', es: 'Melilla', en: 'Melilla' },
};

/** Looks up the display name for a CCAA code in the given language, falling back to the sourced Catalan name (fallbackName) if the code isn't in the map. */
export function getCcaaName(code: string, language: Language, fallbackName: string): string {
  return CCAA_NAME_BY_LANGUAGE[code]?.[language] ?? fallbackName;
}
