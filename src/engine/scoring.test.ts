import { describe, expect, it } from 'vitest';
import {
  DSTI_GREEN_THRESHOLD,
  DSTI_YELLOW_THRESHOLD,
  assessMortgageRisk,
  assessTemporalMortgageRisk,
  calculateDstiRatio,
  calculateMaxRecommendedQuota,
  scoreDstiRisk,
} from './scoring';

describe('calculateDstiRatio', () => {
  it('divides total monthly debt service by net monthly income', () => {
    // 500 (debts) + 1000 (quota) = 1500; income 36000/12 = 3000 -> ratio 0.5
    expect(calculateDstiRatio(500, 1000, 36000)).toBeCloseTo(0.5, 10);
  });

  it('returns 0 when there is no debt service at all', () => {
    expect(calculateDstiRatio(0, 0, 24000)).toBe(0);
  });

  it('returns Infinity when annual net income is zero or negative', () => {
    expect(calculateDstiRatio(500, 1000, 0)).toBe(Infinity);
    expect(calculateDstiRatio(500, 1000, -1000)).toBe(Infinity);
  });
});

describe('scoreDstiRisk', () => {
  it('classifies at/under the GREEN threshold as LOW risk', () => {
    expect(scoreDstiRisk(DSTI_GREEN_THRESHOLD)).toEqual({ riskProfile: 'LOW', colorIndicator: 'GREEN' });
    expect(scoreDstiRisk(0.1)).toEqual({ riskProfile: 'LOW', colorIndicator: 'GREEN' });
  });

  it('classifies between GREEN and YELLOW thresholds as MEDIUM risk', () => {
    expect(scoreDstiRisk(0.36)).toEqual({ riskProfile: 'MEDIUM', colorIndicator: 'YELLOW' });
    expect(scoreDstiRisk(DSTI_YELLOW_THRESHOLD)).toEqual({ riskProfile: 'MEDIUM', colorIndicator: 'YELLOW' });
  });

  it('classifies above the YELLOW threshold as HIGH risk', () => {
    expect(scoreDstiRisk(0.41)).toEqual({ riskProfile: 'HIGH', colorIndicator: 'RED' });
    expect(scoreDstiRisk(1)).toEqual({ riskProfile: 'HIGH', colorIndicator: 'RED' });
  });
});

describe('assessMortgageRisk', () => {
  it('combines the ratio calculation and the risk classification', () => {
    const result = assessMortgageRisk(200, 800, 30000);
    expect(result.dstiRatio).toBeCloseTo(0.4, 10);
    expect(result.riskProfile).toBe('MEDIUM');
    expect(result.colorIndicator).toBe('YELLOW');
  });
});

describe('calculateMaxRecommendedQuota', () => {
  it('leaves room up to the GREEN threshold after existing debts', () => {
    // net monthly income 3000, GREEN budget = 1050, minus 200 existing debts = 850
    expect(calculateMaxRecommendedQuota(200, 36000)).toBeCloseTo(850, 10);
  });

  it('never returns a negative quota when existing debts exceed the GREEN budget', () => {
    expect(calculateMaxRecommendedQuota(5000, 36000)).toBe(0);
  });
});

describe('assessTemporalMortgageRisk', () => {
  it('improves the long-term DSTI over the immediate one when pending debts exist and end before the mortgage does', () => {
    const result = assessTemporalMortgageRisk(300, 24, 700, 36000, 360);
    expect(result.immediate.dstiRatio).toBeGreaterThan(result.longTerm.dstiRatio);
    expect(result.reachesLongTermProfile).toBe(true);
  });

  it('computes the immediate profile with existing debts included and the long-term profile without them', () => {
    const result = assessTemporalMortgageRisk(300, 24, 700, 36000, 360);
    expect(result.immediate.dstiRatio).toBeCloseTo(calculateDstiRatio(300, 700, 36000), 10);
    expect(result.longTerm.dstiRatio).toBeCloseTo(calculateDstiRatio(0, 700, 36000), 10);
  });

  it('gives identical immediate and long-term profiles when there are no pending debts', () => {
    const result = assessTemporalMortgageRisk(0, 0, 700, 36000, 360);
    expect(result.immediate.dstiRatio).toBeCloseTo(result.longTerm.dstiRatio, 10);
    expect(result.reachesLongTermProfile).toBe(true);
  });

  it('flags reachesLongTermProfile as false when the pending debts outlast the mortgage term', () => {
    const result = assessTemporalMortgageRisk(300, 400, 700, 36000, 360);
    expect(result.reachesLongTermProfile).toBe(false);
  });

  it('treats a pending-debt payoff exactly at the mortgage end as not yet reached', () => {
    const result = assessTemporalMortgageRisk(300, 360, 700, 36000, 360);
    expect(result.reachesLongTermProfile).toBe(false);
  });
});
