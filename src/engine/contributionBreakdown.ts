/**
 * Whole-euro breakdown of the initial contribution (own capital + taxes +
 * formalization costs), computed once per path so every place that shows
 * these figures — the offer card, the PDF, the broker-vs-bank deltas — reads
 * the same integers. Each part is rounded individually and the total is the
 * SUM of the rounded parts, never a separately rounded exact total: that is
 * what guarantees the displayed lines always add up to the displayed total
 * (a 1 EUR mismatch between e.g. 192.647 + 18.000 + 436 and a separately
 * rounded 211.083 is exactly the contradiction this prevents).
 *
 * The exact, unrounded figure stays available as
 * MortgagePathResult.initialContributionRequired for any pure calculation.
 */

import type { FormalizationCostsResult } from './formalizationCosts';
import type { RegionalTaxResult } from './mortgageEngine';

export interface InitialContributionBreakdown {
  /** Purchase price minus the loan actually taken, in whole euros. */
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
}

export function buildInitialContributionBreakdown(
  purchaseValue: number,
  loanPrincipal: number,
  taxBreakdown: RegionalTaxResult,
  formalizationCosts: FormalizationCostsResult
): InitialContributionBreakdown {
  // Built from the two rounded amounts the card prints on the "price − mortgage" line, so that line always subtracts exactly.
  const ownCapital = Math.round(purchaseValue) - Math.round(loanPrincipal);
  const taxes = Math.round(taxBreakdown.totalTaxAmount);
  const notary = Math.round(formalizationCosts.notaryFeePurchase.totalAmount);
  const registry = Math.round(formalizationCosts.registryFeePurchase);
  const formalization = notary + registry;

  return { ownCapital, taxes, notary, registry, formalization, total: ownCapital + taxes + formalization };
}
