import { describe, expect, it } from 'vitest';
import type { MarketRatesData } from '../types/marketRates';
import {
  getBankMaxLtvPercentage,
  getBrokerMaxLtvPercentage,
  resolveBankBonifiedRate,
  resolveBankNonBonifiedRate,
  resolveBrokerRate,
} from './marketTinResolver';

const marketRates: MarketRatesData = {
  officialAnchors: {
    euribor12MonthAverage2025: { value: 2.222, source: 'test' },
    euribor12MonthDecember2025: { value: 2.267, source: 'test' },
    ineAverageNewMortgageRateByMonth2025: { source: 'test' },
    bdeAverageTaeNewCreditDecember2025: { value: 2.6442, source: 'test' },
    maxLtvHabitualHousingBank: { value: 80, source: 'test' },
  },
  marketQuotes: [
    { mortgageType: 'FIXED', entity: 'Ibercaja', product: null, tin: 2.3, tae: 3.25, bonified: true, notes: null, source: 'test' },
    { mortgageType: 'FIXED', entity: 'Santander', product: null, tin: 2.55, tae: 3.27, bonified: true, notes: null, source: 'test' },
    { mortgageType: 'FIXED', entity: 'Banca March', product: null, tin: 2.65, tae: 3.01, bonified: false, notes: null, source: 'test' },
    { mortgageType: 'FIXED', entity: 'Sabadell', product: null, tin: 2.75, tae: 3.58, bonified: false, notes: null, source: 'test' },
    { mortgageType: 'VARIABLE', entity: 'Sabadell', product: null, tin: null, tae: 3.48, bonified: false, notes: null, source: 'test' },
    {
      mortgageType: 'VARIABLE',
      entity: 'Sabadell B',
      product: null,
      tin: 2.722,
      tae: 3.33,
      bonified: true,
      notes: null,
      initialPeriodTin: 1.35,
      initialPeriodMonths: 12,
      postFixedDifferentialOverEuribor: 0.5,
      source: 'test',
    },
    {
      mortgageType: 'VARIABLE',
      entity: 'ING B',
      product: null,
      tin: 2.962,
      tae: 3.44,
      bonified: true,
      notes: null,
      initialPeriodTin: 2.25,
      initialPeriodMonths: 12,
      postFixedDifferentialOverEuribor: 0.74,
      source: 'test',
    },
    {
      mortgageType: 'MIXED',
      entity: 'Ibercaja',
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

describe('resolveBankBonifiedRate', () => {
  it('averages TIN/TAE across every quote explicitly labeled bonified for that mortgage type', () => {
    const result = resolveBankBonifiedRate('FIXED', marketRates);
    expect(result.dataAvailable).toBe(true);
    expect(result.tin).toBeCloseTo((2.3 + 2.55) / 2, 6);
    expect(result.tae).toBeCloseTo((3.25 + 3.27) / 2, 6);
    expect(result.sourceEntities).toEqual(['Ibercaja', 'Santander']);
  });

  it('averages the initial-period TIN and post-initial differential across every matching VARIABLE quote', () => {
    const result = resolveBankBonifiedRate('VARIABLE', marketRates);
    expect(result.dataAvailable).toBe(true);
    expect(result.tin).toBeCloseTo((2.722 + 2.962) / 2, 6);
    expect(result.initialPeriodTin).toBeCloseTo((1.35 + 2.25) / 2, 6);
    expect(result.initialPeriodMonths).toBe(12);
    expect(result.postFixedDifferentialOverEuribor).toBeCloseTo((0.5 + 0.74) / 2, 6);
  });
});

describe('resolveBankNonBonifiedRate', () => {
  it('averages TIN/TAE across every quote without the bonified label', () => {
    const result = resolveBankNonBonifiedRate('FIXED', marketRates);
    expect(result.tin).toBeCloseTo((2.65 + 2.75) / 2, 6);
    expect(result.tae).toBeCloseTo((3.01 + 3.58) / 2, 6);
  });

  it('flags unavailable when the only quote has no TIN at all (TAE-only source)', () => {
    const result = resolveBankNonBonifiedRate('VARIABLE', marketRates);
    expect(result.dataAvailable).toBe(false);
    expect(result.tin).toBeNull();
    expect(result.tae).toBeCloseTo(3.48, 6);
  });

  it('carries the fixed-period schedule fields through for MIXED', () => {
    const result = resolveBankNonBonifiedRate('MIXED', marketRates);
    expect(result.tin).toBeCloseTo(2.1, 6);
    expect(result.tae).toBeNull();
    expect(result.fixedPeriodYears).toBe(10);
    expect(result.postFixedDifferentialOverEuribor).toBe(0.6);
  });
});

describe('resolveBrokerRate', () => {
  it('picks the single lowest-TIN quote across all quotes (bonified or not) for the mortgage type', () => {
    const result = resolveBrokerRate('FIXED', marketRates);
    expect(result.dataAvailable).toBe(true);
    expect(result.tin).toBeCloseTo(2.3, 6);
    expect(result.tae).toBeCloseTo(3.25, 6);
    expect(result.sourceEntities).toEqual(['Ibercaja']);
  });

  it('is strictly better than the bank-bonified average, reflecting real broker value', () => {
    const bonified = resolveBankBonifiedRate('FIXED', marketRates);
    const broker = resolveBrokerRate('FIXED', marketRates);
    expect(broker.tin).toBeLessThan(bonified.tin as number);
  });

  it('flags unavailable when every quote for the mortgage type has no TIN', () => {
    const noTinFixture: MarketRatesData = {
      ...marketRates,
      marketQuotes: [
        { mortgageType: 'VARIABLE', entity: 'Sabadell', product: null, tin: null, tae: 3.48, bonified: false, notes: null, source: 'test' },
      ],
    };
    const result = resolveBrokerRate('VARIABLE', noTinFixture);
    expect(result.dataAvailable).toBe(false);
    expect(result.tin).toBeNull();
  });

  it('picks the lowest-TIN VARIABLE quote and carries its initial-period fields through', () => {
    const result = resolveBrokerRate('VARIABLE', marketRates);
    expect(result.dataAvailable).toBe(true);
    expect(result.tin).toBeCloseTo(2.722, 6);
    expect(result.initialPeriodTin).toBeCloseTo(1.35, 6);
    expect(result.initialPeriodMonths).toBe(12);
    expect(result.postFixedDifferentialOverEuribor).toBeCloseTo(0.5, 6);
    expect(result.sourceEntities).toEqual(['Sabadell B']);
  });

  it('carries the fixed-period schedule fields through when the winning quote has them', () => {
    const result = resolveBrokerRate('MIXED', marketRates);
    expect(result.tin).toBeCloseTo(2.1, 6);
    expect(result.fixedPeriodYears).toBe(10);
    expect(result.postFixedDifferentialOverEuribor).toBe(0.6);
  });
});

describe('LTV convention lookups', () => {
  it('returns the bank and broker max LTV percentages', () => {
    expect(getBankMaxLtvPercentage(marketRates)).toBe(80);
    expect(getBrokerMaxLtvPercentage(marketRates)).toBe(90);
  });
});
