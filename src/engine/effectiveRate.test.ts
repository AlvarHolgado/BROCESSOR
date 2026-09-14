import { describe, expect, it } from 'vitest';
import { calculateFrenchMonthlyQuota } from './mortgageEngine';
import { calculateEffectiveAnnualRate, solveMonthlyRateForPresentValue } from './effectiveRate';

describe('solveMonthlyRateForPresentValue', () => {
  it('recovers the original rate used to build the annuity payment', () => {
    const principal = 160000;
    const monthlyRate = 0.03 / 12;
    const numberOfPayments = 300;
    const payment = (principal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -numberOfPayments));

    const solved = solveMonthlyRateForPresentValue(principal, payment, numberOfPayments);
    expect(solved).toBeCloseTo(monthlyRate, 8);
  });

  it('returns 0 for degenerate inputs', () => {
    expect(solveMonthlyRateForPresentValue(0, 500, 300)).toBe(0);
    expect(solveMonthlyRateForPresentValue(100000, 0, 300)).toBe(0);
    expect(solveMonthlyRateForPresentValue(100000, 500, 0)).toBe(0);
  });
});

describe('calculateEffectiveAnnualRate', () => {
  it('equals the compound-annualized TIN when there are no upfront costs', () => {
    const principal = 160000;
    const tin = 2.425;
    const years = 25;
    const quota = calculateFrenchMonthlyQuota(principal, tin, years);

    const tae = calculateEffectiveAnnualRate(principal, quota, years * 12, 0);
    const expectedTae = (Math.pow(1 + tin / 100 / 12, 12) - 1) * 100;
    expect(tae).toBeCloseTo(expectedTae, 4);
  });

  it('is strictly higher than the zero-cost TAE once upfront costs are added', () => {
    const principal = 160000;
    const tin = 2.7;
    const years = 25;
    const quota = calculateFrenchMonthlyQuota(principal, tin, years);

    const taeNoCosts = calculateEffectiveAnnualRate(principal, quota, years * 12, 0);
    const taeWithCosts = calculateEffectiveAnnualRate(principal, quota, years * 12, 376);
    expect(taeWithCosts).toBeGreaterThan(taeNoCosts);
  });

  it('increases monotonically as upfront costs increase', () => {
    const principal = 160000;
    const tin = 2.3;
    const years = 30;
    const quota = calculateFrenchMonthlyQuota(principal, tin, years);

    const smallCost = calculateEffectiveAnnualRate(principal, quota, years * 12, 500);
    const largeCost = calculateEffectiveAnnualRate(principal, quota, years * 12, 5000);
    expect(largeCost).toBeGreaterThan(smallCost);
  });

  it('differs across channels that share a mortgage type but differ in TIN and loan principal', () => {
    // Mirrors bank-bonified vs. bank-non-bonified vs. broker: different TIN -> different quota -> different TAE,
    // even though all three shared the exact same flat market-quoted TAE before this fix.
    const years = 25;
    const bonifiedQuota = calculateFrenchMonthlyQuota(160000, 2.425, years);
    const nonBonifiedQuota = calculateFrenchMonthlyQuota(160000, 2.7, years);
    const brokerQuota = calculateFrenchMonthlyQuota(180000, 2.3, years);

    const bonifiedTae = calculateEffectiveAnnualRate(160000, bonifiedQuota, years * 12, 376);
    const nonBonifiedTae = calculateEffectiveAnnualRate(160000, nonBonifiedQuota, years * 12, 376);
    const brokerTae = calculateEffectiveAnnualRate(180000, brokerQuota, years * 12, 376);

    expect(new Set([bonifiedTae, nonBonifiedTae, brokerTae]).size).toBe(3);
    expect(brokerTae).toBeLessThan(bonifiedTae);
    expect(bonifiedTae).toBeLessThan(nonBonifiedTae);
  });

  it('returns 0 when the amount effectively received is not positive (costs exceed principal)', () => {
    expect(calculateEffectiveAnnualRate(1000, 50, 120, 2000)).toBe(0);
  });

  it('returns 0 for a zero monthly quota or zero payments', () => {
    expect(calculateEffectiveAnnualRate(160000, 0, 300, 376)).toBe(0);
    expect(calculateEffectiveAnnualRate(160000, 700, 0, 376)).toBe(0);
  });
});
