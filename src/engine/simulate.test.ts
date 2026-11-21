import { describe, expect, it } from 'vitest';
import type { CcaaTaxRate } from '../types/ccaaTax';
import type { SimulatorInput } from '../types/simulator';
import type { MarketRatesData } from '../types/marketRates';
import type { FormalizationFeesData } from '../types/formalizationFees';
import { computeSimulatorOutput, type SimulatorReferenceData } from './simulate';

function buildInput(overrides: Partial<SimulatorInput> = {}): SimulatorInput {
  return {
    numberOfHolders: 1,
    holderNames: ['Test User'],
    holderAges: [30],
    employmentTypes: ['INDEFINITE'],
    employmentOtherDetails: [''],
    monthlyNetIncomes: [2500],
    pendingDebts: 100,
    pendingDebtsRemainingMonths: 24,
    availableSavings: 40000,
    propertyType: 'SECOND_HAND',
    propertyUsage: 'HABITUAL',
    ccaa: 'MAD',
    appraisalValue: 200000,
    purchaseValue: 200000,
    mortgageType: 'FIXED',
    durationYears: 30,
    requestedLtvPercentage: 80,
    ...overrides,
  };
}

const madFixture: CcaaTaxRate = {
  code: 'MAD',
  name: 'Madrid',
  itpPercentage: 6,
  itpBrackets: null,
  ajdPercentage: 0.75,
  generalNote: null,
  cautionNote: null,
  reducedRates: [],
  sources: [],
};

const marketRatesFixture: MarketRatesData = {
  officialAnchors: {
    euribor12MonthAverage2025: { value: 2.222, source: 'test' },
    euribor12MonthDecember2025: { value: 2.267, source: 'test' },
    ineAverageNewMortgageRateByMonth2025: { source: 'test' },
    bdeAverageTaeNewCreditDecember2025: { value: 2.6442, source: 'test' },
    maxLtvHabitualHousingBank: { value: 80, source: 'test' },
  },
  marketQuotes: [
    { mortgageType: 'FIXED', entity: 'Bank A', product: null, tin: 2.3, tae: 3.25, bonified: true, notes: null, source: 'test' },
    { mortgageType: 'FIXED', entity: 'Bank B', product: null, tin: 2.55, tae: 3.27, bonified: true, notes: null, source: 'test' },
    { mortgageType: 'FIXED', entity: 'Bank C', product: null, tin: 2.65, tae: 3.01, bonified: false, notes: null, source: 'test' },
    { mortgageType: 'FIXED', entity: 'Bank D', product: null, tin: 2.75, tae: 3.58, bonified: false, notes: null, source: 'test' },
    { mortgageType: 'VARIABLE', entity: 'Bank D', product: null, tin: null, tae: 3.48, bonified: false, notes: null, source: 'test' },
    {
      mortgageType: 'MIXED',
      entity: 'Bank A',
      product: null,
      tin: 2.1,
      tae: null,
      bonified: false,
      notes: null,
      fixedPeriodYears: 10,
      postFixedDifferentialOverEuribor: 0.6,
      source: 'test',
    },
  ],
  ltvConventions: {
    bankMaxLtvPercentage: { value: 80, source: 'test' },
    brokerMaxLtvPercentage: { value: 90, source: 'test' },
  },
};

const formalizationFeesFixture: FormalizationFeesData = {
  notaryFeeSchedule: {
    brackets: [
      { upTo: 6010.12, ratePerMille: 4.5 },
      { upTo: 30050.61, ratePerMille: 1.5 },
      { upTo: 60101.21, ratePerMille: 1.0 },
      { upTo: 150253.03, ratePerMille: 0.5 },
      { upTo: 601012.1, ratePerMille: 0.3 },
      { upTo: null, ratePerMille: 0.2 },
    ],
    fixedComponentBeforeVat: 30.05,
    vatPercentage: 21,
    source: 'test',
  },
  registryFeeSchedule: {
    brackets: [
      { upTo: 6010.12, flatFee: 24.040484 },
      { upTo: 30050.61, ratePerMille: 1.75 },
      { upTo: 60101.21, ratePerMille: 1.25 },
      { upTo: 150253.03, ratePerMille: 0.75 },
      { upTo: 601012.1, ratePerMille: 0.3 },
      { upTo: null, ratePerMille: 0.2 },
    ],
    source: 'test',
  },
};

const referenceData: SimulatorReferenceData = {
  ccaaTaxRates: [madFixture],
  marketRates: marketRatesFixture,
  formalizationFees: formalizationFeesFixture,
};

describe('computeSimulatorOutput', () => {
  it('sums monthlyNetIncomes across every holder into household income for DSTI (more holders improve DSTI)', () => {
    const singleHolder = computeSimulatorOutput(
      buildInput({ numberOfHolders: 1, monthlyNetIncomes: [2000] }),
      referenceData
    );
    const twoHolders = computeSimulatorOutput(
      buildInput({ numberOfHolders: 2, monthlyNetIncomes: [2000, 2000] }),
      referenceData
    );
    expect(singleHolder.bankBonified.riskAssessment).not.toBeNull();
    expect(twoHolders.bankBonified.riskAssessment?.immediate.dstiRatio).toBeLessThan(
      singleHolder.bankBonified.riskAssessment?.immediate.dstiRatio ?? 0
    );
  });

  it('never exposes an internal net income figure anywhere in SimulatorOutput', () => {
    const output = computeSimulatorOutput(buildInput(), referenceData);
    expect(output).not.toHaveProperty('netIncome');
    expect(Object.keys(output.bankBonified)).not.toContain('netIncome');
  });

  it('averages the bonified market quotes for the bank-bonified path', () => {
    const output = computeSimulatorOutput(buildInput(), referenceData);
    expect(output.bankBonified.rate.dataAvailable).toBe(true);
    expect(output.bankBonified.rate.tin).toBeCloseTo((2.3 + 2.55) / 2, 6);
  });

  it('averages the non-bonified market quotes for the bank-non-bonified path', () => {
    const output = computeSimulatorOutput(buildInput(), referenceData);
    expect(output.bankNonBonified.rate.tin).toBeCloseTo((2.65 + 2.75) / 2, 6);
  });

  it('gives the broker path a strictly better TIN than bank-bonified, at the broker max LTV when the bank is tight', () => {
    const output = computeSimulatorOutput(buildInput({ availableSavings: 10000 }), referenceData);
    expect(output.brokerStrategy.mode).toBe('MAX_FINANCING');
    expect(output.broker.rate.tin).toBeCloseTo(2.3, 6);
    expect(output.broker.rate.tin as number).toBeLessThan(output.bankBonified.rate.tin as number);
    expect(output.broker.ltv.effectiveLtvPercentage).toBe(90);
    expect(output.broker.ltv.wasCapped).toBe(false);
  });

  it('computes actualLtvPercentage from the real loan taken, not the channel ceiling, per the regulatory LTV formula', () => {
    // purchaseValue 200,000, availableSavings 40,000 -> requiredLoanAmount 160,000, which is
    // below the broker's 90% ceiling (180,000). The bank can finance this as requested, so the broker
    // runs LOWEST_COST: its LTV ceiling for this offer is the requested 80%, and the loan taken is
    // exactly 160,000 (80%) — the same loan as the bank, only at a cheaper rate.
    const output = computeSimulatorOutput(buildInput(), referenceData);
    expect(output.brokerStrategy.mode).toBe('LOWEST_COST');
    expect(output.broker.ltv.effectiveLtvPercentage).toBe(80);
    expect(output.broker.loanPrincipal).toBeCloseTo(160000, 6);
    expect(output.broker.actualLtvPercentage).toBeCloseTo(80, 6);
    expect(output.broker.actualLtvPercentage).toBeLessThanOrEqual(output.broker.ltv.effectiveLtvPercentage);
  });

  it('rounds actualLtvPercentage to exactly 2 decimal places', () => {
    const output = computeSimulatorOutput(buildInput({ purchaseValue: 300000, appraisalValue: 300000, availableSavings: 100000 }), referenceData);
    // requiredLoanAmount = 200,000; reference value = 300,000 -> 66.666...% -> 66.67%
    expect(output.broker.actualLtvPercentage).toBe(66.67);
  });

  it('caps a bank LTV request above the bank max and flags it', () => {
    const output = computeSimulatorOutput(buildInput({ requestedLtvPercentage: 95 }), referenceData);
    expect(output.bankBonified.ltv.wasCapped).toBe(true);
    expect(output.bankBonified.ltv.effectiveLtvPercentage).toBe(80);
  });

  it('flags variable-rate paths as unavailable when no market TIN exists, without fabricating a quota', () => {
    const output = computeSimulatorOutput(buildInput({ mortgageType: 'VARIABLE' }), referenceData);
    expect(output.bankNonBonified.rate.dataAvailable).toBe(false);
    expect(output.bankNonBonified.monthlyQuota).toBeNull();
    expect(output.bankNonBonified.amortizationSchedule).toEqual([]);
  });

  it('still computes the initial contribution required even when the TIN is unavailable', () => {
    const output = computeSimulatorOutput(buildInput({ mortgageType: 'VARIABLE' }), referenceData);
    expect(output.bankNonBonified.monthlyQuota).toBeNull();
    expect(Number.isFinite(output.bankNonBonified.initialContributionRequired)).toBe(true);
  });

  it('carries the mixed-rate fixed period schedule through to the resolved rate', () => {
    const output = computeSimulatorOutput(buildInput({ mortgageType: 'MIXED' }), referenceData);
    expect(output.bankNonBonified.rate.fixedPeriodYears).toBe(10);
    expect(output.bankNonBonified.rate.postFixedDifferentialOverEuribor).toBe(0.6);
    expect(output.bankNonBonified.monthlyQuota).toBeGreaterThan(0);
  });

  it('computes initial contribution as purchase price plus taxes/expenses minus the loan principal', () => {
    const output = computeSimulatorOutput(buildInput(), referenceData);
    const taxesAndExpenses = output.taxBreakdown.totalTaxAmount + output.formalizationCosts.totalAmount;
    expect(output.bankBonified.initialContributionRequired).toBeCloseTo(
      200000 + taxesAndExpenses - output.bankBonified.loanPrincipal,
      6
    );
  });

  it('gives the broker a lower or equal initial contribution than bank paths, since it can finance more', () => {
    const output = computeSimulatorOutput(buildInput({ availableSavings: 10000 }), referenceData);
    expect(output.broker.initialContributionRequired).toBeLessThanOrEqual(output.bankBonified.initialContributionRequired);
  });

  it('includes formalization costs in the total cost of credit', () => {
    const output = computeSimulatorOutput(buildInput(), referenceData);
    expect(output.formalizationCosts.totalAmount).toBeGreaterThan(0);
    expect(output.bankBonified.costOfCredit?.totalFormalizationCosts).toBe(output.formalizationCosts.totalAmount);
  });

  it('throws when the CCAA has no matching tax data, instead of silently skipping taxes', () => {
    expect(() => computeSimulatorOutput(buildInput({ ccaa: 'ZZZ' }), referenceData)).toThrow();
  });

  it('computes a distinct effective annual rate (TAE) per channel instead of a flat market-quoted figure', () => {
    const output = computeSimulatorOutput(buildInput(), referenceData);
    const rates = [output.bankBonified.effectiveAnnualRate, output.bankNonBonified.effectiveAnnualRate, output.broker.effectiveAnnualRate];
    expect(rates.every((rate) => rate !== null && rate > 0)).toBe(true);
    expect(new Set(rates).size).toBe(3);
  });

  it('orders the effective annual rate the same way as TIN across channels', () => {
    const output = computeSimulatorOutput(buildInput(), referenceData);
    expect(output.broker.effectiveAnnualRate as number).toBeLessThan(output.bankBonified.effectiveAnnualRate as number);
    expect(output.bankBonified.effectiveAnnualRate as number).toBeLessThan(output.bankNonBonified.effectiveAnnualRate as number);
  });

  it('leaves effectiveAnnualRate null when the TIN itself is unavailable', () => {
    const output = computeSimulatorOutput(buildInput({ mortgageType: 'VARIABLE' }), referenceData);
    expect(output.bankNonBonified.effectiveAnnualRate).toBeNull();
  });

  it('reports a temporal DSTI profile that improves once pending debts end before the mortgage does', () => {
    const output = computeSimulatorOutput(buildInput({ pendingDebts: 400, pendingDebtsRemainingMonths: 24 }), referenceData);
    const risk = output.bankBonified.riskAssessment;
    expect(risk).not.toBeNull();
    expect(risk?.immediate.dstiRatio).toBeGreaterThan(risk?.longTerm.dstiRatio ?? 0);
    expect(risk?.reachesLongTermProfile).toBe(true);
  });

  it('gives identical immediate/long-term DSTI when there are no pending debts', () => {
    const output = computeSimulatorOutput(buildInput({ pendingDebts: 0, pendingDebtsRemainingMonths: 0 }), referenceData);
    const risk = output.bankBonified.riskAssessment;
    expect(risk?.immediate.dstiRatio).toBeCloseTo(risk?.longTerm.dstiRatio ?? -1, 10);
    expect(risk?.reachesLongTermProfile).toBe(true);
  });

  it('flags reachesLongTermProfile false when pending debts outlast the mortgage term', () => {
    const output = computeSimulatorOutput(
      buildInput({ pendingDebts: 400, pendingDebtsRemainingMonths: 400, durationYears: 30 }),
      referenceData
    );
    expect(output.bankBonified.riskAssessment?.reachesLongTermProfile).toBe(false);
  });

  it('marks a bank path non-viable and computes a max viable offer when the requested LTV was capped', () => {
    const output = computeSimulatorOutput(buildInput({ requestedLtvPercentage: 95 }), referenceData);
    expect(output.bankBonified.bankViability).not.toBeNull();
    expect(output.bankBonified.bankViability?.isViable).toBe(false);
    expect(output.bankBonified.bankViability?.ltvExceeded).toBe(true);
    expect(output.bankBonified.bankViability?.maxViableLoanAmount).toBeGreaterThan(0);
  });

  it('marks a bank path viable when neither LTV nor DSTI exceed the bank thresholds', () => {
    const output = computeSimulatorOutput(
      buildInput({ monthlyNetIncomes: [6000], pendingDebts: 0, pendingDebtsRemainingMonths: 0 }),
      referenceData
    );
    expect(output.bankBonified.bankViability?.isViable).toBe(true);
  });

  it('never computes bankViability for the broker channel', () => {
    const output = computeSimulatorOutput(buildInput(), referenceData);
    expect(output.broker.bankViability).toBeNull();
  });

  it('leaves bankViability null when the bank TIN itself is unavailable', () => {
    const output = computeSimulatorOutput(buildInput({ mortgageType: 'VARIABLE' }), referenceData);
    expect(output.bankNonBonified.bankViability).toBeNull();
  });

  it('automatically reduces a bank path to the max viable loan amount when the requested amount exceeds the DSTI threshold, instead of rejecting it outright', () => {
    // Low income makes the DSTI-safe budget far smaller than the 160,000 the LTV/savings math would otherwise grant.
    const output = computeSimulatorOutput(
      buildInput({ monthlyNetIncomes: [1500], pendingDebts: 100, pendingDebtsRemainingMonths: 0 }),
      referenceData
    );
    const viability = output.bankBonified.bankViability;
    expect(viability?.isViable).toBe(false);
    expect(viability?.dstiExceeded).toBe(true);
    expect(viability?.justificationReason).toBe('DSTI_EXCEEDED');
    expect(output.bankBonified.wasAutoAdjustedForViability).toBe(true);
    expect(output.bankBonified.loanPrincipal).toBeLessThan(160000);
    expect(output.bankBonified.loanPrincipal).toBeCloseTo(viability?.maxViableLoanAmount ?? -1, 2);
    // The adjusted offer must be genuinely viable, not just flagged as such: DSTI recomputed at the new amount stays within the GREEN threshold.
    expect(output.bankBonified.riskAssessment?.immediate.dstiRatio).toBeLessThanOrEqual(0.35 + 1e-9);
  });

  it('does not apply the bank viability adjustment to the broker path', () => {
    const output = computeSimulatorOutput(
      buildInput({ monthlyNetIncomes: [1500], pendingDebts: 100, pendingDebtsRemainingMonths: 0 }),
      referenceData
    );
    expect(output.broker.wasAutoAdjustedForViability).toBe(false);
    expect(output.broker.bankViability).toBeNull();
  });

  it('lets the broker exceed the bank 35% DSTI rule to make a tight operation possible, within its own moderate-risk limit', () => {
    // 200,000 home, 20,000 savings -> 180,000 needed: above the bank's 80% (160,000), exactly the broker's 90%.
    // At the broker's rate that loan costs ~36% of a 1,900 EUR income: over the bank's 35% but under the broker's 40% limit.
    const output = computeSimulatorOutput(
      buildInput({ availableSavings: 20000, monthlyNetIncomes: [1900], pendingDebts: 0, pendingDebtsRemainingMonths: 0 }),
      referenceData
    );
    expect(output.brokerStrategy.mode).toBe('MAX_FINANCING');
    expect(output.broker.loanPrincipal).toBeCloseTo(180000, 6);
    expect(output.broker.ltv.effectiveLtvPercentage).toBe(90);
    const dsti = output.broker.riskAssessment?.immediate.dstiRatio as number;
    expect(dsti).toBeGreaterThan(0.35);
    expect(dsti).toBeLessThanOrEqual(0.4);
    expect(output.brokerStrategy.brokerAcceptsHigherEffort).toBe(true);
    expect(output.brokerStrategy.sustainability?.wasLimited).toBe(false);
    expect(output.broker.isFullyFinanceable).toBe(true);
    expect(output.broker.loanPrincipal).toBeGreaterThan(output.bankBonified.loanPrincipal);
  });

  it('never lets the broker go beyond its sustainability limit: the loan is reduced to keep the DSTI at 40%, still above what the bank grants', () => {
    const output = computeSimulatorOutput(
      buildInput({ monthlyNetIncomes: [1500], pendingDebts: 100, pendingDebtsRemainingMonths: 0 }),
      referenceData
    );
    const sustainability = output.brokerStrategy.sustainability;
    expect(output.brokerStrategy.mode).toBe('MAX_FINANCING');
    expect(sustainability?.wasLimited).toBe(true);
    expect(sustainability?.dstiBeforeLimit).toBeGreaterThan(0.4);
    expect(output.broker.loanPrincipal).toBeLessThan(sustainability?.loanBeforeLimit ?? 0);
    expect(output.broker.riskAssessment?.immediate.dstiRatio).toBeCloseTo(0.4, 6);
    expect(output.brokerStrategy.brokerAcceptsHigherEffort).toBe(true);
    // More financing than the bank (35% cap, higher TIN), but a realistic, market-consistent loan: never the unsustainable 90%.
    expect(output.broker.loanPrincipal).toBeGreaterThan(output.bankBonified.loanPrincipal);
    expect(output.broker.loanPrincipal).toBeLessThan(output.broker.maxFinancingAmount);
    expect(output.broker.actualLtvPercentage).toBeLessThan(90);
  });

  it('reduces the broker loan to 0 rather than proposing an unsustainable operation when existing debts alone exceed its limit', () => {
    const output = computeSimulatorOutput(
      buildInput({ monthlyNetIncomes: [1000], pendingDebts: 450, pendingDebtsRemainingMonths: 60 }),
      referenceData
    );
    expect(output.broker.loanPrincipal).toBe(0);
    expect(output.brokerStrategy.brokerAcceptsHigherEffort).toBe(false);
    expect(output.brokerStrategy.brokerFullyFinanceable).toBe(false);
  });

  it('does not limit the broker in LOWEST_COST mode: it keeps the bank loan', () => {
    const output = computeSimulatorOutput(
      buildInput({ monthlyNetIncomes: [6000], pendingDebts: 0, pendingDebtsRemainingMonths: 0 }),
      referenceData
    );
    expect(output.brokerStrategy.sustainability).toBeNull();
    expect(output.broker.loanPrincipal).toBeCloseTo(output.bankBonified.loanPrincipal, 6);
  });

  it('uses the MAX_FINANCING broker strategy when the bank offer had to be adjusted, financing more than the bank with a smaller up-front payment', () => {
    const output = computeSimulatorOutput(
      buildInput({ availableSavings: 10000, requestedLtvPercentage: 95 }),
      referenceData
    );
    expect(output.brokerStrategy.mode).toBe('MAX_FINANCING');
    expect(output.brokerStrategy.bankLtvExceeded).toBe(true);
    expect(output.broker.ltv.effectiveLtvPercentage).toBe(90);
    expect(output.brokerStrategy.additionalLoanVsBank).toBeGreaterThan(0);
    expect(output.brokerStrategy.initialContributionDeltaVsBank).toBeLessThan(0);
    expect(output.broker.loanPrincipal).toBeGreaterThan(output.bankBonified.loanPrincipal);
  });

  it('uses the MAX_FINANCING broker strategy when the bank LTV plus savings do not cover the purchase price', () => {
    // Savings 20,000 -> 180,000 needed: above the bank's 80% (160,000) but exactly the broker's 90% ceiling.
    const output = computeSimulatorOutput(buildInput({ availableSavings: 20000 }), referenceData);
    expect(output.brokerStrategy.mode).toBe('MAX_FINANCING');
    expect(output.brokerStrategy.bankSavingsShortfall).toBe(true);
    expect(output.bankBonified.isFullyFinanceable).toBe(false);
    expect(output.broker.isFullyFinanceable).toBe(true);
  });

  it('uses the LOWEST_COST broker strategy when the bank can finance as requested: same loan, cheaper rate, no extra debt', () => {
    const output = computeSimulatorOutput(
      buildInput({ monthlyNetIncomes: [6000], pendingDebts: 0, pendingDebtsRemainingMonths: 0 }),
      referenceData
    );
    expect(output.brokerStrategy.mode).toBe('LOWEST_COST');
    expect(output.brokerStrategy.additionalLoanVsBank).toBeCloseTo(0, 6);
    expect(output.broker.loanPrincipal).toBeCloseTo(output.bankBonified.loanPrincipal, 6);
    expect(output.broker.monthlyQuota as number).toBeLessThan(output.bankBonified.monthlyQuota as number);
    expect(output.pricingDifferential.totalCostOfCreditDelta as number).toBeLessThan(0);
  });

  it('flags a broker offer whose own DSTI still exceeds the low-risk threshold instead of hiding it', () => {
    const output = computeSimulatorOutput(
      buildInput({ monthlyNetIncomes: [1500], pendingDebts: 100, pendingDebtsRemainingMonths: 0 }),
      referenceData
    );
    expect(output.brokerStrategy.mode).toBe('MAX_FINANCING');
    expect(output.brokerStrategy.brokerDstiWithinThreshold).toBe(false);
  });

  it('leaves loanPrincipal at the requested amount, unadjusted, when the bank path is already viable', () => {
    const output = computeSimulatorOutput(
      buildInput({ monthlyNetIncomes: [6000], pendingDebts: 0, pendingDebtsRemainingMonths: 0 }),
      referenceData
    );
    expect(output.bankBonified.wasAutoAdjustedForViability).toBe(false);
    expect(output.bankBonified.loanPrincipal).toBeCloseTo(160000, 2);
  });
});
