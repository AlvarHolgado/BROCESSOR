import { describe, expect, it } from 'vitest';
import { buildInitialContributionBreakdown, calculateRequiredLoanAmount } from './contributionBreakdown';
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

describe('calculateRequiredLoanAmount', () => {
  it('uses the savings to cover taxes and formalization FIRST, and only what is left as down payment', () => {
    // 300,000 home, 60,000 savings, 18,436 of taxes/costs -> down payment 41,564 -> loan 258,436 (not 240,000).
    expect(calculateRequiredLoanAmount(300000, 60000, 18436)).toBeCloseTo(258436, 6);
  });

  it('does not force a minimal LTV: more costs mean a smaller down payment and a bigger loan', () => {
    const cheap = calculateRequiredLoanAmount(300000, 60000, 5000);
    const dear = calculateRequiredLoanAmount(300000, 60000, 25000);
    expect(dear).toBeGreaterThan(cheap);
  });

  it('puts nothing toward the down payment when the savings do not even cover the costs', () => {
    expect(calculateRequiredLoanAmount(300000, 10000, 18436)).toBe(300000);
  });

  it('never returns a negative loan when the savings exceed price plus costs', () => {
    expect(calculateRequiredLoanAmount(100000, 500000, 8000)).toBe(0);
  });
});

describe('buildInitialContributionBreakdown', () => {
  it('makes the displayed total the sum of the displayed whole-euro parts, even when the exact total rounds differently', () => {
    // Exact total = 192646.6 + 19801.25 + 205.4 + 201.4 = 212854.65 -> would round to 212855,
    // but the parts show 192647 + 19801 + 205 + 201 = 212854: the total must be 212854.
    const result = buildInitialContributionBreakdown(300000, 107353.4, taxes(19801.25), formalization(205.4, 201.4), 250000);
    expect(result.ownCapital).toBe(192647);
    expect(result.taxes).toBe(19801);
    expect(result.notary).toBe(205);
    expect(result.registry).toBe(201);
    expect(result.formalization).toBe(406);
    expect(result.total).toBe(192647 + 19801 + 406);
  });

  it('subtracts exactly the two rounded amounts printed on the "price - mortgage" line', () => {
    const result = buildInitialContributionBreakdown(300000, 107352.6, taxes(0), formalization(0, 0), 0);
    expect(result.ownCapital).toBe(300000 - 107353);
  });

  it('splits the savings: costs first, then the down payment, with the remainder reported as surplus', () => {
    // Costs 18,436; down payment needed 41,564; savings 70,000 -> 18,436 + 41,564 covered, 10,000 left over.
    const result = buildInitialContributionBreakdown(300000, 258436, taxes(18000), formalization(220, 216), 70000);
    expect(result.savingsToCosts).toBe(18436);
    expect(result.savingsToDownPayment).toBe(41564);
    expect(result.savingsSurplus).toBe(10000);
    expect(result.savingsShortfall).toBe(0);
    expect(result.savingsToCosts + result.savingsToDownPayment + result.savingsSurplus).toBe(result.availableSavings);
  });

  it('reports a shortfall when the savings cannot cover the costs plus the down payment this offer needs', () => {
    // Needs 60,000 down payment + 18,436 costs = 78,436, but only 50,000 saved.
    const result = buildInitialContributionBreakdown(300000, 240000, taxes(18000), formalization(220, 216), 50000);
    expect(result.savingsToCosts).toBe(18436);
    expect(result.savingsToDownPayment).toBe(31564);
    expect(result.savingsSurplus).toBe(0);
    expect(result.savingsShortfall).toBe(60000 + 18436 - 50000);
  });

  it('applies savings to costs even when they cannot cover them, leaving nothing for the down payment', () => {
    const result = buildInitialContributionBreakdown(300000, 240000, taxes(18000), formalization(220, 216), 10000);
    expect(result.savingsToCosts).toBe(10000);
    expect(result.savingsToDownPayment).toBe(0);
    expect(result.savingsShortfall).toBe(60000 + 18436 - 10000);
  });
});
