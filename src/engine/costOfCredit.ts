/**
 * Total cost of credit calculation, derived from an already-generated
 * amortization schedule, the tax burden computed by mortgageEngine.ts, and
 * the formalization costs computed by formalizationCosts.ts.
 * Kept as its own pure function per .clauderules Rule 2, which explicitly
 * calls out "Total Cost of Credit" as a deterministic, unit-tested calculation.
 */

import type { AmortizationRow } from '../types/simulator';

export interface CostOfCreditSummary {
  loanPrincipal: number;
  /** Sum of interestPaid across the full amortization schedule. */
  totalInterestPaid: number;
  totalTaxAmount: number;
  /** Notary + registry fees for the purchase deed (see formalizationCosts.ts). */
  totalFormalizationCosts: number;
  /** loanPrincipal + totalInterestPaid + totalTaxAmount + totalFormalizationCosts. */
  totalCostOfCredit: number;
}

export function calculateCostOfCredit(
  loanPrincipal: number,
  schedule: AmortizationRow[],
  totalTaxAmount: number,
  totalFormalizationCosts: number
): CostOfCreditSummary {
  const totalInterestPaid = schedule.reduce((sum, row) => sum + row.interestPaid, 0);

  return {
    loanPrincipal,
    totalInterestPaid,
    totalTaxAmount,
    totalFormalizationCosts,
    totalCostOfCredit: loanPrincipal + totalInterestPaid + totalTaxAmount + totalFormalizationCosts,
  };
}
