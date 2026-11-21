/**
 * Decides which strategy the broker channel pursues for a given client, and
 * describes the resulting structure for the UI/PDF — purely derived from the
 * already-computed direct-bank paths and the broker path, never a new
 * numeric benchmark (per .clauderules Rule 1, the broker's rate and LTV
 * ceiling still come from marketTinResolver.ts, untouched by this module).
 *
 *  - MAX_FINANCING: the operation is tight for a direct bank (its offer had
 *    to be auto-adjusted, or the bank LTV plus savings do not cover the
 *    purchase price), so the broker is built at its own maximum LTV ceiling.
 *    Unlike a direct bank it is NOT bound by the 35% DSTI rule: it may take the
 *    client's effort into the 35%-40% band (moderate risk) to make the
 *    purchase possible, but never into the high-risk band above it — if the
 *    maximum LTV would push the effort past BROKER_MAX_DSTI_RATIO, the loan is
 *    reduced to the largest amount that keeps the effort at that limit.
 *  - LOWEST_COST: the direct bank can finance the operation as requested, so
 *    the broker does not take on more debt than the client asked for — it
 *    only improves the price (the best real market quote), which is the
 *    cheapest way to reach the same loan.
 */

import type { MortgagePathResult } from './simulate';
import { DSTI_COMPARISON_EPSILON, DSTI_GREEN_THRESHOLD, DSTI_YELLOW_THRESHOLD } from './scoring';

/**
 * Highest debt-service ratio the broker accepts when maximizing financing:
 * the project's own existing boundary between moderate and high risk
 * (scoring.ts DSTI_YELLOW_THRESHOLD, 40%) — so the broker can go beyond the
 * bank's 35% rule but never proposes an effort the simulator itself labels
 * "high risk". Deliberately reuses that constant rather than introducing a new
 * unsourced figure (.clauderules Rule 1); change it in one place if a
 * different tolerance is ever agreed.
 */
export const BROKER_MAX_DSTI_RATIO = DSTI_YELLOW_THRESHOLD;

/** How the broker's sustainability limit shaped its loan — set only on the broker path in MAX_FINANCING mode. */
export interface BrokerSustainability {
  /** The DSTI limit applied (BROKER_MAX_DSTI_RATIO). */
  dstiLimit: number;
  /** True when financing at the broker's maximum LTV would have exceeded the limit, so the loan was reduced to fit it. */
  wasLimited: boolean;
  /** The loan the broker would have taken at its maximum LTV before applying the limit. */
  loanBeforeLimit: number;
  /** The DSTI that loan would have produced. */
  dstiBeforeLimit: number;
}

export type BrokerStrategyMode = 'MAX_FINANCING' | 'LOWEST_COST';

export type BankBaselineChannel = 'BANK_BONIFIED' | 'BANK_NON_BONIFIED';

/** Stage 1 — evaluated before the broker path exists, from the direct-bank paths alone. */
export interface BrokerModeDecision {
  mode: BrokerStrategyMode;
  /** Bank channel the broker is compared against: bank-bonified when it has a resolvable rate, otherwise bank-non-bonified, otherwise bank-bonified's LTV/savings-only evaluation. */
  baselineChannel: BankBaselineChannel;
  /** The baseline bank offer had to be reduced (or capped) because the requested LTV exceeded the bank's maximum. */
  bankLtvExceeded: boolean;
  /** The baseline bank offer had to be reduced because the debt ratio (DSTI) exceeded the low-risk threshold. */
  bankDstiExceeded: boolean;
  /** The baseline bank LTV plus the client's savings do not cover the purchase price. */
  bankSavingsShortfall: boolean;
}

/** Stage 2 — the full strategy, once the broker path has been built, for display. */
export interface BrokerStrategyResult extends BrokerModeDecision {
  /** Whole-euro broker loan minus whole-euro baseline loan (exactly the amounts the cards show). Positive means the broker finances more than the direct bank. */
  additionalLoanVsBank: number;
  /** Broker minus baseline initial contribution, from the whole-euro breakdown the cards show. Negative means a smaller up-front payment with the broker. */
  initialContributionDeltaVsBank: number;
  /** Immediate DSTI of the broker offer; null when the broker TIN is unavailable and no quota exists. */
  brokerDstiRatio: number | null;
  /** True when brokerDstiRatio stays within the 35% low-risk threshold; null when it cannot be computed. */
  brokerDstiWithinThreshold: boolean | null;
  /** True when brokerDstiRatio is above the 35% threshold but within the broker's own limit — the "accepted higher effort" band. */
  brokerAcceptsHigherEffort: boolean;
  /** The broker's own DSTI limit (BROKER_MAX_DSTI_RATIO); only meaningful in MAX_FINANCING mode. */
  brokerDstiLimit: number;
  /** Set in MAX_FINANCING mode: whether the loan was reduced to respect the limit, and what it would have been otherwise. Null in LOWEST_COST mode or without a TIN. */
  sustainability: BrokerSustainability | null;
  /** False when the broker's LTV ceiling plus the client's savings still do not cover the purchase price. */
  brokerFullyFinanceable: boolean;
}

export function resolveBrokerModeDecision(bankBonified: MortgagePathResult, bankNonBonified: MortgagePathResult): BrokerModeDecision {
  const baseline = bankBonified.rate.dataAvailable ? bankBonified : bankNonBonified.rate.dataAvailable ? bankNonBonified : bankBonified;

  const bankLtvExceeded = baseline.bankViability?.ltvExceeded ?? baseline.ltv.wasCapped;
  const bankDstiExceeded = baseline.bankViability?.dstiExceeded ?? false;
  const bankSavingsShortfall = !baseline.isFullyFinanceable;
  const isTight = baseline.wasAutoAdjustedForViability || bankLtvExceeded || bankDstiExceeded || bankSavingsShortfall;

  return {
    mode: isTight ? 'MAX_FINANCING' : 'LOWEST_COST',
    baselineChannel: baseline.channel as BankBaselineChannel,
    bankLtvExceeded,
    bankDstiExceeded,
    bankSavingsShortfall,
  };
}

export function describeBrokerStrategy(
  decision: BrokerModeDecision,
  broker: MortgagePathResult,
  bankBonified: MortgagePathResult,
  bankNonBonified: MortgagePathResult
): BrokerStrategyResult {
  const baseline = decision.baselineChannel === 'BANK_BONIFIED' ? bankBonified : bankNonBonified;
  const brokerDstiRatio = broker.riskAssessment?.immediate.dstiRatio ?? null;

  return {
    ...decision,
    additionalLoanVsBank: Math.round(broker.loanPrincipal) - Math.round(baseline.loanPrincipal),
    initialContributionDeltaVsBank: broker.contributionBreakdown.total - baseline.contributionBreakdown.total,
    brokerDstiRatio,
    brokerDstiWithinThreshold: brokerDstiRatio === null ? null : brokerDstiRatio <= DSTI_GREEN_THRESHOLD + DSTI_COMPARISON_EPSILON,
    brokerAcceptsHigherEffort:
      brokerDstiRatio !== null &&
      brokerDstiRatio > DSTI_GREEN_THRESHOLD + DSTI_COMPARISON_EPSILON &&
      brokerDstiRatio <= BROKER_MAX_DSTI_RATIO + DSTI_COMPARISON_EPSILON,
    brokerDstiLimit: BROKER_MAX_DSTI_RATIO,
    sustainability: broker.brokerSustainability,
    brokerFullyFinanceable: broker.isFullyFinanceable,
  };
}
