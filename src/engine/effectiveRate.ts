/**
 * Computes a channel-specific effective annual rate (TAE) from each path's
 * own actual TIN-derived monthly quota, term and formalization costs,
 * instead of reusing a market-survey-reported TAE figure that was measured
 * under a different lender's own loan amount/term/fee assumptions.
 *
 * Root cause this fixes: previously RateReference.tae was pulled straight
 * from /data/marketRates.json quotes (independently published TAE figures
 * that don't share our engine's computed loanPrincipal/term/costs), so it
 * could stay flat or even be internally inconsistent with the resolved TIN
 * across channels. This module derives TAE the standard actuarial way —
 * the constant annual compound rate that equates the amount effectively
 * received to the present value of the payment stream — using this
 * engine's own numbers, so it necessarily differs whenever TIN, loan
 * amount, term or costs differ between channels.
 *
 * Simplification, documented rather than hidden: official Spanish/EU TAE
 * regulation includes only lender-charged fees (opening fee, compulsory
 * linked insurance), not third-party notary/registry costs. This engine
 * does not model lender fees, so it uses formalizationCosts.totalAmount
 * (notary + registry) as the upfront cost deducted from the amount
 * received — an "effective cost of credit" comparison metric across
 * channels, not a claim to reproduce a bank's official TAE disclosure.
 */

const RATE_TOLERANCE = 1e-10;
const MAX_ITERATIONS = 200;
const MAX_MONTHLY_RATE = 1; // 100% monthly — generous upper bound, never reached by real mortgages

function presentValueOfAnnuity(monthlyPayment: number, monthlyRate: number, numberOfPayments: number): number {
  if (monthlyRate === 0) {
    return monthlyPayment * numberOfPayments;
  }
  return (monthlyPayment * (1 - Math.pow(1 + monthlyRate, -numberOfPayments))) / monthlyRate;
}

/**
 * Solves for the monthly rate whose annuity present value equals
 * targetPresentValue, via bisection (the PV-vs-rate relationship for a
 * fixed positive payment is smooth and strictly monotonic decreasing).
 */
export function solveMonthlyRateForPresentValue(
  targetPresentValue: number,
  monthlyPayment: number,
  numberOfPayments: number
): number {
  if (numberOfPayments <= 0 || monthlyPayment <= 0 || targetPresentValue <= 0) {
    return 0;
  }

  let low = 0;
  let high = MAX_MONTHLY_RATE;

  for (let iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
    const mid = (low + high) / 2;
    const pv = presentValueOfAnnuity(monthlyPayment, mid, numberOfPayments);

    if (Math.abs(pv - targetPresentValue) < RATE_TOLERANCE) {
      return mid;
    }
    // Higher rate discounts payments more heavily, so PV decreases as rate increases.
    if (pv > targetPresentValue) {
      low = mid;
    } else {
      high = mid;
    }
  }

  return (low + high) / 2;
}

/**
 * Effective annual rate (TAE), as a percentage, for a specific channel's
 * own loan principal, monthly quota, term and upfront formalization costs.
 * Returns 0 for degenerate inputs (no payments, no principal) instead of
 * throwing — callers should not display a TAE at all when monthlyQuota is
 * itself unavailable.
 */
export function calculateEffectiveAnnualRate(
  loanPrincipal: number,
  monthlyQuota: number,
  numberOfPayments: number,
  upfrontFormalizationCosts: number
): number {
  const amountEffectivelyReceived = loanPrincipal - upfrontFormalizationCosts;
  if (amountEffectivelyReceived <= 0 || monthlyQuota <= 0 || numberOfPayments <= 0) {
    return 0;
  }

  const monthlyRate = solveMonthlyRateForPresentValue(amountEffectivelyReceived, monthlyQuota, numberOfPayments);
  return (Math.pow(1 + monthlyRate, 12) - 1) * 100;
}
