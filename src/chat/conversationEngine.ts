/**
 * Pure conversation-flow logic for the chat assistant: given the CURRENT
 * shared form state, decides which field to ask about next (getNextQuestion)
 * and how to interpret a free-text reply for that field (resolveAnswer).
 * Deliberately has no React/UI concerns — the assistant component owns
 * message rendering and calls the exact same useSimulator setters the form
 * inputs use, so chat-filled and manually-typed values are the same single
 * source of truth (SimulatorFormState).
 */

import type { SimulatorFormState } from '../hooks/useSimulator';
import { MAX_MORTGAGE_HOLDERS, type EmploymentType, type MortgageType, type PropertyType, type PropertyUsage } from '../types/simulator';
import type { Language } from '../i18n/language';
import type { Dictionary } from '../i18n/dictionaries/ca';
import {
  extractCcaaCode,
  extractEmploymentType,
  extractMortgageType,
  extractName,
  extractNumber,
  extractNumberOrZeroForNegation,
  extractPropertyType,
  extractPropertyUsage,
} from './extraction';

export type ChatQuestion =
  | { kind: 'numberOfHolders' }
  | { kind: 'holderName'; index: number }
  | { kind: 'holderAge'; index: number }
  | { kind: 'employmentType'; index: number }
  | { kind: 'employmentOtherDetail'; index: number }
  | { kind: 'holderIncome'; index: number }
  | { kind: 'pendingDebts' }
  | { kind: 'pendingDebtsRemainingMonths' }
  | { kind: 'availableSavings' }
  | { kind: 'purchaseValue' }
  | { kind: 'appraisalValue' }
  | { kind: 'propertyType' }
  | { kind: 'propertyUsage' }
  | { kind: 'ccaa' }
  | { kind: 'requestedLtvPercentage' }
  | { kind: 'durationYears' }
  | { kind: 'mortgageType' }
  | { kind: 'done' };

/** Stable string key for a question, so callers can detect "did the current question change" without deep-comparing objects. */
export function questionKey(question: ChatQuestion): string {
  return 'index' in question ? `${question.kind}:${question.index}` : question.kind;
}

function isFilled(value: string | undefined): boolean {
  return Boolean(value && value.trim() !== '');
}

/** Current holder count as a positive integer, defaulting to 1 (singular) while it's still unknown/blank — the friendliest generic default for an as-yet-unknown audience size. */
export function resolveNumberOfHolders(values: SimulatorFormState): number {
  const parsed = Number(values.numberOfHolders);
  return Number.isFinite(parsed) && parsed >= 1 ? Math.trunc(parsed) : 1;
}

/**
 * Which data-entry screen (2 or 3) a question's field lives on — lets the
 * assistant switch the wizard's active step to follow along as it asks
 * about fields on the other screen. `done` (and any future non-field
 * question) has no associated screen.
 */
export function getQuestionStep(question: ChatQuestion): 2 | 3 | null {
  switch (question.kind) {
    case 'numberOfHolders':
    case 'holderName':
    case 'holderAge':
    case 'employmentType':
    case 'employmentOtherDetail':
    case 'holderIncome':
    case 'pendingDebts':
    case 'pendingDebtsRemainingMonths':
    case 'availableSavings':
      return 2;
    case 'purchaseValue':
    case 'appraisalValue':
    case 'propertyType':
    case 'propertyUsage':
    case 'ccaa':
    case 'requestedLtvPercentage':
    case 'durationYears':
    case 'mortgageType':
      return 3;
    case 'done':
      return null;
  }
}

/**
 * DOM element id to scroll into view for a question, matching the ids
 * Screen2DebtorData/Screen3PropertyFinancing/WizardFormControls render
 * (either a WizardField's own id, or a QuestionBlock's wrapper id for
 * card-selector questions that have no single input element).
 */
export function getScrollTargetId(question: ChatQuestion): string | null {
  switch (question.kind) {
    case 'numberOfHolders':
      return 'question-numberOfHolders';
    case 'holderName':
      return `holderName-${question.index}`;
    case 'holderAge':
      return `holderAge-${question.index}`;
    case 'employmentType':
      return `employmentType-${question.index}`;
    case 'employmentOtherDetail':
      return `employmentOtherDetail-${question.index}`;
    case 'holderIncome':
      return `holderIncome-${question.index}`;
    case 'pendingDebts':
      return 'pendingDebts';
    case 'pendingDebtsRemainingMonths':
      return 'pendingDebtsRemainingMonths';
    case 'availableSavings':
      return 'availableSavings';
    case 'purchaseValue':
      return 'purchaseValue';
    case 'appraisalValue':
      return 'appraisalValue';
    case 'propertyType':
      return 'propertyType';
    case 'propertyUsage':
      return 'question-propertyUsage';
    case 'ccaa':
      return 'ccaa';
    case 'requestedLtvPercentage':
      return 'requestedLtvPercentage';
    case 'durationYears':
      return 'durationYears';
    case 'mortgageType':
      return 'mortgageType';
    case 'done':
      return null;
  }
}

/**
 * Walks the same field order the two data-entry screens present, returning
 * the first one that's still empty. Holder-scoped fields (name/age/
 * employment/income) are asked one holder at a time, in the same order
 * Screen2DebtorData collects them. Purely a function of `values` — so
 * re-running it after ANY change (chat-driven or a manual form edit)
 * always reflects the true current state, with no separate step counter
 * to fall out of sync.
 */
export function getNextQuestion(values: SimulatorFormState): ChatQuestion {
  if (!isFilled(values.numberOfHolders) || Number(values.numberOfHolders) < 1) {
    return { kind: 'numberOfHolders' };
  }

  const numberOfHolders = Math.min(Math.max(Math.trunc(Number(values.numberOfHolders)), 1), MAX_MORTGAGE_HOLDERS);

  for (let index = 0; index < numberOfHolders; index += 1) {
    if (!isFilled(values.holderNames[index])) {
      return { kind: 'holderName', index };
    }
  }
  for (let index = 0; index < numberOfHolders; index += 1) {
    if (!isFilled(values.holderAges[index])) {
      return { kind: 'holderAge', index };
    }
  }
  for (let index = 0; index < numberOfHolders; index += 1) {
    if (!isFilled(values.employmentTypes[index])) {
      return { kind: 'employmentType', index };
    }
    if (values.employmentTypes[index] === 'OTHER' && !isFilled(values.employmentOtherDetails[index])) {
      return { kind: 'employmentOtherDetail', index };
    }
  }
  for (let index = 0; index < numberOfHolders; index += 1) {
    if (!isFilled(values.monthlyNetIncomes[index])) {
      return { kind: 'holderIncome', index };
    }
  }

  if (!isFilled(values.pendingDebts)) {
    return { kind: 'pendingDebts' };
  }
  if (Number(values.pendingDebts) > 0 && !isFilled(values.pendingDebtsRemainingMonths)) {
    return { kind: 'pendingDebtsRemainingMonths' };
  }
  if (!isFilled(values.availableSavings)) {
    return { kind: 'availableSavings' };
  }
  if (!isFilled(values.purchaseValue)) {
    return { kind: 'purchaseValue' };
  }
  if (!isFilled(values.appraisalValue)) {
    return { kind: 'appraisalValue' };
  }
  if (!isFilled(values.propertyType)) {
    return { kind: 'propertyType' };
  }
  if (!isFilled(values.propertyUsage)) {
    return { kind: 'propertyUsage' };
  }
  if (!isFilled(values.ccaa)) {
    return { kind: 'ccaa' };
  }
  if (!isFilled(values.requestedLtvPercentage)) {
    return { kind: 'requestedLtvPercentage' };
  }
  if (!isFilled(values.durationYears)) {
    return { kind: 'durationYears' };
  }
  if (!isFilled(values.mortgageType)) {
    return { kind: 'mortgageType' };
  }

  return { kind: 'done' };
}

export type ChatAnswer =
  | { success: false }
  | { success: true; kind: 'numberOfHolders'; count: number }
  | { success: true; kind: 'holderName'; index: number; value: string }
  | { success: true; kind: 'holderAge'; index: number; value: number }
  | { success: true; kind: 'employmentType'; index: number; value: EmploymentType }
  | { success: true; kind: 'employmentOtherDetail'; index: number; value: string }
  | { success: true; kind: 'holderIncome'; index: number; value: number }
  | { success: true; kind: 'pendingDebts'; value: number }
  | { success: true; kind: 'pendingDebtsRemainingMonths'; value: number }
  | { success: true; kind: 'availableSavings'; value: number }
  | { success: true; kind: 'purchaseValue'; value: number }
  | { success: true; kind: 'appraisalValue'; value: number }
  | { success: true; kind: 'propertyType'; value: PropertyType }
  | { success: true; kind: 'propertyUsage'; value: PropertyUsage }
  | { success: true; kind: 'ccaa'; value: string }
  | { success: true; kind: 'requestedLtvPercentage'; value: number }
  | { success: true; kind: 'durationYears'; value: number }
  | { success: true; kind: 'mortgageType'; value: MortgageType };

export interface CcaaCandidate {
  code: string;
  names: string[];
}

/** Interprets a free-text reply for the given question. Returns { success: false } rather than guessing when nothing usable was found, so the assistant can ask for clarification instead of silently writing a wrong value. */
export function resolveAnswer(
  question: ChatQuestion,
  text: string,
  language: Language,
  ccaaCandidates: CcaaCandidate[]
): ChatAnswer {
  switch (question.kind) {
    case 'numberOfHolders': {
      const count = extractNumber(text);
      if (count === null || !Number.isInteger(count) || count < 1 || count > MAX_MORTGAGE_HOLDERS) {
        return { success: false };
      }
      return { success: true, kind: 'numberOfHolders', count };
    }
    case 'holderName': {
      const value = extractName(text);
      return value ? { success: true, kind: 'holderName', index: question.index, value } : { success: false };
    }
    case 'holderAge': {
      const value = extractNumber(text);
      return value !== null ? { success: true, kind: 'holderAge', index: question.index, value } : { success: false };
    }
    case 'employmentType': {
      const value = extractEmploymentType(text, language);
      return value ? { success: true, kind: 'employmentType', index: question.index, value } : { success: false };
    }
    case 'employmentOtherDetail': {
      const trimmed = text.trim();
      return trimmed.length >= 2
        ? { success: true, kind: 'employmentOtherDetail', index: question.index, value: trimmed }
        : { success: false };
    }
    case 'holderIncome': {
      const value = extractNumber(text);
      return value !== null ? { success: true, kind: 'holderIncome', index: question.index, value } : { success: false };
    }
    case 'pendingDebts': {
      const value = extractNumberOrZeroForNegation(text, language);
      return value !== null ? { success: true, kind: 'pendingDebts', value } : { success: false };
    }
    case 'pendingDebtsRemainingMonths': {
      const value = extractNumber(text);
      return value !== null ? { success: true, kind: 'pendingDebtsRemainingMonths', value } : { success: false };
    }
    case 'availableSavings': {
      const value = extractNumberOrZeroForNegation(text, language);
      return value !== null ? { success: true, kind: 'availableSavings', value } : { success: false };
    }
    case 'purchaseValue': {
      const value = extractNumber(text);
      return value !== null ? { success: true, kind: 'purchaseValue', value } : { success: false };
    }
    case 'appraisalValue': {
      const value = extractNumber(text);
      return value !== null ? { success: true, kind: 'appraisalValue', value } : { success: false };
    }
    case 'propertyType': {
      const value = extractPropertyType(text, language);
      return value ? { success: true, kind: 'propertyType', value } : { success: false };
    }
    case 'propertyUsage': {
      const value = extractPropertyUsage(text, language);
      return value ? { success: true, kind: 'propertyUsage', value } : { success: false };
    }
    case 'ccaa': {
      const value = extractCcaaCode(text, ccaaCandidates);
      return value ? { success: true, kind: 'ccaa', value } : { success: false };
    }
    case 'requestedLtvPercentage': {
      const value = extractNumber(text);
      return value !== null && value > 0 && value <= 100 ? { success: true, kind: 'requestedLtvPercentage', value } : { success: false };
    }
    case 'durationYears': {
      const value = extractNumber(text);
      return value !== null ? { success: true, kind: 'durationYears', value } : { success: false };
    }
    case 'mortgageType': {
      const value = extractMortgageType(text, language);
      return value ? { success: true, kind: 'mortgageType', value } : { success: false };
    }
    case 'done':
      return { success: false };
  }
}

function resizePreserving(previous: string[], count: number): string[] {
  return Array.from({ length: count }, (_, index) => previous[index] ?? '');
}

/**
 * Pure preview of what `values` will become once `answer` is applied via
 * the matching useSimulator setter — mirrors that hook's own update logic
 * exactly (including numberOfHolders' array-resizing behavior). Lets the
 * chat assistant know what to ask next IMMEDIATELY after a successful
 * answer, without waiting an extra render for the real setState to land.
 */
export function applyAnswerToValues(values: SimulatorFormState, answer: Extract<ChatAnswer, { success: true }>): SimulatorFormState {
  switch (answer.kind) {
    case 'numberOfHolders':
      return {
        ...values,
        numberOfHolders: String(answer.count),
        holderNames: resizePreserving(values.holderNames, answer.count),
        holderAges: resizePreserving(values.holderAges, answer.count),
        employmentTypes: resizePreserving(values.employmentTypes, answer.count),
        employmentOtherDetails: resizePreserving(values.employmentOtherDetails, answer.count),
        monthlyNetIncomes: resizePreserving(values.monthlyNetIncomes, answer.count),
      };
    case 'holderName': {
      const holderNames = [...values.holderNames];
      holderNames[answer.index] = answer.value;
      return { ...values, holderNames };
    }
    case 'holderAge': {
      const holderAges = [...values.holderAges];
      holderAges[answer.index] = String(answer.value);
      return { ...values, holderAges };
    }
    case 'employmentType': {
      const employmentTypes = [...values.employmentTypes];
      employmentTypes[answer.index] = answer.value;
      return { ...values, employmentTypes };
    }
    case 'employmentOtherDetail': {
      const employmentOtherDetails = [...values.employmentOtherDetails];
      employmentOtherDetails[answer.index] = answer.value;
      return { ...values, employmentOtherDetails };
    }
    case 'holderIncome': {
      const monthlyNetIncomes = [...values.monthlyNetIncomes];
      monthlyNetIncomes[answer.index] = String(answer.value);
      return { ...values, monthlyNetIncomes };
    }
    case 'pendingDebts':
      return { ...values, pendingDebts: String(answer.value) };
    case 'pendingDebtsRemainingMonths':
      return { ...values, pendingDebtsRemainingMonths: String(answer.value) };
    case 'availableSavings':
      return { ...values, availableSavings: String(answer.value) };
    case 'purchaseValue':
      return { ...values, purchaseValue: String(answer.value) };
    case 'appraisalValue':
      return { ...values, appraisalValue: String(answer.value) };
    case 'propertyType':
      return { ...values, propertyType: answer.value };
    case 'propertyUsage':
      return { ...values, propertyUsage: answer.value };
    case 'ccaa':
      return { ...values, ccaa: answer.value };
    case 'requestedLtvPercentage':
      return { ...values, requestedLtvPercentage: String(answer.value) };
    case 'durationYears':
      return { ...values, durationYears: String(answer.value) };
    case 'mortgageType':
      return { ...values, mortgageType: answer.value };
  }
}

/** The holder's entered name, or a "Holder N"-style fallback (translated) while it's still unknown. */
export function holderDisplayName(values: SimulatorFormState, index: number, t: Dictionary): string {
  return values.holderNames[index]?.trim() || t.screen2.holderFallbackLabel(index);
}

/**
 * Renders the natural-language question text for `question`, addressing the
 * relevant holder by name once known. Questions phrased with a direct
 * "you" verb (e.g. "do YOU have any debts?") are given the current holder
 * count so the dictionary can pick the grammatically correct singular vs.
 * plural form (see Dictionary['chat']['questions'] in /i18n) — questions
 * that address one already-named holder (holderAge, employmentType, etc.)
 * don't need this, since naming someone is always grammatically singular
 * regardless of how many OTHER holders there are.
 */
export function buildQuestionText(question: ChatQuestion, values: SimulatorFormState, t: Dictionary): string {
  const q = t.chat.questions;
  const numberOfHolders = resolveNumberOfHolders(values);
  switch (question.kind) {
    case 'numberOfHolders':
      return q.numberOfHolders();
    case 'holderName':
      return q.holderName(question.index);
    case 'holderAge':
      return q.holderAge(holderDisplayName(values, question.index, t));
    case 'employmentType':
      return q.employmentType(holderDisplayName(values, question.index, t));
    case 'employmentOtherDetail':
      return q.employmentOtherDetail(holderDisplayName(values, question.index, t));
    case 'holderIncome':
      return q.holderIncome(holderDisplayName(values, question.index, t));
    case 'pendingDebts':
      return q.pendingDebts(numberOfHolders);
    case 'pendingDebtsRemainingMonths':
      return q.pendingDebtsRemainingMonths();
    case 'availableSavings':
      return q.availableSavings(numberOfHolders);
    case 'purchaseValue':
      return q.purchaseValue();
    case 'appraisalValue':
      return q.appraisalValue();
    case 'propertyType':
      return q.propertyType();
    case 'propertyUsage':
      return q.propertyUsage(numberOfHolders);
    case 'ccaa':
      return q.ccaa();
    case 'requestedLtvPercentage':
      return q.requestedLtvPercentage(numberOfHolders);
    case 'durationYears':
      return q.durationYears(numberOfHolders);
    case 'mortgageType':
      return q.mortgageType(numberOfHolders);
    case 'done':
      return t.chat.askDownloadPdf(numberOfHolders);
  }
}
