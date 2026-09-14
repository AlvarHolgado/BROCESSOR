/**
 * Detects a recognized finance-glossary side-question in free text — e.g.
 * "what's LTV?" or "quina diferència hi ha entre fix i variable?" — asked
 * mid-flow while Àlvar is waiting for an answer to a specific field. Used
 * ONLY as a fallback the chat assistant checks before trying to interpret
 * the reply as an actual field answer (see ChatAssistant.tsx), so it never
 * hijacks a genuine answer: LTV/DSTI are acronyms that never appear in a
 * legitimate field reply, but "fix"/"variable"/"mixed" ARE valid answers to
 * the mortgageType question, so that topic only triggers alongside an
 * explicit question cue ("what is", "què és"...) to avoid misreading "vull
 * una hipoteca variable" as a side question.
 */

import type { Language } from '../i18n/language';

export type GlossaryTopic = 'LTV' | 'DSTI' | 'RATE_TYPE_RISK';

const QUESTION_CUES: Record<Language, string[]> = {
  ca: ['què és', 'que es', 'què vol dir', 'que vol dir', 'explica', "m'expliques", 'quina diferència', 'diferencia entre', 'com funciona'],
  es: ['qué es', 'que es', 'qué significa', 'que significa', 'explica', 'explícame', 'qué diferencia', 'diferencia entre', 'cómo funciona'],
  en: ['what is', "what's", 'what are', 'explain', 'difference between', 'how does', 'how do'],
};

interface TopicKeywords {
  topic: GlossaryTopic;
  keywords: string[];
  /** True when a bare keyword match is enough (the keyword never collides with a real field answer). False when an explicit question cue must ALSO be present. */
  triggersWithoutCue: boolean;
}

const TOPIC_KEYWORDS: Record<Language, TopicKeywords[]> = {
  ca: [
    { topic: 'LTV', keywords: ['ltv', 'loan to value', 'percentatge de finançament', 'percentatge finançable'], triggersWithoutCue: true },
    { topic: 'DSTI', keywords: ['dsti', "endeutament", "ràtio d'endeutament", "nivell d'endeutament"], triggersWithoutCue: true },
    {
      topic: 'RATE_TYPE_RISK',
      keywords: ['tipus fix', 'tipus variable', 'fix o variable', 'fix i variable', 'risc del tipus', 'euríbor', 'euribor'],
      triggersWithoutCue: false,
    },
  ],
  es: [
    { topic: 'LTV', keywords: ['ltv', 'loan to value', 'porcentaje de financiación', 'porcentaje financiable'], triggersWithoutCue: true },
    { topic: 'DSTI', keywords: ['dsti', 'endeudamiento', 'ratio de endeudamiento', 'nivel de endeudamiento'], triggersWithoutCue: true },
    {
      topic: 'RATE_TYPE_RISK',
      keywords: ['tipo fijo', 'tipo variable', 'fijo o variable', 'fijo y variable', 'riesgo del tipo', 'euríbor', 'euribor'],
      triggersWithoutCue: false,
    },
  ],
  en: [
    { topic: 'LTV', keywords: ['ltv', 'loan to value', 'financing percentage'], triggersWithoutCue: true },
    { topic: 'DSTI', keywords: ['dsti', 'debt to income', 'debt-to-income', 'debt service'], triggersWithoutCue: true },
    {
      topic: 'RATE_TYPE_RISK',
      keywords: ['fixed rate', 'variable rate', 'fixed or variable', 'fixed and variable', 'rate risk', 'euribor'],
      triggersWithoutCue: false,
    },
  ],
};

/** Diacritic-insensitive normalization (matches extractCcaaCode's approach) so "diferència"/"diferencia" and similar accent variants are treated the same — a user typing without accents is common and shouldn't silently fall through to a misinterpreted field answer. */
function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

/**
 * Returns the recognized glossary topic for `text`, or null when it doesn't
 * look like a side question about one of the covered concepts. Pure and
 * side-effect free — the caller decides how to answer and how to resume the
 * pending field question. Must be checked BEFORE resolveAnswer for the
 * current question, not only as a fallback after it fails: resolveAnswer's
 * mortgageType matching is a generic substring check on "fix"/"variable",
 * so a side question like "what's the difference between fixed and
 * variable?" would otherwise be silently (mis)interpreted as a real answer
 * before glossary detection ever got a chance to run.
 */
export function detectGlossaryTopic(text: string, language: Language): GlossaryTopic | null {
  const normalized = ` ${normalize(text.trim())} `;
  const hasQuestionCue = QUESTION_CUES[language].some((cue) => normalized.includes(normalize(cue)));

  for (const entry of TOPIC_KEYWORDS[language]) {
    const matchesKeyword = entry.keywords.some((keyword) => normalized.includes(normalize(keyword)));
    if (matchesKeyword && (entry.triggersWithoutCue || hasQuestionCue)) {
      return entry.topic;
    }
  }
  return null;
}
