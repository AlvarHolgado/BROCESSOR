/**
 * Evaluates whether a direct-bank offer (bonified or non-bonified) is
 * viable under standard bank underwriting limits — LTV capped at the
 * bank's max, and DSTI within the low-risk (GREEN) threshold — and, when
 * it isn't, computes the largest loan amount/LTV a bank could still grant
 * safely for this profile. Never applies to the broker channel, which
 * uses its own LTV ceiling instead (see ltvResolver.ts).
 */

import { calculateLtvPercentage, calculateMaxLoanFromMonthlyBudget } from './mortgageEngine';
import { DSTI_COMPARISON_EPSILON, DSTI_GREEN_THRESHOLD, calculateMaxRecommendedQuota } from './scoring';

/**
 * Structured (non-localized) reason code for why a requested offer was not
 * viable as-is. Kept as an enum rather than a message string so this module
 * stays a pure, i18n-free engine function per .clauderules Rule 3 — the UI
 * layer maps this to a localized justification sentence via the Dictionary
 * (see OfferCardParts.tsx), the same way every other UI-facing figure in
 * this codebase is translated rather than baked in at the source.
 */
export type ViabilityJustificationReason = 'NONE' | 'LTV_EXCEEDED' | 'DSTI_EXCEEDED' | 'BOTH_EXCEEDED';

export interface BankViabilityAssessment {
  isViable: boolean;
  /** True when the requested LTV exceeded the bank's max and had to be capped. */
  ltvExceeded: boolean;
  /** True when the immediate DSTI ratio exceeds the low-risk (GREEN) threshold. */
  dstiExceeded: boolean;
  /** Largest loan amount a bank could grant this profile while staying within both limits. */
  maxViableLoanAmount: number;
  /** LTV percentage implied by maxViableLoanAmount over the reference property value. */
  maxViableLtvPercentage: number;
  /** Derived directly from ltvExceeded/dstiExceeded — which limit(s) forced the reduction, for the UI's justification message. */
  justificationReason: ViabilityJustificationReason;
}

export function assessBankViability(
  ltvWasCapped: boolean,
  immediateDstiRatio: number,
  monthlyDebts: number,
  netAnnualIncome: number,
  tin: number,
  durationYears: number,
  referenceValue: number,
  bankMaxLtvPercentage: number
): BankViabilityAssessment {
  const ltvExceeded = ltvWasCapped;
  const dstiExceeded = immediateDstiRatio > DSTI_GREEN_THRESHOLD + DSTI_COMPARISON_EPSILON;

  const maxAffordableMonthlyQuota = calculateMaxRecommendedQuota(monthlyDebts, netAnnualIncome);
  const maxLoanFromDsti = calculateMaxLoanFromMonthlyBudget(maxAffordableMonthlyQuota, tin, durationYears);
  const maxLoanFromLtv = referenceValue * (bankMaxLtvPercentage / 100);
  const maxViableLoanAmount = Math.max(0, Math.min(maxLoanFromDsti, maxLoanFromLtv));
  const maxViableLtvPercentage = calculateLtvPercentage(maxViableLoanAmount, referenceValue);

  const justificationReason: ViabilityJustificationReason =
    ltvExceeded && dstiExceeded ? 'BOTH_EXCEEDED' : ltvExceeded ? 'LTV_EXCEEDED' : dstiExceeded ? 'DSTI_EXCEEDED' : 'NONE';

  return {
    isViable: !ltvExceeded && !dstiExceeded,
    ltvExceeded,
    dstiExceeded,
    maxViableLoanAmount,
    maxViableLtvPercentage,
    justificationReason,
  };
}
