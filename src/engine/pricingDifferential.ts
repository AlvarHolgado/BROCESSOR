/**
 * Computes an explicit, transparent broker-vs-direct-bank pricing
 * differential from the three already-resolved MortgagePathResult objects —
 * purely derived arithmetic over real, sourced figures (see
 * marketTinResolver.ts / ltvResolver.ts), never a fabricated or assumed
 * "broker discount". Per .clauderules Rule 1 (Zero Data Hallucination), no
 * new numeric benchmark is introduced here: when the broker channel's TIN,
 * TAE and max LTV all coincide with the baseline bank channel's own figures
 * (a real possibility when the sourced market data for a mortgage type is
 * too sparse to show a distinct broker quote — see MIXED in
 * marketRates.json), this module reports that honestly via
 * `hasMeaningfulAdvantage: false` rather than inventing a delta.
 */

import type { MortgagePathResult } from './simulate';

export interface PricingDifferentialResult {
  /** Direct-bank channel used as the comparison baseline: bank-bonified when it has a resolvable rate, otherwise bank-non-bonified. Null when neither channel has market data for this mortgage type. */
  baselineChannel: 'BANK_BONIFIED' | 'BANK_NON_BONIFIED' | null;
  /** broker.rate.tin - baseline.rate.tin, in percentage points. Negative means the broker's rate is cheaper. Null when either side's TIN is unavailable. */
  tinDeltaPercentagePoints: number | null;
  /** Same as tinDeltaPercentagePoints, for TAE. */
  taeDeltaPercentagePoints: number | null;
  /** broker's max LTV ceiling minus the baseline's, in percentage points. Positive means the broker channel reaches a higher LTV tier. */
  maxLtvDeltaPercentagePoints: number;
  /** broker.monthlyQuota - baseline.monthlyQuota. Negative means the broker's quota is cheaper. Null when either is unavailable. */
  monthlyQuotaDelta: number | null;
  /** broker.costOfCredit.totalCostOfCredit - baseline's. Negative means the broker path costs less overall. Null when either is unavailable. */
  totalCostOfCreditDelta: number | null;
  /**
   * True when the broker channel demonstrably improves on the baseline in at
   * least one of: a lower TIN/TAE, or a higher max LTV ceiling. False when,
   * given the currently available market data, the broker resolves to the
   * exact same rate and LTV tier as the baseline bank channel — an honest
   * "no differentiation found" signal rather than a hidden identical result.
   */
  hasMeaningfulAdvantage: boolean;
}

const NO_BASELINE_RESULT: PricingDifferentialResult = {
  baselineChannel: null,
  tinDeltaPercentagePoints: null,
  taeDeltaPercentagePoints: null,
  maxLtvDeltaPercentagePoints: 0,
  monthlyQuotaDelta: null,
  totalCostOfCreditDelta: null,
  hasMeaningfulAdvantage: false,
};

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function computePricingDifferential(
  broker: MortgagePathResult,
  bankBonified: MortgagePathResult,
  bankNonBonified: MortgagePathResult
): PricingDifferentialResult {
  const baseline = bankBonified.rate.dataAvailable ? bankBonified : bankNonBonified.rate.dataAvailable ? bankNonBonified : null;

  if (!baseline) {
    return NO_BASELINE_RESULT;
  }

  const tinDeltaPercentagePoints =
    broker.rate.tin !== null && baseline.rate.tin !== null ? round2(broker.rate.tin - baseline.rate.tin) : null;
  const taeDeltaPercentagePoints =
    broker.rate.tae !== null && baseline.rate.tae !== null ? round2(broker.rate.tae - baseline.rate.tae) : null;
  const maxLtvDeltaPercentagePoints = round2(broker.ltv.maxLtvPercentage - baseline.ltv.maxLtvPercentage);
  const monthlyQuotaDelta =
    broker.monthlyQuota !== null && baseline.monthlyQuota !== null ? broker.monthlyQuota - baseline.monthlyQuota : null;
  const totalCostOfCreditDelta =
    broker.costOfCredit && baseline.costOfCredit
      ? broker.costOfCredit.totalCostOfCredit - baseline.costOfCredit.totalCostOfCredit
      : null;

  const hasMeaningfulAdvantage =
    (tinDeltaPercentagePoints !== null && tinDeltaPercentagePoints < 0) ||
    (taeDeltaPercentagePoints !== null && taeDeltaPercentagePoints < 0) ||
    maxLtvDeltaPercentagePoints > 0;

  return {
    baselineChannel: baseline.channel as 'BANK_BONIFIED' | 'BANK_NON_BONIFIED',
    tinDeltaPercentagePoints,
    taeDeltaPercentagePoints,
    maxLtvDeltaPercentagePoints,
    monthlyQuotaDelta,
    totalCostOfCreditDelta,
    hasMeaningfulAdvantage,
  };
}
