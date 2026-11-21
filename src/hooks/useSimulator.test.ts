// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CCAA_CODES } from '../data/ccaaOptions';
import { EMPTY_SIMULATOR_FORM_STATE, useSimulator, type SimulatorFormState } from './useSimulator';

type ScalarFormValues = Omit<
  SimulatorFormState,
  'holderNames' | 'holderAges' | 'employmentTypes' | 'employmentOtherDetails' | 'monthlyNetIncomes'
>;

const VALID_SCALAR_FORM_VALUES: ScalarFormValues = {
  numberOfHolders: '1',
  pendingDebts: '150',
  pendingDebtsRemainingMonths: '24',
  availableSavings: '40000',
  propertyType: 'SECOND_HAND',
  propertyUsage: 'HABITUAL',
  ccaa: CCAA_CODES[0],
  appraisalValue: '210000',
  purchaseValue: '200000',
  mortgageType: 'FIXED',
  durationYears: '25',
  requestedLtvPercentage: '80',
};

interface HolderFixture {
  name: string;
  age: string;
  employmentType: string;
  income: string;
}

function fillForm(
  setField: (field: keyof ScalarFormValues, value: string) => void,
  setNumberOfHolders: (count: number) => void,
  setHolderName: (index: number, value: string) => void,
  setHolderAge: (index: number, value: string) => void,
  setEmploymentType: (index: number, value: string) => void,
  setHolderIncome: (index: number, value: string) => void,
  values: ScalarFormValues,
  holders: HolderFixture[]
) {
  for (const [field, value] of Object.entries(values) as Array<[keyof ScalarFormValues, string]>) {
    setField(field, value);
  }
  setNumberOfHolders(holders.length);
  holders.forEach((holder, index) => {
    setHolderName(index, holder.name);
    setHolderAge(index, holder.age);
    setEmploymentType(index, holder.employmentType);
    setHolderIncome(index, holder.income);
  });
}

const ONE_VALID_HOLDER: HolderFixture[] = [{ name: 'Maria Puig', age: '32', employmentType: 'INDEFINITE', income: '3500' }];

describe('useSimulator', () => {
  it('starts with empty values, no output, and is not valid', () => {
    const { result } = renderHook(() => useSimulator());

    expect(result.current.values).toEqual(EMPTY_SIMULATOR_FORM_STATE);
    expect(result.current.isValid).toBe(false);
    expect(result.current.output).toBeNull();
    expect(Object.keys(result.current.errors).length).toBeGreaterThan(0);
  });

  it('accepts seeded initial values', () => {
    const { result } = renderHook(() => useSimulator({ holderNames: ['Jordi'] }));
    expect(result.current.values.holderNames).toEqual(['Jordi']);
  });

  it('updates a single field without touching the others', () => {
    const { result } = renderHook(() => useSimulator());

    act(() => {
      result.current.setField('availableSavings', '1000');
    });

    expect(result.current.values.availableSavings).toBe('1000');
    expect(result.current.values.pendingDebts).toBe('');
  });

  it('surfaces a Catalan validation message for an invalid holder age', () => {
    const { result } = renderHook(() => useSimulator());

    act(() => {
      result.current.setNumberOfHolders(1);
      result.current.setHolderAge(0, '10');
    });

    expect(result.current.errors.holderAges).toBeDefined();
    expect(result.current.errors.holderAges).toMatch(/anys/);
  });

  it('surfaces a Catalan validation message when employmentType OTHER has no explanation', () => {
    const { result } = renderHook(() => useSimulator());

    // The employmentOtherDetails cross-field check only runs once the rest of
    // the form parses cleanly, so start from an otherwise fully valid form.
    act(() => {
      fillForm(
        result.current.setField,
        result.current.setNumberOfHolders,
        result.current.setHolderName,
        result.current.setHolderAge,
        result.current.setEmploymentType,
        result.current.setHolderIncome,
        VALID_SCALAR_FORM_VALUES,
        ONE_VALID_HOLDER
      );
    });
    expect(result.current.isValid).toBe(true);

    act(() => {
      result.current.setEmploymentType(0, 'OTHER');
    });

    expect(result.current.errors.employmentOtherDetails).toBeDefined();
    expect(result.current.isValid).toBe(false);
  });

  it('resizes every per-holder array together to match the chosen holder count, preserving already-entered values', () => {
    const { result } = renderHook(() => useSimulator());

    act(() => {
      result.current.setNumberOfHolders(2);
      result.current.setHolderName(0, 'Marc');
      result.current.setHolderAge(0, '40');
      result.current.setEmploymentType(0, 'INDEFINITE');
      result.current.setHolderIncome(0, '2000');
      result.current.setHolderName(1, 'Laia');
      result.current.setHolderAge(1, '38');
      result.current.setEmploymentType(1, 'SELF_EMPLOYED');
      result.current.setHolderIncome(1, '1500');
    });
    expect(result.current.values.holderNames).toEqual(['Marc', 'Laia']);
    expect(result.current.values.holderAges).toEqual(['40', '38']);
    expect(result.current.values.employmentTypes).toEqual(['INDEFINITE', 'SELF_EMPLOYED']);
    expect(result.current.values.monthlyNetIncomes).toEqual(['2000', '1500']);

    act(() => {
      result.current.setNumberOfHolders(1);
    });
    expect(result.current.values.holderNames).toEqual(['Marc']);
    expect(result.current.values.holderAges).toEqual(['40']);
    expect(result.current.values.employmentTypes).toEqual(['INDEFINITE']);
    expect(result.current.values.monthlyNetIncomes).toEqual(['2000']);

    act(() => {
      result.current.setNumberOfHolders(3);
    });
    expect(result.current.values.holderNames).toEqual(['Marc', '', '']);
    expect(result.current.values.holderAges).toEqual(['40', '', '']);
    expect(result.current.values.employmentTypes).toEqual(['INDEFINITE', '', '']);
    expect(result.current.values.monthlyNetIncomes).toEqual(['2000', '', '']);
  });

  it('becomes valid and produces a three-way engine comparison once every field is filled correctly', () => {
    const { result } = renderHook(() => useSimulator());

    act(() => {
      fillForm(
        result.current.setField,
        result.current.setNumberOfHolders,
        result.current.setHolderName,
        result.current.setHolderAge,
        result.current.setEmploymentType,
        result.current.setHolderIncome,
        VALID_SCALAR_FORM_VALUES,
        ONE_VALID_HOLDER
      );
    });

    expect(result.current.isValid).toBe(true);
    expect(result.current.errors).toEqual({});
    expect(result.current.input).not.toBeNull();
    expect(result.current.input?.ccaa).toBe(CCAA_CODES[0]);
    expect(result.current.input?.holderNames).toEqual(['Maria Puig']);
    expect(result.current.input?.holderAges).toEqual([32]);
    expect(result.current.input?.employmentTypes).toEqual(['INDEFINITE']);
    expect(result.current.output).not.toBeNull();
    expect(result.current.output?.taxBreakdown.ccaaCode).toBe(CCAA_CODES[0]);
    expect(result.current.output?.bankBonified.monthlyQuota).toBeGreaterThan(0);
    expect(result.current.output?.bankNonBonified.monthlyQuota).toBeGreaterThan(0);
    expect(result.current.output?.broker.monthlyQuota).toBeGreaterThan(0);
    // The broker LTV follows its strategy: its own max ceiling when the bank is tight, the client's requested LTV otherwise.
    const broker = result.current.output?.broker;
    const strategy = result.current.output?.brokerStrategy;
    expect(broker?.ltv.effectiveLtvPercentage).toBe(
      strategy?.mode === 'MAX_FINANCING' ? broker?.ltv.maxLtvPercentage : result.current.input?.requestedLtvPercentage
    );
  });

  it('clears the output again once a valid form is edited back into an invalid state', () => {
    const { result } = renderHook(() => useSimulator());

    act(() => {
      fillForm(
        result.current.setField,
        result.current.setNumberOfHolders,
        result.current.setHolderName,
        result.current.setHolderAge,
        result.current.setEmploymentType,
        result.current.setHolderIncome,
        VALID_SCALAR_FORM_VALUES,
        ONE_VALID_HOLDER
      );
    });
    expect(result.current.output).not.toBeNull();

    act(() => {
      result.current.setHolderIncome(0, '0');
    });

    expect(result.current.isValid).toBe(false);
    expect(result.current.output).toBeNull();
  });

  it('resets every field back to empty', () => {
    const { result } = renderHook(() => useSimulator());

    act(() => {
      fillForm(
        result.current.setField,
        result.current.setNumberOfHolders,
        result.current.setHolderName,
        result.current.setHolderAge,
        result.current.setEmploymentType,
        result.current.setHolderIncome,
        VALID_SCALAR_FORM_VALUES,
        ONE_VALID_HOLDER
      );
    });
    act(() => {
      result.current.reset();
    });

    expect(result.current.values).toEqual(EMPTY_SIMULATOR_FORM_STATE);
    expect(result.current.output).toBeNull();
  });
});
