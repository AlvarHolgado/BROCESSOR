/**
 * LTV (Loan-To-Value) resolution per financing channel.
 * Bank: the user's desired LTV is evaluated against the bank max and
 * capped (with a flag for the UI to explain) if it exceeds it.
 * Broker: LTV is always auto-set to the broker's maximum achievable LTV —
 * that's the channel's core value proposition, not a user input.
 */

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

/** Broker LTV is always the channel's maximum achievable — never a user input. */
export function resolveBrokerLtv(maxLtvPercentage: number): LtvResolutionResult {
  return {
    requestedLtvPercentage: maxLtvPercentage,
    effectiveLtvPercentage: maxLtvPercentage,
    wasCapped: false,
    maxLtvPercentage,
  };
}
