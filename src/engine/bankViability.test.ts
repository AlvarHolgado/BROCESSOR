import { describe, expect, it } from 'vitest';
import { calculateFrenchMonthlyQuota } from './mortgageEngine';
import { assessBankViability } from './bankViability';

describe('assessBankViability', () => {
  it('is viable when the LTV was not capped and DSTI stays within the GREEN threshold', () => {
    // 160,000 loan @ 2.5% / 25yr on 36,000 net income, no other debts -> low DSTI
    const quota = calculateFrenchMonthlyQuota(160000, 2.5, 25);
    const result = assessBankViability(false, quota / 3000, 0, 36000, 2.5, 25, 200000, 80);
    expect(result.isViable).toBe(true);
    expect(result.ltvExceeded).toBe(false);
    expect(result.dstiExceeded).toBe(false);
  });

  it('flags non-viability when the requested LTV had to be capped', () => {
    const result = assessBankViability(true, 0.2, 0, 36000, 2.5, 25, 200000, 80);
    expect(result.isViable).toBe(false);
    expect(result.ltvExceeded).toBe(true);
    expect(result.dstiExceeded).toBe(false);
  });

  it('flags non-viability when the immediate DSTI exceeds the GREEN threshold', () => {
    const result = assessBankViability(false, 0.42, 400, 24000, 3, 30, 200000, 80);
    expect(result.isViable).toBe(false);
    expect(result.dstiExceeded).toBe(true);
    expect(result.ltvExceeded).toBe(false);
  });

  it('computes a maxViableLoanAmount capped by both the bank LTV and the DSTI-safe budget', () => {
    // Low income caps the DSTI-safe loan well below the 80% LTV ceiling on a 200,000 property.
    const result = assessBankViability(false, 0.5, 200, 18000, 3, 30, 200000, 80);
    const ltvCeiling = 200000 * 0.8;
    expect(result.maxViableLoanAmount).toBeLessThan(ltvCeiling);
    expect(result.maxViableLtvPercentage).toBeLessThan(80);
  });

  it('caps maxViableLoanAmount at the bank LTV ceiling when income is generous', () => {
    // High income: the DSTI-safe budget covers far more than the 80% LTV ceiling allows.
    const result = assessBankViability(false, 0.1, 0, 300000, 3, 30, 200000, 80);
    expect(result.maxViableLoanAmount).toBeCloseTo(160000, 2);
    expect(result.maxViableLtvPercentage).toBeCloseTo(80, 6);
  });

  it('never returns a negative maxViableLoanAmount even for a very constrained profile', () => {
    const result = assessBankViability(true, 0.9, 5000, 12000, 4, 20, 200000, 80);
    expect(result.maxViableLoanAmount).toBeGreaterThanOrEqual(0);
  });
});
