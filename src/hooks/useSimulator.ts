/**
 * React state management for the quick mortgage simulator: holds raw form
 * field values, validates them against simulatorInputSchema on every change,
 * and derives the full engine output via computeSimulatorOutput whenever the
 * input is valid. All computation stays delegated to /engine — this hook
 * only wires React state to those pure functions.
 */

import { useCallback, useMemo, useState } from 'react';
import {
  MAX_AGE,
  MAX_DURATION_YEARS,
  MAX_PENDING_DEBTS_REMAINING_MONTHS,
  MIN_AGE,
  MIN_DURATION_YEARS,
  simulatorInputSchema,
  type SimulatorInputFormValues,
} from '../schemas/simulatorSchema';
import { MAX_MORTGAGE_HOLDERS } from '../types/simulator';
import { CCAA_TAX_RATES } from '../data/ccaaOptions';
import { MARKET_RATES } from '../data/marketRatesData';
import { FORMALIZATION_FEES } from '../data/formalizationFeesData';
import { computeSimulatorOutput, type SimulatorOutput, type SimulatorReferenceData } from '../engine/simulate';
import type { SimulatorInput } from '../types/simulator';
import { getDictionary } from '../i18n/LanguageContext';
import type { Dictionary } from '../i18n/dictionaries/ca';
import { DEFAULT_LANGUAGE, type Language } from '../i18n/language';

/** Numeric parameter each parameterized validation key needs, resolved from the same bound constants the schema itself enforces — so the translated message can never drift out of sync with the actual rule. */
const VALIDATION_KEY_PARAMS: Partial<Record<keyof Dictionary['validation'], number>> = {
  numberOfHoldersMax: MAX_MORTGAGE_HOLDERS,
  holderAgeMin: MIN_AGE,
  holderAgeMax: MAX_AGE,
  debtsDurationMax: MAX_PENDING_DEBTS_REMAINING_MONTHS,
  durationMin: MIN_DURATION_YEARS,
  durationMax: MAX_DURATION_YEARS,
};

/** Resolves a stable Zod issue message (a Dictionary['validation'] key) into localized text for the given language. */
function translateValidationMessage(key: string, language: Language): string {
  const dictionary = getDictionary(language);
  const entry = dictionary.validation[key as keyof Dictionary['validation']];
  if (typeof entry !== 'function') {
    return key;
  }
  const param = VALIDATION_KEY_PARAMS[key as keyof Dictionary['validation']] ?? 0;
  return (entry as (n: number) => string)(param);
}

/** Per-holder raw string fields, whose array length is driven by numberOfHolders — see setNumberOfHolders and the per-holder setters below. */
type PerHolderField = 'holderNames' | 'holderAges' | 'employmentTypes' | 'employmentOtherDetails' | 'monthlyNetIncomes';

/**
 * Every scalar field as a raw string, matching what a controlled
 * <input>/<select> element produces — except the per-holder fields, which
 * are one raw string per holder.
 */
export type SimulatorFormState = Omit<Record<keyof SimulatorInputFormValues, string>, PerHolderField> & {
  holderNames: string[];
  holderAges: string[];
  employmentTypes: string[];
  employmentOtherDetails: string[];
  monthlyNetIncomes: string[];
};

export const EMPTY_SIMULATOR_FORM_STATE: SimulatorFormState = {
  numberOfHolders: '',
  holderNames: [],
  holderAges: [],
  employmentTypes: [],
  employmentOtherDetails: [],
  monthlyNetIncomes: [],
  pendingDebts: '',
  pendingDebtsRemainingMonths: '',
  availableSavings: '',
  propertyType: '',
  propertyUsage: '',
  ccaa: '',
  appraisalValue: '',
  purchaseValue: '',
  mortgageType: '',
  durationYears: '',
  requestedLtvPercentage: '',
};

const REFERENCE_DATA: SimulatorReferenceData = {
  ccaaTaxRates: CCAA_TAX_RATES,
  marketRates: MARKET_RATES,
  formalizationFees: FORMALIZATION_FEES,
};

export type SimulatorFieldErrors = Partial<Record<keyof SimulatorFormState, string>>;

export interface UseSimulatorResult {
  values: SimulatorFormState;
  /** First validation message per field, translated into the active language, for inline real-time feedback. */
  errors: SimulatorFieldErrors;
  isValid: boolean;
  /** Parsed/coerced input matching SimulatorInput, or null while incomplete/invalid. */
  input: SimulatorInput | null;
  /** Full engine result, or null while the input is incomplete/invalid. */
  output: SimulatorOutput | null;
  setField: (field: keyof Omit<SimulatorFormState, PerHolderField>, value: string) => void;
  /** Resizes every per-holder array to match the chosen holder count, preserving already-entered values. */
  setNumberOfHolders: (count: number) => void;
  /** Updates a single holder's full name by index. */
  setHolderName: (index: number, value: string) => void;
  /** Updates a single holder's age by index. */
  setHolderAge: (index: number, value: string) => void;
  /** Updates a single holder's employment status by index. */
  setEmploymentType: (index: number, value: string) => void;
  /** Updates a single holder's free-text employment explanation by index (only meaningful when that holder's employmentType is 'OTHER'). */
  setEmploymentOtherDetail: (index: number, value: string) => void;
  /** Updates a single holder's net monthly income by index. */
  setHolderIncome: (index: number, value: string) => void;
  reset: () => void;
}

function resizePreserving(previous: string[], count: number): string[] {
  return Array.from({ length: count }, (_, index) => previous[index] ?? '');
}

export function useSimulator(
  initialValues: Partial<SimulatorFormState> = {},
  language: Language = DEFAULT_LANGUAGE
): UseSimulatorResult {
  const [values, setValues] = useState<SimulatorFormState>({
    ...EMPTY_SIMULATOR_FORM_STATE,
    ...initialValues,
  });

  const setField = useCallback((field: keyof Omit<SimulatorFormState, PerHolderField>, value: string) => {
    setValues((previous) => ({ ...previous, [field]: value }));
  }, []);

  const setNumberOfHolders = useCallback((count: number) => {
    setValues((previous) => ({
      ...previous,
      numberOfHolders: String(count),
      holderNames: resizePreserving(previous.holderNames, count),
      holderAges: resizePreserving(previous.holderAges, count),
      employmentTypes: resizePreserving(previous.employmentTypes, count),
      employmentOtherDetails: resizePreserving(previous.employmentOtherDetails, count),
      monthlyNetIncomes: resizePreserving(previous.monthlyNetIncomes, count),
    }));
  }, []);

  const setHolderArrayField = useCallback((field: PerHolderField, index: number, value: string) => {
    setValues((previous) => {
      const nextArray = [...previous[field]];
      nextArray[index] = value;
      return { ...previous, [field]: nextArray };
    });
  }, []);

  const setHolderName = useCallback(
    (index: number, value: string) => setHolderArrayField('holderNames', index, value),
    [setHolderArrayField]
  );
  const setHolderAge = useCallback(
    (index: number, value: string) => setHolderArrayField('holderAges', index, value),
    [setHolderArrayField]
  );
  const setEmploymentType = useCallback(
    (index: number, value: string) => setHolderArrayField('employmentTypes', index, value),
    [setHolderArrayField]
  );
  const setEmploymentOtherDetail = useCallback(
    (index: number, value: string) => setHolderArrayField('employmentOtherDetails', index, value),
    [setHolderArrayField]
  );
  const setHolderIncome = useCallback(
    (index: number, value: string) => setHolderArrayField('monthlyNetIncomes', index, value),
    [setHolderArrayField]
  );

  const reset = useCallback(() => {
    setValues(EMPTY_SIMULATOR_FORM_STATE);
  }, []);

  const validation = useMemo(() => simulatorInputSchema.safeParse(values), [values]);

  const errors = useMemo<SimulatorFieldErrors>(() => {
    if (validation.success) {
      return {};
    }
    const fieldErrors: SimulatorFieldErrors = {};
    for (const issue of validation.error.issues) {
      const field = issue.path[0] as keyof SimulatorFormState | undefined;
      if (field && !fieldErrors[field]) {
        fieldErrors[field] = translateValidationMessage(issue.message, language);
      }
    }
    return fieldErrors;
  }, [validation, language]);

  const input = useMemo<SimulatorInput | null>(() => (validation.success ? validation.data : null), [validation]);

  const output = useMemo<SimulatorOutput | null>(() => {
    if (!input) {
      return null;
    }
    return computeSimulatorOutput(input, REFERENCE_DATA);
  }, [input]);

  return {
    values,
    errors,
    isValid: validation.success,
    input,
    output,
    setField,
    setNumberOfHolders,
    setHolderName,
    setHolderAge,
    setEmploymentType,
    setEmploymentOtherDetail,
    setHolderIncome,
    reset,
  };
}
