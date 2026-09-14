import { describe, expect, it } from 'vitest';
import type { FeeBracket, FormalizationFeesData } from '../types/formalizationFees';
import {
  calculateBracketedFee,
  calculateFormalizationCosts,
  calculateNotaryFee,
  calculateRegistryFee,
} from './formalizationCosts';

describe('calculateBracketedFee', () => {
  const brackets: FeeBracket[] = [
    { upTo: 1000, ratePerMille: 10 },
    { upTo: 3000, ratePerMille: 5 },
    { upTo: null, ratePerMille: 2 },
  ];

  it('applies only the first bracket when the base is within it', () => {
    // 500 * 10‰ = 5
    expect(calculateBracketedFee(500, brackets)).toBeCloseTo(5, 6);
  });

  it('applies each bracket marginally to its own slice of the base', () => {
    // 1000*10‰ + 1000*5‰ = 10 + 5 = 15
    expect(calculateBracketedFee(2000, brackets)).toBeCloseTo(15, 6);
  });

  it('applies the open-ended top bracket beyond its lower bound', () => {
    // 1000*10‰ + 2000*5‰ + 1000*2‰ = 10 + 10 + 2 = 22
    expect(calculateBracketedFee(4000, brackets)).toBeCloseTo(22, 6);
  });

  it('supports a flat fee for a bracket instead of a rate', () => {
    const flatFirstBracket: FeeBracket[] = [
      { upTo: 1000, flatFee: 24 },
      { upTo: null, ratePerMille: 5 },
    ];
    // 24 (flat) + 1000*5‰ = 24 + 5 = 29
    expect(calculateBracketedFee(2000, flatFirstBracket)).toBeCloseTo(29, 6);
  });

  it('returns 0 for a zero base', () => {
    expect(calculateBracketedFee(0, brackets)).toBe(0);
  });
});

const formalizationFees: FormalizationFeesData = {
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

describe('calculateNotaryFee', () => {
  it('adds the VAT-inclusive fixed component on top of the bracketed variable component', () => {
    const result = calculateNotaryFee(200000, formalizationFees.notaryFeeSchedule);
    expect(result.fixedComponentWithVat).toBeCloseTo(30.05 * 1.21, 6);
    expect(result.totalAmount).toBeCloseTo(result.variableComponent + result.fixedComponentWithVat, 6);
    expect(result.totalAmount).toBeGreaterThan(0);
  });
});

describe('calculateRegistryFee', () => {
  it('starts from the flat first-tier fee for a small base', () => {
    expect(calculateRegistryFee(5000, formalizationFees.registryFeeSchedule)).toBeCloseTo(24.040484, 6);
  });

  it('returns a larger fee for a larger purchase price', () => {
    const smaller = calculateRegistryFee(150000, formalizationFees.registryFeeSchedule);
    const larger = calculateRegistryFee(300000, formalizationFees.registryFeeSchedule);
    expect(larger).toBeGreaterThan(smaller);
  });
});

describe('calculateFormalizationCosts', () => {
  it('combines notary and registry purchase-deed fees into totalAmount', () => {
    const result = calculateFormalizationCosts(200000, formalizationFees);
    expect(result.totalAmount).toBeCloseTo(result.notaryFeePurchase.totalAmount + result.registryFeePurchase, 6);
  });

  it('never charges the buyer for gestoria (legally borne by the bank since Llei 5/2019)', () => {
    const result = calculateFormalizationCosts(200000, formalizationFees);
    expect(result.gestoriaCostToBuyer).toBe(0);
  });

  it('never charges the buyer for the mortgage-deed notary or registry fees (legally borne by the lender since Llei 5/2019)', () => {
    const result = calculateFormalizationCosts(200000, formalizationFees);
    expect(result.notaryFeeMortgage).toBe(0);
    expect(result.registryFeeMortgage).toBe(0);
  });
});
