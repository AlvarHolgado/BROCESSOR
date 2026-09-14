import { describe, expect, it } from 'vitest';
import { aggregateAmortizationByYear, generateAmortizationSchedule } from './amortization';
import { calculateFrenchMonthlyQuota } from './mortgageEngine';

describe('generateAmortizationSchedule', () => {
  it('returns one row per monthly payment', () => {
    const schedule = generateAmortizationSchedule(200000, 3, 30);
    expect(schedule).toHaveLength(360);
    expect(schedule[0].monthNumber).toBe(1);
    expect(schedule[359].monthNumber).toBe(360);
  });

  it('fully amortizes the loan: the final row leaves a zero remaining balance', () => {
    const schedule = generateAmortizationSchedule(150000, 2.5, 20);
    expect(schedule[schedule.length - 1].remainingBalance).toBe(0);
  });

  it('keeps every row summing principal + interest to the fixed monthly quota', () => {
    const principal = 200000;
    const rate = 3;
    const termYears = 30;
    const quota = calculateFrenchMonthlyQuota(principal, rate, termYears);
    const schedule = generateAmortizationSchedule(principal, rate, termYears);

    // Every row except the last (which absorbs any rounding remainder) matches the fixed quota exactly.
    for (const row of schedule.slice(0, -1)) {
      expect(row.principalPaid + row.interestPaid).toBeCloseTo(quota, 6);
    }
  });

  it('shifts the principal/interest split toward principal as the balance shrinks', () => {
    const schedule = generateAmortizationSchedule(200000, 3, 30);
    expect(schedule[0].interestPaid).toBeGreaterThan(schedule[0].principalPaid);
    expect(schedule[schedule.length - 1].principalPaid).toBeGreaterThan(schedule[schedule.length - 1].interestPaid);
  });

  it('decreases the remaining balance monotonically', () => {
    const schedule = generateAmortizationSchedule(100000, 4, 15);
    for (let i = 1; i < schedule.length; i++) {
      expect(schedule[i].remainingBalance).toBeLessThan(schedule[i - 1].remainingBalance);
    }
  });

  it('returns an empty schedule for a non-positive principal or term', () => {
    expect(generateAmortizationSchedule(0, 3, 30)).toEqual([]);
    expect(generateAmortizationSchedule(200000, 3, 0)).toEqual([]);
  });
});

describe('aggregateAmortizationByYear', () => {
  it('groups a monthly schedule into one row per 12 months', () => {
    const schedule = generateAmortizationSchedule(200000, 3, 5);
    const yearly = aggregateAmortizationByYear(schedule);

    expect(yearly).toHaveLength(5);
    expect(yearly.map((row) => row.year)).toEqual([1, 2, 3, 4, 5]);
  });

  it("sums each year's principal and interest across its 12 months", () => {
    const schedule = generateAmortizationSchedule(200000, 3, 2);
    const yearly = aggregateAmortizationByYear(schedule);

    const firstYearMonths = schedule.slice(0, 12);
    const expectedPrincipal = firstYearMonths.reduce((sum, row) => sum + row.principalPaid, 0);
    const expectedInterest = firstYearMonths.reduce((sum, row) => sum + row.interestPaid, 0);

    expect(yearly[0].principalPaid).toBeCloseTo(expectedPrincipal, 6);
    expect(yearly[0].interestPaid).toBeCloseTo(expectedInterest, 6);
  });

  it("takes each year's remainingBalance from that year's final month", () => {
    const schedule = generateAmortizationSchedule(200000, 3, 2);
    const yearly = aggregateAmortizationByYear(schedule);

    expect(yearly[0].remainingBalance).toBe(schedule[11].remainingBalance);
    expect(yearly[1].remainingBalance).toBe(schedule[23].remainingBalance);
  });

  it('fully amortizes: the final year ends with a zero remaining balance', () => {
    const schedule = generateAmortizationSchedule(150000, 2.5, 10);
    const yearly = aggregateAmortizationByYear(schedule);
    expect(yearly[yearly.length - 1].remainingBalance).toBe(0);
  });

  it('returns an empty array for an empty schedule', () => {
    expect(aggregateAmortizationByYear([])).toEqual([]);
  });
});
