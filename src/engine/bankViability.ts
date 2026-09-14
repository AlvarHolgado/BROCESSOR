/**
 * Evaluates whether a direct-bank offer (bonified or non-bonified) is
 * viable under standard bank underwriting limits — LTV capped at the
 * bank's max, and DSTI within the low-risk (GREEN) threshold — and, when
 * it isn't, computes the largest loan amount/LTV a bank could still grant
 * safely for this profile. Never applies to the broker channel, which
 * uses its own LTV ceiling instead (see ltvResolver.ts).
 */

import { calculateLtvPercentage, calculateMaxLoanFromMonthlyBudget } from './mortgageEngine';
import { DSTI_GREEN_THRESHOLD, calculateMaxRecommendedQuota } from './scoring';

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
  const dstiExceeded = immediateDstiRatio > DSTI_GREEN_THRESHOLD;

  const maxAffordableMonthlyQuota = calculateMaxRecommendedQuota(monthlyDebts, netAnnualIncome);
  const maxLoanFromDsti = calculateMaxLoanFromMonthlyBudget(maxAffordableMonthlyQuota, tin, durationYears);
  const maxLoanFromLtv = referenceValue * (bankMaxLtvPercentage / 100);
  const maxViableLoanAmount = Math.max(0, Math.min(maxLoanFromDsti, maxLoanFromLtv));
  const maxViableLtvPercentage = calculateLtvPercentage(maxViableLoanAmount, referenceValue);

  return {
    isViable: !ltvExceeded && !dstiExceeded,
    ltvExceeded,
    dstiExceeded,
    maxViableLoanAmount,
    maxViableLtvPercentage,
  };
}
