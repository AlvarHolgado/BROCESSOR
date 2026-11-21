/**
 * End-to-end audit of the simulator's numbers against the REAL production
 * data: for a grid of client profiles, every figure the UI/PDF prints is
 * recomputed independently here and cross-checked, so a loan amount, LTV,
 * quota, cost, DSTI, contribution or delta can never silently contradict
 * another figure shown next to it.
 */

import { describe, expect, it } from 'vitest';
import type { SimulatorInput } from '../types/simulator';
import { CCAA_TAX_RATES } from '../data/ccaaOptions';
import { MARKET_RATES } from '../data/marketRatesData';
import { FORMALIZATION_FEES } from '../data/formalizationFeesData';
import { getFormatters } from '../i18n/formatters';
import { getDictionary } from '../i18n/LanguageContext';
import { buildBrokerStrategyText } from '../utils/brokerStrategyText';
import { calculateFrenchMonthlyQuota } from './mortgageEngine';
import { DSTI_COMPARISON_EPSILON, DSTI_GREEN_THRESHOLD } from './scoring';
import { computeSimulatorOutput, type MortgagePathResult, type SimulatorOutput } from './simulate';

const referenceData = { ccaaTaxRates: CCAA_TAX_RATES, marketRates: MARKET_RATES, formalizationFees: FORMALIZATION_FEES };

function buildInput(overrides: Partial<SimulatorInput>): SimulatorInput {
  return {
    numberOfHolders: 1,
    holderNames: ['Test'],
    holderAges: [35],
    employmentTypes: ['INDEFINITE'],
    employmentOtherDetails: [''],
    monthlyNetIncomes: [3000],
    pendingDebts: 0,
    pendingDebtsRemainingMonths: 0,
    availableSavings: 60000,
    propertyType: 'SECOND_HAND',
    propertyUsage: 'HABITUAL',
    ccaa: 'CAT',
    appraisalValue: 300000,
    purchaseValue: 300000,
    mortgageType: 'FIXED',
    durationYears: 30,
    requestedLtvPercentage: 80,
    ...overrides,
  };
}

const incomes = [1200, 2500, 4000, 9000];
const savings = [0, 20000, 60000, 150000, 300000];
const prices = [180000, 300000, 412500];
const mortgageTypes: SimulatorInput['mortgageType'][] = ['FIXED', 'VARIABLE', 'MIXED'];
const requestedLtvs = [50, 80, 95];
const debts = [0, 350];

const scenarios: SimulatorInput[] = [];
for (const income of incomes) {
  for (const saved of savings) {
    for (const price of prices) {
      for (const mortgageType of mortgageTypes) {
        for (const requestedLtv of requestedLtvs) {
          for (const pendingDebts of debts) {
            scenarios.push(
              buildInput({
                monthlyNetIncomes: [income],
                availableSavings: saved,
                purchaseValue: price,
                appraisalValue: price - 7000,
                mortgageType,
                requestedLtvPercentage: requestedLtv,
                pendingDebts,
                pendingDebtsRemainingMonths: pendingDebts > 0 ? 24 : 0,
                propertyType: price === 300000 ? 'NEW_BUILD' : 'SECOND_HAND',
                ccaa: price === 412500 ? 'AND' : 'CAT',
              })
            );
          }
        }
      }
    }
  }
}

function allPaths(output: SimulatorOutput): MortgagePathResult[] {
  return [output.bankBonified, output.bankNonBonified, output.broker];
}

describe('simulator consistency audit (real production data)', () => {
  it('covers a meaningful grid of scenarios', () => {
    expect(scenarios.length).toBeGreaterThan(1000);
  });

  it('keeps loan, LTV, quota, schedule, cost, DSTI and contribution mutually consistent in every path', () => {
    for (const input of scenarios) {
      const output = computeSimulatorOutput(input, referenceData);
      const referenceValue = Math.min(input.appraisalValue, input.purchaseValue);
      const netAnnualIncome = input.monthlyNetIncomes.reduce((sum, income) => sum + income, 0) * 12;

      for (const path of allPaths(output)) {
        const label = `${path.channel} ${JSON.stringify(input)}`;

        // Loan never exceeds what is needed nor what the channel ceiling allows, and is never negative.
        expect(path.loanPrincipal, label).toBeGreaterThanOrEqual(0);
        expect(path.loanPrincipal, label).toBeLessThanOrEqual(path.requiredLoanAmount + 1e-6);
        expect(path.loanPrincipal, label).toBeLessThanOrEqual(path.maxFinancingAmount + 1e-6);

        // LTV is exactly the real loan over the lower of price/appraisal, 2 decimals — the figure every card and text shows.
        expect(path.actualLtvPercentage, label).toBe(Math.round((path.loanPrincipal / referenceValue) * 10000) / 100);

        // Whole-euro contribution lines add up to the total, and agree with the exact figure within rounding.
        const b = path.contributionBreakdown;
        expect(b.total, label).toBe(b.ownCapital + b.taxes + b.formalization);
        expect(b.formalization, label).toBe(b.notary + b.registry);
        expect(b.ownCapital, label).toBe(Math.round(input.purchaseValue) - Math.round(path.loanPrincipal));
        expect(Math.abs(b.total - path.initialContributionRequired), label).toBeLessThanOrEqual(2);

        if (path.monthlyQuota === null || path.costOfCredit === null || path.riskAssessment === null) {
          continue;
        }

        // Quota is the French-system quota of THIS path's own loan.
        expect(path.monthlyQuota, label).toBeCloseTo(calculateFrenchMonthlyQuota(path.loanPrincipal, path.rate.tin as number, input.durationYears), 6);

        // Schedule: right length, repays the loan exactly, interest = quota*n - principal.
        expect(path.amortizationSchedule.length, label).toBe(path.loanPrincipal > 0 ? input.durationYears * 12 : 0);
        if (path.loanPrincipal > 0) {
          const last = path.amortizationSchedule[path.amortizationSchedule.length - 1];
          expect(last.remainingBalance, label).toBe(0);
          const principalRepaid = path.amortizationSchedule.reduce((sum, row) => sum + row.principalPaid, 0);
          expect(principalRepaid, label).toBeCloseTo(path.loanPrincipal, 4);
          expect(path.costOfCredit.totalInterestPaid, label).toBeCloseTo(path.monthlyQuota * path.amortizationSchedule.length - path.loanPrincipal, 3);
        }

        // Total cost of credit = loan + interest + taxes + formalization, with the same tax/formalization figures as the breakdown.
        const c = path.costOfCredit;
        expect(c.totalCostOfCredit, label).toBeCloseTo(c.loanPrincipal + c.totalInterestPaid + c.totalTaxAmount + c.totalFormalizationCosts, 6);
        expect(c.totalTaxAmount, label).toBeCloseTo(output.taxBreakdown.totalTaxAmount, 6);
        expect(c.totalFormalizationCosts, label).toBeCloseTo(output.formalizationCosts.totalAmount, 6);

        // DSTI shown is exactly (debts + quota) / monthly income.
        const expectedDsti = (input.pendingDebts + path.monthlyQuota) / (netAnnualIncome / 12);
        expect(path.riskAssessment.immediate.dstiRatio, label).toBeCloseTo(expectedDsti, 9);
      }
    }
  });

  it('never leaves a bank offer above the DSTI limit: it is either viable as requested or auto-adjusted to within it', () => {
    for (const input of scenarios) {
      const output = computeSimulatorOutput(input, referenceData);
      for (const path of [output.bankBonified, output.bankNonBonified]) {
        if (path.riskAssessment === null || path.bankViability === null || path.loanPrincipal <= 0) {
          continue;
        }
        const dsti = path.riskAssessment.immediate.dstiRatio;
        const maxQuotaIsZero = input.pendingDebts / input.monthlyNetIncomes[0] >= DSTI_GREEN_THRESHOLD;
        if (!maxQuotaIsZero) {
          expect(dsti, `${path.channel} ${JSON.stringify(input)}`).toBeLessThanOrEqual(DSTI_GREEN_THRESHOLD + DSTI_COMPARISON_EPSILON);
        }
        expect(path.wasAutoAdjustedForViability, path.channel).toBe(!path.bankViability.isViable);
      }
    }
  });

  it('keeps the broker-vs-bank differential consistent with the cards: whole-euro deltas, withheld when the loans differ', () => {
    for (const input of scenarios) {
      const output = computeSimulatorOutput(input, referenceData);
      const d = output.pricingDifferential;
      const baseline = d.baselineChannel === 'BANK_BONIFIED' ? output.bankBonified : d.baselineChannel === 'BANK_NON_BONIFIED' ? output.bankNonBonified : null;
      if (!baseline) {
        continue;
      }
      expect(d.loanAmountDelta).toBe(Math.round(output.broker.loanPrincipal) - Math.round(baseline.loanPrincipal));
      expect(d.sameLoanAmount).toBe(d.loanAmountDelta === 0);

      if (!d.sameLoanAmount) {
        expect(d.monthlyQuotaDelta).toBeNull();
        expect(d.totalCostOfCreditDelta).toBeNull();
      } else if (output.broker.monthlyQuota !== null && baseline.monthlyQuota !== null) {
        expect(d.monthlyQuotaDelta).toBe(Math.round(output.broker.monthlyQuota) - Math.round(baseline.monthlyQuota));
        expect(d.totalCostOfCreditDelta).toBe(
          Math.round((output.broker.costOfCredit as { totalCostOfCredit: number }).totalCostOfCredit) -
            Math.round((baseline.costOfCredit as { totalCostOfCredit: number }).totalCostOfCredit)
        );
      }
    }
  });

  it('makes the broker explanation quote exactly the loan and LTV the broker card shows, in every language', () => {
    for (const language of ['ca', 'es', 'en'] as const) {
      const t = getDictionary(language);
      const f = getFormatters(language);
      for (const input of scenarios.filter((_, index) => index % 7 === 0)) {
        const output = computeSimulatorOutput(input, referenceData);
        if (!output.broker.rate.dataAvailable) {
          continue;
        }
        const text = buildBrokerStrategyText(output, t, f);
        const joined = [...text.paragraphs, ...text.conditions].join(' ');
        const label = `${language} ${JSON.stringify(input)}`;

        expect(joined, label).toContain(`${f.percent2.format(output.broker.actualLtvPercentage)}%`);
        expect(joined, label).toContain(f.currency0.format(output.broker.loanPrincipal));

        if (output.brokerStrategy.mode === 'LOWEST_COST') {
          // Viable operation: the broker takes the very same loan as the bank, only cheaper.
          expect(output.brokerStrategy.additionalLoanVsBank, label).toBe(0);
        } else if (output.brokerStrategy.additionalLoanVsBank > 0) {
          expect(joined, label).toContain(f.currency0.format(output.brokerStrategy.additionalLoanVsBank));
          // The contribution saving quoted equals the difference of the two cards' own totals.
          expect(output.brokerStrategy.initialContributionDeltaVsBank, label).toBe(
            output.broker.contributionBreakdown.total -
              (output.brokerStrategy.baselineChannel === 'BANK_BONIFIED' ? output.bankBonified : output.bankNonBonified).contributionBreakdown.total
          );
        }
      }
    }
  });
});
