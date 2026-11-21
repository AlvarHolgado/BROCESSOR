/**
 * Debt Service to Income (DSTI) scoring.
 * Pure functions only — no I/O, no data file access. See /types/simulator.ts
 * for the RiskProfile contract these functions produce.
 */

import type { RiskProfile } from '../types/simulator';

/** Traffic-light indicator paired with a RiskProfile for UI rendering. */
export type RiskColorIndicator = 'GREEN' | 'YELLOW' | 'RED';

/** Upper bound (inclusive) of the DSTI ratio considered low-risk (GREEN). */
export const DSTI_GREEN_THRESHOLD = 0.35;

/**
 * Floating-point slack for threshold comparisons: a loan sized to land exactly
 * on a limit (e.g. the max-viable bank offer) must still count as within it,
 * instead of tipping over by a 1e-12 rounding artefact.
 */
export const DSTI_COMPARISON_EPSILON = 1e-9;

/** Upper bound (inclusive) of the DSTI ratio considered medium-risk (YELLOW). Above this is RED. */
export const DSTI_YELLOW_THRESHOLD = 0.4;

export interface DstiScoreResult {
  /** Debt Service to Income ratio, as a decimal fraction (e.g. 0.32 for 32%). */
  dstiRatio: number;
  riskProfile: RiskProfile;
  colorIndicator: RiskColorIndicator;
}

/**
 * Calculates the DSTI ratio: total monthly debt obligations (existing debts plus
 * the projected mortgage quota) divided by net monthly income.
 */
export function calculateDstiRatio(
  monthlyDebts: number,
  projectedMortgageQuota: number,
  annualNetIncome: number
): number {
  const netMonthlyIncome = annualNetIncome / 12;
  if (netMonthlyIncome <= 0) {
    return Infinity;
  }
  return (monthlyDebts + projectedMortgageQuota) / netMonthlyIncome;
}

/** Maps a DSTI ratio to its risk profile and traffic-light color indicator. */
export function scoreDstiRisk(dstiRatio: number): { riskProfile: RiskProfile; colorIndicator: RiskColorIndicator } {
  if (dstiRatio <= DSTI_GREEN_THRESHOLD + DSTI_COMPARISON_EPSILON) {
    return { riskProfile: 'LOW', colorIndicator: 'GREEN' };
  }
  if (dstiRatio <= DSTI_YELLOW_THRESHOLD + DSTI_COMPARISON_EPSILON) {
    return { riskProfile: 'MEDIUM', colorIndicator: 'YELLOW' };
  }
  return { riskProfile: 'HIGH', colorIndicator: 'RED' };
}

/** Calculates the DSTI ratio and its associated risk profile in a single call. */
export function assessMortgageRisk(
  monthlyDebts: number,
  projectedMortgageQuota: number,
  annualNetIncome: number
): DstiScoreResult {
  const dstiRatio = calculateDstiRatio(monthlyDebts, projectedMortgageQuota, annualNetIncome);
  const { riskProfile, colorIndicator } = scoreDstiRisk(dstiRatio);
  return { dstiRatio, riskProfile, colorIndicator };
}

/**
 * Maximum monthly mortgage quota the user can take on while staying within the
 * GREEN (low-risk) DSTI threshold, given their existing debts and income.
 * Returns 0 when existing debts alone already exceed the threshold.
 */
export function calculateMaxRecommendedQuota(monthlyDebts: number, annualNetIncome: number): number {
  const netMonthlyIncome = annualNetIncome / 12;
  const maxTotalDebtService = netMonthlyIncome * DSTI_GREEN_THRESHOLD;
  return Math.max(maxTotalDebtService - monthlyDebts, 0);
}

/**
 * Dual/temporal DSTI profile: existing debts (loans, cards, alimony) are
 * usually not perpetual, so a single flat DSTI figure hides that the
 * borrower's real risk profile improves once those debts are paid off.
 */
export interface TemporalDstiAssessment {
  /** DSTI while the existing pendingDebts are still being paid, alongside the new mortgage quota. */
  immediate: DstiScoreResult;
  /** DSTI once the existing pendingDebts are fully paid off — only the mortgage quota remains. */
  longTerm: DstiScoreResult;
  /** True when pendingDebtsRemainingMonths falls within the mortgage term, so the long-term profile is actually reached during the mortgage's life. False (and immediate === longTerm) when there are no pending debts, or they outlast the mortgage itself. */
  reachesLongTermProfile: boolean;
  /** Echoes the input, for the UI to phrase "a partir de l'any X" without re-deriving it. */
  pendingDebtsRemainingMonths: number;
}

/**
 * Assesses DSTI risk under both an immediate profile (existing debts still
 * active) and a long-term profile (existing debts fully paid off), so a
 * temporary debt load doesn't permanently misrepresent long-run viability.
 */
export function assessTemporalMortgageRisk(
  monthlyDebts: number,
  pendingDebtsRemainingMonths: number,
  projectedMortgageQuota: number,
  annualNetIncome: number,
  mortgageDurationMonths: number
): TemporalDstiAssessment {
  const immediate = assessMortgageRisk(monthlyDebts, projectedMortgageQuota, annualNetIncome);
  const longTerm = assessMortgageRisk(0, projectedMortgageQuota, annualNetIncome);
  const reachesLongTermProfile = monthlyDebts > 0 ? pendingDebtsRemainingMonths < mortgageDurationMonths : true;

  return { immediate, longTerm, reachesLongTermProfile, pendingDebtsRemainingMonths };
}
