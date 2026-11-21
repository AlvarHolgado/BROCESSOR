/**
 * Savings allocation and whole-euro breakdown of the initial contribution
 * (own capital + taxes + formalization costs).
 *
 * SAVINGS ALLOCATION RULE (calculateRequiredLoanAmount): the client's savings
 * are NOT all poured into the down payment to push the LTV as low as
 * possible. They first cover the costs that must be paid in cash regardless
 * of the loan — taxes (ITP/AJD) and notary/registry formalization — and only
 * what is left after those costs becomes the down payment. The loan then
 * covers the rest of the price, so the resulting LTV reflects what the client
 * can really put in, never an artificially low one.
 *
 * DISPLAY CONSISTENCY (buildInitialContributionBreakdown): this module is the
 * single source of the euro figures every place that shows them reads — the
 * offer card, the PDF, the broker-vs-bank deltas. Each part is rounded to whole
 * euros individually and the total is the SUM of the rounded parts, never a
 * separately rounded exact total, so the displayed lines always add up to the
 * displayed total. The exact, unrounded figure stays available as
 * MortgagePathResult.initialContributionRequired for any pure calculation.
 */

import type { FormalizationCostsResult } from './formalizationCosts';
import type { RegionalTaxResult } from './mortgageEngine';

/**
 * Loan the purchase needs once the savings have been allocated: savings first
 * cover `taxesAndExpenses`; whatever remains is the down payment; the loan is
 * the rest of the price. When the savings do not even cover the costs, the
 * down payment is 0 and the whole price would have to be borrowed.
 */
export function calculateRequiredLoanAmount(purchaseValue: number, availableSavings: number, taxesAndExpenses: number): number {
  const downPayment = Math.max(availableSavings - taxesAndExpenses, 0);
  return Math.max(purchaseValue - downPayment, 0);
}

export interface InitialContributionBreakdown {
  /** Purchase price minus the loan actually taken (the down payment this offer needs), in whole euros. */
  ownCapital: number;
  /** ITP/AJD, in whole euros. 0 when the AJD rate is unavailable — callers must disclose that case separately, as before. */
  taxes: number;
  /** Notary fee for the purchase deed, in whole euros. */
  notary: number;
  /** Registry fee for the purchase deed, in whole euros. */
  registry: number;
  /** notary + registry (the mortgage-deed costs are always 0 to the buyer). */
  formalization: number;
  /** ownCapital + taxes + formalization. */
  total: number;

  /** The client's total savings, in whole euros. */
  availableSavings: number;
  /** Savings applied first to taxes + formalization: min(savings, taxes + formalization). */
  savingsToCosts: number;
  /** Savings applied next to the down payment: min(savings left after costs, ownCapital). */
  savingsToDownPayment: number;
  /** Savings left over once this offer's costs and down payment are covered. 0 when they fall short. */
  savingsSurplus: number;
  /** Cash still missing to cover this offer's costs and down payment with the savings. 0 when they suffice. */
  savingsShortfall: number;
}

export function buildInitialContributionBreakdown(
  purchaseValue: number,
  loanPrincipal: number,
  taxBreakdown: RegionalTaxResult,
  formalizationCosts: FormalizationCostsResult,
  availableSavings: number
): InitialContributionBreakdown {
  // Built from the two rounded amounts the card prints on the "price − mortgage" line, so that line always subtracts exactly.
  const ownCapital = Math.round(purchaseValue) - Math.round(loanPrincipal);
  const taxes = Math.round(taxBreakdown.totalTaxAmount);
  const notary = Math.round(formalizationCosts.notaryFeePurchase.totalAmount);
  const registry = Math.round(formalizationCosts.registryFeePurchase);
  const formalization = notary + registry;
  const total = ownCapital + taxes + formalization;

  const savings = Math.round(availableSavings);
  const savingsToCosts = Math.min(savings, taxes + formalization);
  const savingsToDownPayment = Math.min(savings - savingsToCosts, ownCapital);
  const covered = savingsToCosts + savingsToDownPayment;

  return {
    ownCapital,
    taxes,
    notary,
    registry,
    formalization,
    total,
    availableSavings: savings,
    savingsToCosts,
    savingsToDownPayment,
    savingsSurplus: savings - covered,
    savingsShortfall: Math.max(total - covered, 0),
  };
}
