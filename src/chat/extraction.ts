/**
 * Pure, language-aware text-extraction helpers for the chat assistant.
 * Each function takes raw free-text chat input and tries to pull out a
 * single structured value (a number, an enum member, a name). Returns null
 * when nothing usable was found, so the caller can fall back to a
 * clarification prompt instead of silently guessing — never fabricates a
 * value the user didn't actually provide.
 */

import type { EmploymentType, MortgageType, PropertyType, PropertyUsage } from '../types/simulator';
import type { Language } from '../i18n/language';

/**
 * Extracts the first number-like token from free text (e.g. "uns 2.500 euros
 * al mes" -> 2500, "around $3,200" -> 3200, "20k" -> 20000). Accepts both
 * European (1.234,56) and Anglo (1,234.56) grouping — disambiguated by
 * treating a SINGLE separator followed by exactly 3 digits as a thousands
 * grouping mark, and a separator followed by 1-2 digits (or it being the
 * last, non-grouping one) as a decimal point.
 */
export function extractNumber(text: string): number | null {
  const match = text.match(/-?\d[\d.,]*\s*(k|mil)?/i);
  if (!match) {
    return null;
  }

  let numericPart = match[0].trim();
  const kSuffix = /\s*(k|mil)$/i.exec(numericPart);
  if (kSuffix) {
    numericPart = numericPart.slice(0, kSuffix.index).trim();
  }

  // Normalize grouping/decimal separators: if both '.' and ',' appear, the
  // LAST one is the decimal point and the other is thousands grouping. If
  // only one kind appears more than once, they're all grouping marks. If it
  // appears exactly once followed by 1-2 trailing digits, treat as decimal.
  const hasDot = numericPart.includes('.');
  const hasComma = numericPart.includes(',');
  let normalized = numericPart;

  if (hasDot && hasComma) {
    const lastDot = numericPart.lastIndexOf('.');
    const lastComma = numericPart.lastIndexOf(',');
    const decimalSeparator = lastDot > lastComma ? '.' : ',';
    const groupingSeparator = decimalSeparator === '.' ? ',' : '.';
    normalized = numericPart.split(groupingSeparator).join('').replace(decimalSeparator, '.');
  } else if (hasComma) {
    const parts = numericPart.split(',');
    const trailingDigits = parts[parts.length - 1].length;
    normalized = parts.length > 1 && trailingDigits === 3 ? parts.join('') : numericPart.replace(',', '.');
  } else if (hasDot) {
    const parts = numericPart.split('.');
    const trailingDigits = parts[parts.length - 1].length;
    normalized = parts.length > 1 && trailingDigits === 3 ? parts.join('') : numericPart;
  }

  const value = Number(normalized);
  if (!Number.isFinite(value)) {
    return null;
  }

  return kSuffix ? value * 1000 : value;
}

const NEGATION_KEYWORDS: Record<Language, string[]> = {
  ca: ['no', 'cap', 'gens', 'res'],
  es: ['no', 'ninguna', 'ningún', 'ninguno', 'nada'],
  en: ['no', 'none', 'nothing', "don't have", 'do not have'],
};

/**
 * Like extractNumber, but also recognizes a plain negation reply (e.g. "no",
 * "cap deute", "none") as 0 — for questions where "I don't have any" is a
 * natural, common answer (pending debts, available savings), unlike age or
 * purchase price where a negation wouldn't make sense as 0.
 */
export function extractNumberOrZeroForNegation(text: string, language: Language): number | null {
  const numeric = extractNumber(text);
  if (numeric !== null) {
    return numeric;
  }
  const normalized = text.toLowerCase();
  return NEGATION_KEYWORDS[language].some((keyword) => normalized.includes(keyword)) ? 0 : null;
}

const YES_KEYWORDS: Record<Language, string[]> = {
  ca: ['sí', 'si', 'val', "d'acord", 'endavant', 'descarrega', 'vull', 'clar'],
  es: ['sí', 'si', 'vale', 'de acuerdo', 'adelante', 'descarga', 'quiero', 'claro'],
  en: ['yes', 'yeah', 'yep', 'sure', 'ok', 'okay', 'download', 'please do'],
};

const NO_KEYWORDS: Record<Language, string[]> = {
  ca: ['no'],
  es: ['no'],
  en: ['no', 'nope', 'not now', "don't", 'do not'],
};

/**
 * Interprets a free-text reply to a yes/no question (e.g. "would you like
 * the PDF report?"). Checks negation keywords first since "no" is a
 * substring risk against some affirmative replies in Catalan/Spanish (e.g.
 * a reply starting with "no, ..."). Returns null — never a guessed default —
 * when neither a clear yes nor a clear no signal is present.
 */
export function extractYesNo(text: string, language: Language): boolean | null {
  const normalized = ` ${text.trim().toLowerCase()} `;
  const isNo = NO_KEYWORDS[language].some((keyword) => normalized.includes(` ${keyword} `) || normalized.startsWith(` ${keyword},`));
  if (isNo) {
    return false;
  }
  const isYes = YES_KEYWORDS[language].some((keyword) => normalized.includes(keyword));
  return isYes ? true : null;
}

/**
 * Extracts a plausible full-name reply: rejects replies that are too short,
 * contain a digit (real names essentially never do, and it's the strongest
 * signal that the reply is actually answering some OTHER question — e.g.
 * "Té 35 anys" is an age, not a name), or run longer than a name plausibly
 * would (a handful of words, not a sentence).
 */
export function extractName(text: string): string | null {
  const trimmed = text.trim().replace(/^(em dic|el meu nom és|me llamo|mi nombre es|my name is|i'm|i am)\s+/i, '');
  const words = trimmed.split(/\s+/).filter(Boolean);
  if (trimmed.length < 2 || words.length === 0 || words.length > 5 || /\d/.test(trimmed)) {
    return null;
  }
  return words.map((word) => word[0].toUpperCase() + word.slice(1)).join(' ');
}

type KeywordMap<T extends string> = Record<Language, Array<{ keywords: string[]; value: T }>>;

function matchKeywords<T extends string>(text: string, map: KeywordMap<T>, language: Language): T | null {
  const normalized = text.toLowerCase();
  for (const { keywords, value } of map[language]) {
    if (keywords.some((keyword) => normalized.includes(keyword))) {
      return value;
    }
  }
  return null;
}

const EMPLOYMENT_KEYWORDS: KeywordMap<EmploymentType> = {
  ca: [
    { keywords: ['indefinit', 'fix'], value: 'INDEFINITE' },
    { keywords: ['temporal', 'eventual'], value: 'TEMPORARY' },
    { keywords: ['autònom', 'autonom', 'freelance'], value: 'SELF_EMPLOYED' },
    { keywords: ['funcionari'], value: 'STATE_OFFICIAL' },
    { keywords: ['jubilat', 'pensionista', 'pensió'], value: 'RETIRED' },
    { keywords: ['atur', 'aturat'], value: 'UNEMPLOYED' },
  ],
  es: [
    { keywords: ['indefinido', 'fijo'], value: 'INDEFINITE' },
    { keywords: ['temporal', 'eventual'], value: 'TEMPORARY' },
    { keywords: ['autónomo', 'autonomo', 'freelance'], value: 'SELF_EMPLOYED' },
    { keywords: ['funcionario'], value: 'STATE_OFFICIAL' },
    { keywords: ['jubilado', 'pensionista', 'pensión'], value: 'RETIRED' },
    { keywords: ['paro', 'parado', 'desempleado'], value: 'UNEMPLOYED' },
  ],
  en: [
    { keywords: ['permanent', 'full-time', 'full time'], value: 'INDEFINITE' },
    { keywords: ['temporary', 'contract'], value: 'TEMPORARY' },
    { keywords: ['self-employed', 'self employed', 'freelance', 'freelancer'], value: 'SELF_EMPLOYED' },
    { keywords: ['civil servant', 'public servant'], value: 'STATE_OFFICIAL' },
    { keywords: ['retired', 'pension', 'pensioner'], value: 'RETIRED' },
    { keywords: ['unemployed', 'jobless'], value: 'UNEMPLOYED' },
  ],
};

/** Returns 'OTHER' when the reply is descriptive but matches none of the known categories, or null when the reply gives no usable signal at all (e.g. empty/too short). */
export function extractEmploymentType(text: string, language: Language): EmploymentType | null {
  const matched = matchKeywords(text, EMPLOYMENT_KEYWORDS, language);
  if (matched) {
    return matched;
  }
  return text.trim().length >= 3 ? 'OTHER' : null;
}

const PROPERTY_TYPE_KEYWORDS: KeywordMap<PropertyType> = {
  ca: [
    { keywords: ['obra nova', 'nova', 'nou'], value: 'NEW_BUILD' },
    { keywords: ['segona mà', 'segona ma', 'usat', 'usada', 'segona'], value: 'SECOND_HAND' },
  ],
  es: [
    { keywords: ['obra nueva', 'nueva', 'nuevo'], value: 'NEW_BUILD' },
    { keywords: ['segunda mano', 'usado', 'usada', 'segunda'], value: 'SECOND_HAND' },
  ],
  en: [
    { keywords: ['new build', 'new-build', 'brand new', 'new'], value: 'NEW_BUILD' },
    { keywords: ['resale', 'second hand', 'second-hand', 'used'], value: 'SECOND_HAND' },
  ],
};

export function extractPropertyType(text: string, language: Language): PropertyType | null {
  return matchKeywords(text, PROPERTY_TYPE_KEYWORDS, language);
}

const PROPERTY_USAGE_KEYWORDS: KeywordMap<PropertyUsage> = {
  ca: [
    { keywords: ['habitual', 'principal', 'per viure'], value: 'HABITUAL' },
    { keywords: ['segona residència', 'segona residencia', 'vacances', 'lloguer'], value: 'SECOND_HOME' },
  ],
  es: [
    { keywords: ['habitual', 'principal', 'para vivir'], value: 'HABITUAL' },
    { keywords: ['segunda residencia', 'vacaciones', 'alquiler'], value: 'SECOND_HOME' },
  ],
  en: [
    { keywords: ['primary', 'main residence', 'live in', 'to live'], value: 'HABITUAL' },
    { keywords: ['second home', 'holiday home', 'vacation home', 'rental'], value: 'SECOND_HOME' },
  ],
};

export function extractPropertyUsage(text: string, language: Language): PropertyUsage | null {
  return matchKeywords(text, PROPERTY_USAGE_KEYWORDS, language);
}

const MORTGAGE_TYPE_KEYWORDS: KeywordMap<MortgageType> = {
  ca: [
    { keywords: ['fix', 'fixa'], value: 'FIXED' },
    { keywords: ['variable'], value: 'VARIABLE' },
    { keywords: ['mixt', 'mixta'], value: 'MIXED' },
  ],
  es: [
    { keywords: ['fijo', 'fija'], value: 'FIXED' },
    { keywords: ['variable'], value: 'VARIABLE' },
    { keywords: ['mixto', 'mixta'], value: 'MIXED' },
  ],
  en: [
    { keywords: ['fixed'], value: 'FIXED' },
    { keywords: ['variable'], value: 'VARIABLE' },
    { keywords: ['mixed'], value: 'MIXED' },
  ],
};

export function extractMortgageType(text: string, language: Language): MortgageType | null {
  return matchKeywords(text, MORTGAGE_TYPE_KEYWORDS, language);
}

/** Fuzzy-matches free text against a CCAA's own sourced name OR its localized display name, case/diacritic-insensitive. */
export function extractCcaaCode(
  text: string,
  candidates: Array<{ code: string; names: string[] }>
): string | null {
  const normalize = (value: string) =>
    value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '');
  const normalizedText = normalize(text);

  for (const candidate of candidates) {
    if (candidate.names.some((name) => normalizedText.includes(normalize(name)))) {
      return candidate.code;
    }
  }
  return null;
}
