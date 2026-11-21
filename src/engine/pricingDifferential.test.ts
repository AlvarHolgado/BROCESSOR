import { describe, expect, it } from 'vitest';
import type { MortgagePathResult } from './simulate';
import { computePricingDifferential } from './pricingDifferential';

function buildPath(overrides: Partial<MortgagePathResult> = {}): MortgagePathResult {
  return {
    channel: 'BANK_BONIFIED',
    rate: { dataAvailable: true, tin: 2.5, tae: 3.0, sourceEntities: ['Test'] },
    ltv: { requestedLtvPercentage: 80, effectiveLtvPercentage: 80, wasCapped: false, maxLtvPercentage: 80 },
    maxFinancingAmount: 160000,
    requiredLoanAmount: 160000,
    loanPrincipal: 160000,
    isFullyFinanceable: true,
    actualLtvPercentage: 80,
    initialContributionRequired: 40000,
    contributionBreakdown: {
      ownCapital: 40000,
      taxes: 0,
      notary: 0,
      registry: 0,
      formalization: 0,
      total: 40000,
      availableSavings: 40000,
      savingsToCosts: 0,
      savingsToDownPayment: 40000,
      savingsSurplus: 0,
      savingsShortfall: 0,
    },
    monthlyQuota: 700,
    effectiveAnnualRate: 3.1,
    riskAssessment: null,
    amortizationSchedule: [],
    costOfCredit: {
      loanPrincipal: 160000,
      totalInterestPaid: 90000,
      totalTaxAmount: 20000,
      totalFormalizationCosts: 3000,
      totalCostOfCredit: 273000,
    },
    bankViability: null,
    wasAutoAdjustedForViability: false,
    brokerSustainability: null,
    ...overrides,
  };
}

describe('computePricingDifferential', () => {
  it('reports a cheaper broker TIN and higher LTV as a meaningful advantage', () => {
    const bankBonified = buildPath({ channel: 'BANK_BONIFIED' });
    const bankNonBonified = buildPath({
      channel: 'BANK_NON_BONIFIED',
      rate: { dataAvailable: true, tin: 2.9, tae: 3.4, sourceEntities: ['Test'] },
    });
    const broker = buildPath({
      channel: 'BROKER',
      rate: { dataAvailable: true, tin: 2.2, tae: 2.7, sourceEntities: ['Test'] },
      ltv: { requestedLtvPercentage: 90, effectiveLtvPercentage: 90, wasCapped: false, maxLtvPercentage: 90 },
      monthlyQuota: 650,
      costOfCredit: { ...bankBonified.costOfCredit!, totalCostOfCredit: 260000 },
    });

    const result = computePricingDifferential(broker, bankBonified, bankNonBonified);

    expect(result.baselineChannel).toBe('BANK_BONIFIED');
    expect(result.tinDeltaPercentagePoints).toBeCloseTo(-0.3);
    expect(result.taeDeltaPercentagePoints).toBeCloseTo(-0.3);
    expect(result.maxLtvDeltaPercentagePoints).toBe(10);
    expect(result.monthlyQuotaDelta).toBe(-50);
    expect(result.totalCostOfCreditDelta).toBe(-13000);
    expect(result.hasMeaningfulAdvantage).toBe(true);
  });

  it('falls back to bank-non-bonified as the baseline when bank-bonified has no market data', () => {
    const bankBonified = buildPath({ channel: 'BANK_BONIFIED', rate: { dataAvailable: false, tin: null, tae: null, sourceEntities: [] } });
    const bankNonBonified = buildPath({ channel: 'BANK_NON_BONIFIED', rate: { dataAvailable: true, tin: 2.1, tae: null, sourceEntities: ['Test'] } });
    const broker = buildPath({ channel: 'BROKER', rate: { dataAvailable: true, tin: 2.1, tae: null, sourceEntities: ['Test'] } });

    const result = computePricingDifferential(broker, bankBonified, bankNonBonified);

    expect(result.baselineChannel).toBe('BANK_NON_BONIFIED');
    expect(result.tinDeltaPercentagePoints).toBe(0);
  });

  it('honestly reports no meaningful advantage when broker and baseline share the same TIN and LTV tier', () => {
    const bankBonified = buildPath({ channel: 'BANK_BONIFIED', rate: { dataAvailable: false, tin: null, tae: null, sourceEntities: [] } });
    const bankNonBonified = buildPath({
      channel: 'BANK_NON_BONIFIED',
      rate: { dataAvailable: true, tin: 2.1, tae: null, sourceEntities: ['Test'] },
      ltv: { requestedLtvPercentage: 80, effectiveLtvPercentage: 80, wasCapped: false, maxLtvPercentage: 80 },
    });
    const broker = buildPath({
      channel: 'BROKER',
      rate: { dataAvailable: true, tin: 2.1, tae: null, sourceEntities: ['Test'] },
      ltv: { requestedLtvPercentage: 80, effectiveLtvPercentage: 80, wasCapped: false, maxLtvPercentage: 80 },
    });

    const result = computePricingDifferential(broker, bankBonified, bankNonBonified);

    expect(result.tinDeltaPercentagePoints).toBe(0);
    expect(result.maxLtvDeltaPercentagePoints).toBe(0);
    expect(result.hasMeaningfulAdvantage).toBe(false);
  });

  it('withholds the quota and total-cost deltas when the broker finances a different amount than the bank, reporting the loan delta instead', () => {
    const bankBonified = buildPath({ channel: 'BANK_BONIFIED', loanPrincipal: 107353.4, monthlyQuota: 419.6 });
    const broker = buildPath({ channel: 'BROKER', loanPrincipal: 270000, monthlyQuota: 1038.8 });

    const result = computePricingDifferential(broker, bankBonified, bankBonified);

    expect(result.sameLoanAmount).toBe(false);
    expect(result.loanAmountDelta).toBe(270000 - 107353);
    expect(result.monthlyQuotaDelta).toBeNull();
    expect(result.totalCostOfCreditDelta).toBeNull();
  });

  it('computes the quota and cost deltas from the same whole-euro figures the cards display', () => {
    const bankBonified = buildPath({ channel: 'BANK_BONIFIED', monthlyQuota: 939.4, costOfCredit: { ...buildPath().costOfCredit!, totalCostOfCredit: 356460.4 } });
    const broker = buildPath({ channel: 'BROKER', monthlyQuota: 924.6, costOfCredit: { ...buildPath().costOfCredit!, totalCostOfCredit: 350903.6 } });

    const result = computePricingDifferential(broker, bankBonified, bankBonified);

    // Cards show 939 € / 925 € and 356.460 € / 350.904 €: the deltas must be exactly their differences.
    expect(result.monthlyQuotaDelta).toBe(925 - 939);
    expect(result.totalCostOfCreditDelta).toBe(350904 - 356460);
  });

  it('returns a null baseline when neither bank channel has market data', () => {
    const noData = buildPath({ rate: { dataAvailable: false, tin: null, tae: null, sourceEntities: [] } });
    const result = computePricingDifferential(noData, noData, noData);

    expect(result.baselineChannel).toBeNull();
    expect(result.tinDeltaPercentagePoints).toBeNull();
    expect(result.hasMeaningfulAdvantage).toBe(false);
  });
});
