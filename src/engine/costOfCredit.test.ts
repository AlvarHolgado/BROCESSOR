import { describe, expect, it } from 'vitest';
import { calculateCostOfCredit } from './costOfCredit';
import { generateAmortizationSchedule } from './amortization';

describe('calculateCostOfCredit', () => {
  it('sums interest paid across the whole schedule', () => {
    const schedule = generateAmortizationSchedule(200000, 3, 30);
    const expectedInterest = schedule.reduce((sum, row) => sum + row.interestPaid, 0);

    const result = calculateCostOfCredit(200000, schedule, 12000, 3000);
    expect(result.totalInterestPaid).toBeCloseTo(expectedInterest, 6);
  });

  it('adds principal, total interest, taxes and formalization costs into totalCostOfCredit', () => {
    const schedule = generateAmortizationSchedule(200000, 3, 30);
    const result = calculateCostOfCredit(200000, schedule, 12000, 3000);

    expect(result.totalCostOfCredit).toBeCloseTo(
      result.loanPrincipal + result.totalInterestPaid + result.totalTaxAmount + result.totalFormalizationCosts,
      6
    );
  });

  it('returns zero interest for an empty schedule', () => {
    const result = calculateCostOfCredit(0, [], 0, 0);
    expect(result.totalInterestPaid).toBe(0);
    expect(result.totalCostOfCredit).toBe(0);
  });
});
