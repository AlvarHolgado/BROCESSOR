import { describe, expect, it } from 'vitest';
import type { CcaaTaxRate } from '../types/ccaaTax';
import {
  calculateFrenchMonthlyQuota,
  calculateInitialContribution,
  calculateLtvPercentage,
  calculateMaxFinancingAmount,
  calculateMaxLoanFromMonthlyBudget,
  calculateProgressiveTax,
  calculateRegionalTaxBurden,
} from './mortgageEngine';

function buildCcaaFixture(overrides: Partial<CcaaTaxRate>): CcaaTaxRate {
  return {
    code: 'TST',
    name: 'Test Region',
    itpPercentage: null,
    itpBrackets: null,
    ajdPercentage: null,
    generalNote: null,
    cautionNote: null,
    reducedRates: [],
    sources: [],
    ...overrides,
  };
}

describe('calculateFrenchMonthlyQuota', () => {
  it('matches the closed-form French amortization formula for a standard loan', () => {
    // 200,000 EUR at 3% TIN over 30 years
    const quota = calculateFrenchMonthlyQuota(200000, 3, 30);
    expect(quota).toBeCloseTo(843.21, 2);
  });

  it('degrades to a flat principal/n split at a 0% interest rate', () => {
    expect(calculateFrenchMonthlyQuota(120000, 0, 10)).toBeCloseTo(1000, 10);
  });

  it('returns 0 when there are no payments to schedule', () => {
    expect(calculateFrenchMonthlyQuota(100000, 3, 0)).toBe(0);
  });
});

describe('calculateMaxLoanFromMonthlyBudget', () => {
  it('is the exact algebraic inverse of calculateFrenchMonthlyQuota', () => {
    const principal = 160000;
    const tin = 2.7;
    const years = 25;
    const quota = calculateFrenchMonthlyQuota(principal, tin, years);

    const recoveredPrincipal = calculateMaxLoanFromMonthlyBudget(quota, tin, years);
    expect(recoveredPrincipal).toBeCloseTo(principal, 6);
  });

  it('degrades to a flat budget*n split at a 0% interest rate', () => {
    expect(calculateMaxLoanFromMonthlyBudget(1000, 0, 10)).toBeCloseTo(120000, 6);
  });

  it('returns 0 for a non-positive budget or term', () => {
    expect(calculateMaxLoanFromMonthlyBudget(0, 3, 30)).toBe(0);
    expect(calculateMaxLoanFromMonthlyBudget(700, 3, 0)).toBe(0);
  });

  it('increases with a larger monthly budget', () => {
    const smaller = calculateMaxLoanFromMonthlyBudget(500, 3, 30);
    const larger = calculateMaxLoanFromMonthlyBudget(1000, 3, 30);
    expect(larger).toBeGreaterThan(smaller);
  });
});

describe('calculateMaxFinancingAmount', () => {
  it('applies the LTV percentage to the lower of appraisal and purchase value', () => {
    expect(calculateMaxFinancingAmount(300000, 250000, 80)).toBeCloseTo(200000, 10);
    expect(calculateMaxFinancingAmount(250000, 300000, 80)).toBeCloseTo(200000, 10);
  });
});

describe('calculateLtvPercentage', () => {
  it('computes loan amount over the reference value as a percentage', () => {
    // 160,000 / 200,000 * 100 = 80%
    expect(calculateLtvPercentage(160000, 200000)).toBeCloseTo(80, 6);
  });

  it('rounds to exactly 2 decimal places', () => {
    // 100,000 / 300,000 * 100 = 33.333...% -> 33.33%
    expect(calculateLtvPercentage(100000, 300000)).toBe(33.33);
    // 1 / 3 * 100 = 33.333...% -> 33.33%
    expect(calculateLtvPercentage(1, 3)).toBe(33.33);
  });

  it('rounds the half-up case correctly (2 decimals)', () => {
    // 1 / 8 * 100 = 12.5% -> already exact, no rounding artifact
    expect(calculateLtvPercentage(1, 8)).toBe(12.5);
    // 2 / 7 * 100 = 28.5714...% -> 28.57%
    expect(calculateLtvPercentage(2, 7)).toBe(28.57);
  });

  it('returns 0 when the reference value is zero or negative, avoiding a division by zero', () => {
    expect(calculateLtvPercentage(160000, 0)).toBe(0);
    expect(calculateLtvPercentage(160000, -1)).toBe(0);
  });

  it('reflects the caller passing min(purchaseValue, appraisalValue) as referenceValue', () => {
    const loanAmount = 180000;
    const referenceValue = Math.min(220000, 200000);
    expect(calculateLtvPercentage(loanAmount, referenceValue)).toBeCloseTo(90, 6);
  });
});

describe('calculateProgressiveTax', () => {
  it('applies each bracket rate only to the slice of base within that tier', () => {
    const brackets = [
      { upTo: 600000, rate: 10 },
      { upTo: 900000, rate: 11 },
      { upTo: null, rate: 13 },
    ];
    // 700,000 -> 600,000*10% + 100,000*11% = 60,000 + 11,000 = 71,000
    expect(calculateProgressiveTax(700000, brackets)).toBeCloseTo(71000, 10);
  });

  it('taxes a base within the first bracket entirely at the first rate', () => {
    const brackets = [
      { upTo: 600000, rate: 10 },
      { upTo: null, rate: 13 },
    ];
    expect(calculateProgressiveTax(400000, brackets)).toBeCloseTo(40000, 10);
  });
});

describe('calculateRegionalTaxBurden', () => {
  it('applies flat-rate ITP to second-hand properties and skips AJD', () => {
    const fixture = buildCcaaFixture({ code: 'MAD', itpPercentage: 6, ajdPercentage: 0.75 });
    const result = calculateRegionalTaxBurden('MAD', 'SECOND_HAND', 200000, [fixture]);

    expect(result.itp).toEqual({
      applicable: true,
      ratePercentage: 6,
      amount: 12000,
      usedProgressiveBrackets: false,
    });
    expect(result.ajd).toEqual({ applicable: false, ratePercentage: null, amount: 0, dataAvailable: true });
    expect(result.totalTaxAmount).toBeCloseTo(12000, 10);
  });

  it('applies AJD to new-build properties and skips ITP', () => {
    const fixture = buildCcaaFixture({ code: 'MAD', itpPercentage: 6, ajdPercentage: 0.75 });
    const result = calculateRegionalTaxBurden('MAD', 'NEW_BUILD', 200000, [fixture]);

    expect(result.itp).toEqual({ applicable: false, ratePercentage: null, amount: 0, usedProgressiveBrackets: false });
    expect(result.ajd).toEqual({ applicable: true, ratePercentage: 0.75, amount: 1500, dataAvailable: true });
    expect(result.totalTaxAmount).toBeCloseTo(1500, 10);
  });

  it('flags AJD data as unavailable instead of silently defaulting to a guessed rate', () => {
    const fixture = buildCcaaFixture({ code: 'AND', ajdPercentage: null });
    const result = calculateRegionalTaxBurden('AND', 'NEW_BUILD', 200000, [fixture]);

    expect(result.ajd.amount).toBe(0);
    expect(result.ajd.dataAvailable).toBe(false);
  });

  it('applies progressive ITP brackets when present instead of a flat rate', () => {
    const fixture = buildCcaaFixture({
      code: 'CAT',
      itpPercentage: 10,
      itpBrackets: [
        { upTo: 600000, rate: 10 },
        { upTo: null, rate: 13 },
      ],
    });
    const result = calculateRegionalTaxBurden('CAT', 'SECOND_HAND', 700000, [fixture]);

    expect(result.itp.usedProgressiveBrackets).toBe(true);
    expect(result.itp.ratePercentage).toBeNull();
    expect(result.itp.amount).toBeCloseTo(73000, 10);
  });

  it('throws when the CCAA code has no matching tax data, instead of guessing', () => {
    expect(() => calculateRegionalTaxBurden('XXX', 'SECOND_HAND', 200000, [])).toThrow();
  });
});

describe('calculateInitialContribution', () => {
  it('equals purchase price plus taxes/expenses minus the loan principal', () => {
    // 200,000 price + 12,376 taxes/expenses - 160,000 loan = 52,376
    expect(calculateInitialContribution(200000, 12376, 160000)).toBeCloseTo(52376, 6);
  });

  it('increases when the loan principal covers less of the purchase (lower LTV)', () => {
    const higherLtv = calculateInitialContribution(200000, 12376, 180000);
    const lowerLtv = calculateInitialContribution(200000, 12376, 160000);
    expect(lowerLtv).toBeGreaterThan(higherLtv);
  });

  it('can be negative when the loan more than covers price plus expenses', () => {
    expect(calculateInitialContribution(200000, 5000, 210000)).toBeCloseTo(-5000, 6);
  });
});
