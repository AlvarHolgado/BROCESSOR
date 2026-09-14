/**
 * Zod validation schema for SimulatorInput (see /types/simulator.ts).
 * Messages here are stable translation KEYS, not user-facing text — the
 * schema itself is language-agnostic. useSimulator.ts resolves each key
 * through the active language's Dictionary['validation'] (see /i18n) before
 * showing it to the user. Numeric fields use z.coerce so raw string values
 * from controlled form inputs can be validated directly without a separate
 * parsing step.
 */

import { z } from 'zod';
import { CCAA_CODES } from '../data/ccaaOptions';
import { MAX_MORTGAGE_HOLDERS } from '../types/simulator';

/** Structural sanity bounds, not sourced financial data — catch fat-finger entries, not policy limits. Exported so useSimulator.ts can supply them to the parameterized validation messages (e.g. 'holderAgeMin'). */
export const MIN_AGE = 18;
export const MAX_AGE = 75;
export const MIN_DURATION_YEARS = 5;
export const MAX_DURATION_YEARS = 40;
export const MAX_PENDING_DEBTS_REMAINING_MONTHS = 600;

const EMPLOYMENT_TYPE_VALUES = [
  'INDEFINITE',
  'TEMPORARY',
  'SELF_EMPLOYED',
  'STATE_OFFICIAL',
  'RETIRED',
  'UNEMPLOYED',
  'OTHER',
] as const;

const baseSimulatorInputSchema = z.object({
  numberOfHolders: z.coerce
    .number({ invalid_type_error: 'numberOfHoldersInvalidType' })
    .int('numberOfHoldersInt')
    .min(1, 'numberOfHoldersMin')
    .max(MAX_MORTGAGE_HOLDERS, 'numberOfHoldersMax'),

  /** Length is cross-checked against numberOfHolders in the superRefine below. */
  holderNames: z.array(z.string().trim().min(1, 'holderNameRequired')).min(1, 'holderNamesMin'),

  /** Length is cross-checked against numberOfHolders in the superRefine below. */
  holderAges: z
    .array(
      z.coerce
        .number({ invalid_type_error: 'holderAgeInvalid' })
        .int('holderAgeInt')
        .min(MIN_AGE, 'holderAgeMin')
        .max(MAX_AGE, 'holderAgeMax')
    )
    .min(1, 'holderAgesMin'),

  /** Length is cross-checked against numberOfHolders in the superRefine below. */
  employmentTypes: z
    .array(
      z.enum(EMPLOYMENT_TYPE_VALUES, {
        errorMap: () => ({ message: 'employmentTypeInvalid' }),
      })
    )
    .min(1, 'employmentTypesMin'),

  /** Free-text explanation per holder, only required (via the superRefine below) when the matching employmentTypes entry is 'OTHER'. */
  employmentOtherDetails: z.array(z.string()),

  /** Length is cross-checked against numberOfHolders in the superRefine below. */
  monthlyNetIncomes: z
    .array(z.coerce.number({ invalid_type_error: 'incomeInvalid' }).positive('incomePositive'))
    .min(1, 'incomesMin'),

  pendingDebts: z.coerce.number({ invalid_type_error: 'amountInvalid' }).min(0, 'pendingDebtsMin'),

  /** Only required when pendingDebts > 0 — enforced by the cross-field superRefine below, not here. */
  pendingDebtsRemainingMonths: z.coerce
    .number({ invalid_type_error: 'debtsDurationInvalid' })
    .int('debtsDurationInt')
    .min(0, 'debtsDurationMin')
    .max(MAX_PENDING_DEBTS_REMAINING_MONTHS, 'debtsDurationMax'),

  availableSavings: z.coerce.number({ invalid_type_error: 'amountInvalid' }).min(0, 'savingsMin'),

  propertyType: z.enum(['NEW_BUILD', 'SECOND_HAND'], {
    errorMap: () => ({ message: 'propertyTypeInvalid' }),
  }),

  propertyUsage: z.enum(['HABITUAL', 'SECOND_HOME'], {
    errorMap: () => ({ message: 'propertyUsageInvalid' }),
  }),

  ccaa: z
    .string()
    .min(1, 'ccaaRequired')
    .refine((code) => CCAA_CODES.includes(code), { message: 'ccaaInvalid' }),

  appraisalValue: z.coerce.number({ invalid_type_error: 'appraisalInvalid' }).positive('appraisalPositive'),

  purchaseValue: z.coerce.number({ invalid_type_error: 'purchaseInvalid' }).positive('purchasePositive'),

  mortgageType: z.enum(['FIXED', 'VARIABLE', 'MIXED'], {
    errorMap: () => ({ message: 'mortgageTypeInvalid' }),
  }),

  durationYears: z.coerce
    .number({ invalid_type_error: 'durationInvalid' })
    .int('durationInt')
    .min(MIN_DURATION_YEARS, 'durationMin')
    .max(MAX_DURATION_YEARS, 'durationMax'),

  requestedLtvPercentage: z.coerce
    .number({ invalid_type_error: 'ltvInvalid' })
    .positive('ltvPositive')
    .max(100, 'ltvMax'),
});

/**
 * Cross-field checks live here rather than on individual field schemas:
 *  - pendingDebtsRemainingMonths is only meaningful — and only required —
 *    when pendingDebts > 0.
 *  - holderNames, holderAges and monthlyNetIncomes must each have exactly
 *    one entry per numberOfHolders, so identity and the household income
 *    sum used for DSTI always reflect every titular.
 */
export const simulatorInputSchema = baseSimulatorInputSchema.superRefine((data, ctx) => {
  if (data.pendingDebts > 0 && data.pendingDebtsRemainingMonths <= 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['pendingDebtsRemainingMonths'],
      message: 'debtsDurationRequired',
    });
  }

  if (data.holderNames.length !== data.numberOfHolders) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['holderNames'],
      message: 'holderNamesCrossCheck',
    });
  }

  if (data.holderAges.length !== data.numberOfHolders) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['holderAges'],
      message: 'holderAgesCrossCheck',
    });
  }

  if (data.employmentTypes.length !== data.numberOfHolders) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['employmentTypes'],
      message: 'employmentTypesCrossCheck',
    });
  } else {
    data.employmentTypes.forEach((employmentType, index) => {
      if (employmentType === 'OTHER' && !(data.employmentOtherDetails[index] ?? '').trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['employmentOtherDetails', index],
          message: 'employmentOtherRequired',
        });
      }
    });
  }

  if (data.monthlyNetIncomes.length !== data.numberOfHolders) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['monthlyNetIncomes'],
      message: 'incomesCrossCheck',
    });
  }
});

export type SimulatorInputValues = z.infer<typeof simulatorInputSchema>;

/** Raw, pre-validation shape accepted by the schema (numeric fields as string or number). */
export type SimulatorInputFormValues = z.input<typeof simulatorInputSchema>;
