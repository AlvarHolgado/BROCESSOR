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
 *  - LOWEST_COST: the direct bank can finance the operation as requested, so
 *    the broker does not take on more debt than the client asked for — it
 *    only improves the price (the best real market quote), which is the
 *    cheapest way to reach the same loan.
 */

import type { MortgagePathResult } from './simulate';
import { DSTI_GREEN_THRESHOLD } from './scoring';

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
  /** broker.loanPrincipal - baseline.loanPrincipal. Positive means the broker finances more than the direct bank. */
  additionalLoanVsBank: number;
  /** broker.initialContributionRequired - baseline.initialContributionRequired. Negative means a smaller up-front payment with the broker. */
  initialContributionDeltaVsBank: number;
  /** Immediate DSTI of the broker offer; null when the broker TIN is unavailable and no quota exists. */
  brokerDstiRatio: number | null;
  /** True when brokerDstiRatio stays within the low-risk threshold; null when it cannot be computed. */
  brokerDstiWithinThreshold: boolean | null;
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
    additionalLoanVsBank: broker.loanPrincipal - baseline.loanPrincipal,
    initialContributionDeltaVsBank: broker.initialContributionRequired - baseline.initialContributionRequired,
    brokerDstiRatio,
    brokerDstiWithinThreshold: brokerDstiRatio === null ? null : brokerDstiRatio <= DSTI_GREEN_THRESHOLD,
    brokerFullyFinanceable: broker.isFullyFinanceable,
  };
}
