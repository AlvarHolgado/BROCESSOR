/**
 * Composes the localized explanation of the broker strategy (max financing
 * vs. lowest cost) from the already-computed SimulatorOutput, so the
 * on-screen card (OfferCardParts.tsx) and the PDF (exportPdf.ts) always say
 * exactly the same thing. Numbers only come from the engine output — see
 * engine/brokerStrategy.ts — never from anything computed here.
 */

import type { SimulatorOutput } from '../engine/simulate';
import { DSTI_GREEN_THRESHOLD } from '../engine/scoring';
import type { Dictionary } from '../i18n/dictionaries/ca';
import type { Formatters } from '../i18n/formatters';

export interface BrokerStrategyText {
  title: string;
  /** Why this strategy applies to the client, and how the offer is structured. */
  paragraphs: string[];
  /** Requirements/caveats attached to the offer, rendered as a list. */
  conditions: string[];
}

export function buildBrokerStrategyText(output: SimulatorOutput, t: Dictionary, f: Formatters): BrokerStrategyText {
  const { brokerStrategy: strategy, broker, pricingDifferential: differential } = output;
  const s = t.screen5.strategy;
  const dstiLabel = strategy.brokerDstiRatio !== null ? `${f.percent1.format(strategy.brokerDstiRatio * 100)}%` : '—';
  const dstiThresholdLabel = `${f.percent1.format(DSTI_GREEN_THRESHOLD * 100)}%`;
  const ceilingLtvLabel = `${f.percent1.format(broker.ltv.effectiveLtvPercentage)}%`;

  if (strategy.mode === 'LOWEST_COST') {
    const quotaSaving = differential.monthlyQuotaDelta;
    const costSaving = differential.totalCostOfCreditDelta;
    const hasSaving = quotaSaving !== null && costSaving !== null && quotaSaving < 0 && costSaving < 0;

    return {
      title: s.lowestCostTitle,
      paragraphs: [
        s.lowestCostWhy(ceilingLtvLabel, dstiLabel),
        hasSaving
          ? s.lowestCostSaving(f.currency0.format(-quotaSaving), f.currency0.format(-costSaving))
          : s.lowestCostNoSaving,
      ],
      conditions: [s.feesNote],
    };
  }

  const reasons: string[] = [];
  if (strategy.bankLtvExceeded) {
    reasons.push(s.reasonLtv);
  }
  if (strategy.bankDstiExceeded) {
    reasons.push(s.reasonDsti(dstiThresholdLabel));
  }
  if (strategy.bankSavingsShortfall) {
    reasons.push(s.reasonSavings);
  }

  const conditions: string[] = [];
  if (strategy.brokerDstiRatio !== null) {
    conditions.push(
      strategy.brokerDstiWithinThreshold
        ? s.conditionDstiWithin(dstiLabel, dstiThresholdLabel)
        : s.conditionDstiAbove(dstiLabel, dstiThresholdLabel)
    );
  }
  if (!strategy.brokerFullyFinanceable) {
    conditions.push(s.conditionNotFullyFinanceable);
  }
  conditions.push(s.conditionApproval(ceilingLtvLabel));
  conditions.push(s.feesNote);

  return {
    title: s.maxFinancingTitle,
    paragraphs: [
      s.maxFinancingWhy(reasons.join('; ')),
      strategy.additionalLoanVsBank > 0
        ? s.structureWithExtra(ceilingLtvLabel, f.currency0.format(strategy.additionalLoanVsBank))
        : s.structureNoExtra(ceilingLtvLabel),
    ],
    conditions,
  };
}
