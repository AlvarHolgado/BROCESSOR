import { describe, expect, it } from 'vitest';
import { CCAA_CODES } from '../data/ccaaOptions';
import { simulatorInputSchema } from './simulatorSchema';

function buildValidInput(overrides: Record<string, unknown> = {}) {
  return {
    numberOfHolders: 1,
    holderNames: ['Maria Puig'],
    holderAges: [32],
    employmentTypes: ['INDEFINITE'],
    employmentOtherDetails: [''],
    monthlyNetIncomes: [3500],
    pendingDebts: 150,
    pendingDebtsRemainingMonths: 24,
    availableSavings: 25000,
    propertyType: 'SECOND_HAND',
    propertyUsage: 'HABITUAL',
    ccaa: CCAA_CODES[0],
    appraisalValue: 210000,
    purchaseValue: 200000,
    mortgageType: 'FIXED',
    durationYears: 25,
    requestedLtvPercentage: 80,
    ...overrides,
  };
}

describe('simulatorInputSchema', () => {
  it('accepts a fully valid input', () => {
    const result = simulatorInputSchema.safeParse(buildValidInput());
    expect(result.success).toBe(true);
  });

  it('coerces numeric-looking strings from controlled form inputs', () => {
    const result = simulatorInputSchema.safeParse(
      buildValidInput({ holderAges: ['32'], monthlyNetIncomes: ['3500'], durationYears: '25' })
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.holderAges).toEqual([32]);
      expect(result.data.monthlyNetIncomes).toEqual([3500]);
    }
  });

  it('rejects a blank holder name', () => {
    const result = simulatorInputSchema.safeParse(buildValidInput({ holderNames: [''] }));
    expect(result.success).toBe(false);
  });

  it.each([17, 76])('rejects a holder age of %i outside the 18-75 range', (age) => {
    const result = simulatorInputSchema.safeParse(buildValidInput({ holderAges: [age] }));
    expect(result.success).toBe(false);
  });

  it('accepts holder ages at the boundaries of the 18-75 range', () => {
    expect(simulatorInputSchema.safeParse(buildValidInput({ holderAges: [18] })).success).toBe(true);
    expect(simulatorInputSchema.safeParse(buildValidInput({ holderAges: [75] })).success).toBe(true);
  });

  it('rejects when holderNames or holderAges length does not match numberOfHolders', () => {
    const namesResult = simulatorInputSchema.safeParse(
      buildValidInput({ numberOfHolders: 2, holderNames: ['Maria Puig'], holderAges: [32, 40], monthlyNetIncomes: [3500, 2000] })
    );
    expect(namesResult.success).toBe(false);
    if (!namesResult.success) {
      expect(namesResult.error.issues[0].path).toEqual(['holderNames']);
    }

    const agesResult = simulatorInputSchema.safeParse(
      buildValidInput({ numberOfHolders: 2, holderNames: ['Maria Puig', 'Jordi'], holderAges: [32], monthlyNetIncomes: [3500, 2000] })
    );
    expect(agesResult.success).toBe(false);
    if (!agesResult.success) {
      expect(agesResult.error.issues[0].path).toEqual(['holderAges']);
    }
  });

  it('rejects a non-positive holder income', () => {
    const result = simulatorInputSchema.safeParse(buildValidInput({ monthlyNetIncomes: [0] }));
    expect(result.success).toBe(false);
  });

  it('accepts multiple holders and sums their incomes at the engine level, not the schema', () => {
    const result = simulatorInputSchema.safeParse(
      buildValidInput({
        numberOfHolders: 2,
        holderNames: ['Maria Puig', 'Jordi'],
        holderAges: [32, 35],
        employmentTypes: ['INDEFINITE', 'SELF_EMPLOYED'],
        employmentOtherDetails: ['', ''],
        monthlyNetIncomes: [2000, 1800],
      })
    );
    expect(result.success).toBe(true);
  });

  it('rejects when monthlyNetIncomes length does not match numberOfHolders', () => {
    const result = simulatorInputSchema.safeParse(
      buildValidInput({
        numberOfHolders: 2,
        holderNames: ['Maria Puig', 'Jordi'],
        holderAges: [32, 35],
        employmentTypes: ['INDEFINITE', 'SELF_EMPLOYED'],
        employmentOtherDetails: ['', ''],
        monthlyNetIncomes: [2000],
      })
    );
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['monthlyNetIncomes']);
    }
  });

  it('rejects when employmentTypes length does not match numberOfHolders', () => {
    const result = simulatorInputSchema.safeParse(
      buildValidInput({
        numberOfHolders: 2,
        holderNames: ['Maria Puig', 'Jordi'],
        holderAges: [32, 35],
        employmentTypes: ['INDEFINITE'],
        monthlyNetIncomes: [2000, 1800],
      })
    );
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['employmentTypes']);
    }
  });

  it('requires employmentOtherDetails for a holder whose employmentType is OTHER', () => {
    const result = simulatorInputSchema.safeParse(buildValidInput({ employmentTypes: ['OTHER'], employmentOtherDetails: [''] }));
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['employmentOtherDetails', 0]);
    }
  });

  it('accepts a holder with employmentType OTHER once employmentOtherDetails is filled in', () => {
    const result = simulatorInputSchema.safeParse(
      buildValidInput({ employmentTypes: ['OTHER'], employmentOtherDetails: ['Renda bàsica'] })
    );
    expect(result.success).toBe(true);
  });

  it('rejects a numberOfHolders below 1 or above the supported maximum', () => {
    expect(simulatorInputSchema.safeParse(buildValidInput({ numberOfHolders: 0 })).success).toBe(false);
    expect(
      simulatorInputSchema.safeParse(
        buildValidInput({
          numberOfHolders: 5,
          holderNames: ['A', 'B', 'C', 'D', 'E'],
          holderAges: [20, 20, 20, 20, 20],
          employmentTypes: ['INDEFINITE', 'INDEFINITE', 'INDEFINITE', 'INDEFINITE', 'INDEFINITE'],
          employmentOtherDetails: ['', '', '', '', ''],
          monthlyNetIncomes: [1, 1, 1, 1, 1],
        })
      ).success
    ).toBe(false);
  });

  it('rejects negative pending debts and savings', () => {
    expect(simulatorInputSchema.safeParse(buildValidInput({ pendingDebts: -1 })).success).toBe(false);
    expect(simulatorInputSchema.safeParse(buildValidInput({ availableSavings: -1 })).success).toBe(false);
  });

  it('rejects a non-positive appraisal or purchase value', () => {
    expect(simulatorInputSchema.safeParse(buildValidInput({ appraisalValue: 0 })).success).toBe(false);
    expect(simulatorInputSchema.safeParse(buildValidInput({ purchaseValue: -50000 })).success).toBe(false);
  });

  it('rejects an unknown CCAA code', () => {
    const result = simulatorInputSchema.safeParse(buildValidInput({ ccaa: 'ZZZ' }));
    expect(result.success).toBe(false);
  });

  it('rejects an invalid employmentType/propertyType/propertyUsage/mortgageType value', () => {
    expect(simulatorInputSchema.safeParse(buildValidInput({ employmentTypes: ['FREELANCER'] })).success).toBe(false);
    expect(simulatorInputSchema.safeParse(buildValidInput({ propertyType: 'RENOVATED' })).success).toBe(false);
    expect(simulatorInputSchema.safeParse(buildValidInput({ propertyUsage: 'RENTED' })).success).toBe(false);
    expect(simulatorInputSchema.safeParse(buildValidInput({ mortgageType: 'HYBRID' })).success).toBe(false);
  });

  it('rejects a duration outside the 5-40 year sanity range', () => {
    expect(simulatorInputSchema.safeParse(buildValidInput({ durationYears: 4 })).success).toBe(false);
    expect(simulatorInputSchema.safeParse(buildValidInput({ durationYears: 41 })).success).toBe(false);
  });

  it('rejects a requested LTV outside 0-100%', () => {
    expect(simulatorInputSchema.safeParse(buildValidInput({ requestedLtvPercentage: 0 })).success).toBe(false);
    expect(simulatorInputSchema.safeParse(buildValidInput({ requestedLtvPercentage: 101 })).success).toBe(false);
  });

  it('surfaces a stable translation key rather than hardcoded text, for useSimulator to translate', () => {
    const result = simulatorInputSchema.safeParse(buildValidInput({ monthlyNetIncomes: [-5] }));
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('incomePositive');
    }
  });

  it('requires pendingDebtsRemainingMonths when pendingDebts is greater than 0', () => {
    const result = simulatorInputSchema.safeParse(
      buildValidInput({ pendingDebts: 150, pendingDebtsRemainingMonths: 0 })
    );
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['pendingDebtsRemainingMonths']);
    }
  });

  it('does not require pendingDebtsRemainingMonths when there are no pending debts', () => {
    const result = simulatorInputSchema.safeParse(
      buildValidInput({ pendingDebts: 0, pendingDebtsRemainingMonths: 0 })
    );
    expect(result.success).toBe(true);
  });

  it('accepts pendingDebtsRemainingMonths once it is a positive integer', () => {
    const result = simulatorInputSchema.safeParse(
      buildValidInput({ pendingDebts: 150, pendingDebtsRemainingMonths: 18 })
    );
    expect(result.success).toBe(true);
  });

  it('rejects a negative or unreasonably long pendingDebtsRemainingMonths', () => {
    expect(
      simulatorInputSchema.safeParse(buildValidInput({ pendingDebtsRemainingMonths: -1 })).success
    ).toBe(false);
    expect(
      simulatorInputSchema.safeParse(buildValidInput({ pendingDebtsRemainingMonths: 10000 })).success
    ).toBe(false);
  });
});
