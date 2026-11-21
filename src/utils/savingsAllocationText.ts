/**
 * Labelled lines describing how the client's savings are split for ONE
 * offer — costs first, then the down payment, with the remainder or shortfall
 * and the resulting loan/LTV. Built once from the engine's whole-euro
 * breakdown (engine/contributionBreakdown.ts) so the on-screen card and the
 * PDF always print the same figures, in the active language.
 */

import type { MortgagePathResult } from '../engine/simulate';
import type { Dictionary } from '../i18n/dictionaries/ca';
import type { Formatters } from '../i18n/formatters';

export interface SavingsAllocationLine {
  label: string;
  value: string;
  /** 'positive' for left-over savings, 'warning' for a shortfall — lets the UI colour them without re-deriving the case. */
  tone?: 'positive' | 'warning';
}

export function buildSavingsAllocationLines(path: MortgagePathResult, t: Dictionary, f: Formatters): SavingsAllocationLine[] {
  const s = t.savingsAllocation;
  const b = path.contributionBreakdown;

  const lines: SavingsAllocationLine[] = [
    { label: s.availableLabel, value: f.currency0.format(b.availableSavings) },
    { label: s.costsLabel, value: f.currency0.format(b.savingsToCosts) },
    { label: s.downPaymentLabel, value: f.currency0.format(b.savingsToDownPayment) },
    { label: s.loanLabel, value: `${f.currency0.format(path.loanPrincipal)} (${f.percent2.format(path.actualLtvPercentage)}%)` },
  ];

  if (b.savingsSurplus > 0) {
    lines.push({ label: s.surplusLabel, value: f.currency0.format(b.savingsSurplus), tone: 'positive' });
  }
  if (b.savingsShortfall > 0) {
    lines.push({ label: s.shortfallLabel, value: f.currency0.format(b.savingsShortfall), tone: 'warning' });
  }

  return lines;
}
