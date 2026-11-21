/**
 * LTV (Loan-To-Value) resolution per financing channel.
 * Bank: the user's desired LTV is evaluated against the bank max and
 * capped (with a flag for the UI to explain) if it exceeds it.
 * Broker: LTV follows the broker strategy — the broker's maximum achievable
 * LTV when the operation is tight for a direct bank, otherwise the LTV the
 * client actually requested (see resolveBrokerLtv).
 */

import type { BrokerStrategyMode } from './brokerStrategy';

export interface LtvResolutionResult {
  requestedLtvPercentage: number;
  /** The LTV actually used for financing calculations. */
  effectiveLtvPercentage: number;
  /** True when the requested LTV exceeded the channel's max and was auto-capped. */
  wasCapped: boolean;
  maxLtvPercentage: number;
}

/** Evaluates a user-requested LTV against the bank's max, auto-capping it if not viable. */
export function resolveBankLtv(requestedLtvPercentage: number, maxLtvPercentage: number): LtvResolutionResult {
  const wasCapped = requestedLtvPercentage > maxLtvPercentage;

  return {
    requestedLtvPercentage,
    effectiveLtvPercentage: wasCapped ? maxLtvPercentage : requestedLtvPercentage,
    wasCapped,
    maxLtvPercentage,
  };
}

/**
 * Broker LTV depends on the strategy chosen for the client (see
 * brokerStrategy.ts): MAX_FINANCING always uses the channel's maximum
 * achievable LTV; LOWEST_COST only finances what the client asked for
 * (never above the channel max), since borrowing more would raise the cost.
 */
export function resolveBrokerLtv(
  maxLtvPercentage: number,
  mode: BrokerStrategyMode,
  requestedLtvPercentage: number
): LtvResolutionResult {
  if (mode === 'MAX_FINANCING') {
    return {
      requestedLtvPercentage: maxLtvPercentage,
      effectiveLtvPercentage: maxLtvPercentage,
      wasCapped: false,
      maxLtvPercentage,
    };
  }

  const wasCapped = requestedLtvPercentage > maxLtvPercentage;
  return {
    requestedLtvPercentage,
    effectiveLtvPercentage: wasCapped ? maxLtvPercentage : requestedLtvPercentage,
    wasCapped,
    maxLtvPercentage,
  };
}
