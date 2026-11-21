import { describe, expect, it } from 'vitest';
import { buildInitialContributionBreakdown } from './contributionBreakdown';
import type { FormalizationCostsResult } from './formalizationCosts';
import type { RegionalTaxResult } from './mortgageEngine';

function taxes(totalTaxAmount: number): RegionalTaxResult {
  return {
    ccaaCode: 'X',
    propertyType: 'SECOND_HAND',
    taxableBase: 0,
    itp: { applicable: true, ratePercentage: null, amount: totalTaxAmount, usedProgressiveBrackets: false },
    ajd: { applicable: false, ratePercentage: null, amount: 0, dataAvailable: true },
    totalTaxAmount,
  };
}

function formalization(notary: number, registry: number): FormalizationCostsResult {
  return {
    notaryFeePurchase: { variableComponent: notary, fixedComponentWithVat: 0, totalAmount: notary },
    registryFeePurchase: registry,
    notaryFeeMortgage: 0,
    registryFeeMortgage: 0,
    gestoriaCostToBuyer: 0,
    totalAmount: notary + registry,
  };
}

describe('buildInitialContributionBreakdown', () => {
  it('makes the displayed total the sum of the displayed whole-euro parts, even when the exact total rounds differently', () => {
    // Exact total = 192646.6 + 19801.25 + 205.4 + 201.4 = 212854.65 -> would round to 212855,
    // but the parts show 192647 + 19801 + 205 + 201 = 212854: the total must be 212854.
    const result = buildInitialContributionBreakdown(300000, 107353.4, taxes(19801.25), formalization(205.4, 201.4));
    expect(result.ownCapital).toBe(192647);
    expect(result.taxes).toBe(19801);
    expect(result.notary).toBe(205);
    expect(result.registry).toBe(201);
    expect(result.formalization).toBe(406);
    expect(result.total).toBe(192647 + 19801 + 406);
  });

  it('subtracts exactly the two rounded amounts printed on the "price - mortgage" line', () => {
    const result = buildInitialContributionBreakdown(300000, 107352.6, taxes(0), formalization(0, 0));
    expect(result.ownCapital).toBe(300000 - 107353);
  });
});
