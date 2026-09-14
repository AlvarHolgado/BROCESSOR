// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import type { SimulatorInput } from '../types/simulator';
import { computeSimulatorOutput, type SimulatorReferenceData } from '../engine/simulate';
import type { CcaaTaxRate } from '../types/ccaaTax';
import { MARKET_RATES } from '../data/marketRatesData';
import { FORMALIZATION_FEES } from '../data/formalizationFeesData';
import { useSavedSimulations } from './useSavedSimulations';

const madFixture: CcaaTaxRate = {
  code: 'MAD',
  name: 'Madrid',
  itpPercentage: 6,
  itpBrackets: null,
  ajdPercentage: 0.75,
  generalNote: null,
  cautionNote: null,
  reducedRates: [],
  sources: [],
};

const referenceData: SimulatorReferenceData = {
  ccaaTaxRates: [madFixture],
  marketRates: MARKET_RATES,
  formalizationFees: FORMALIZATION_FEES,
};

function buildInput(overrides: Partial<SimulatorInput> = {}): SimulatorInput {
  return {
    numberOfHolders: 1,
    holderNames: ['Test User'],
    holderAges: [30],
    employmentTypes: ['INDEFINITE'],
    employmentOtherDetails: [''],
    monthlyNetIncomes: [3500],
    pendingDebts: 100,
    pendingDebtsRemainingMonths: 24,
    availableSavings: 40000,
    propertyType: 'SECOND_HAND',
    propertyUsage: 'HABITUAL',
    ccaa: 'MAD',
    appraisalValue: 200000,
    purchaseValue: 200000,
    mortgageType: 'FIXED',
    durationYears: 30,
    requestedLtvPercentage: 80,
    ...overrides,
  };
}

function buildOutput(input: SimulatorInput) {
  return computeSimulatorOutput(input, referenceData);
}

describe('useSavedSimulations', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('starts empty when localStorage has nothing saved', () => {
    const { result } = renderHook(() => useSavedSimulations());
    expect(result.current.savedSimulations).toEqual([]);
  });

  it('saves a scenario and persists it to localStorage', () => {
    const { result } = renderHook(() => useSavedSimulations());
    const input = buildInput();
    const output = buildOutput(input);

    act(() => {
      result.current.saveSimulation('Escenari A', input, output);
    });

    expect(result.current.savedSimulations).toHaveLength(1);
    expect(result.current.savedSimulations[0].name).toBe('Escenari A');

    const stored = JSON.parse(window.localStorage.getItem('brossessor.savedSimulations.v9') ?? '[]');
    expect(stored).toHaveLength(1);
    expect(stored[0].name).toBe('Escenari A');
  });

  it('loads previously saved scenarios from localStorage on mount', () => {
    const input = buildInput();
    const output = buildOutput(input);
    window.localStorage.setItem(
      'brossessor.savedSimulations.v9',
      JSON.stringify([{ id: 'seed-1', name: 'Preexistent', savedAt: new Date().toISOString(), input, output }])
    );

    const { result } = renderHook(() => useSavedSimulations());
    expect(result.current.savedSimulations).toHaveLength(1);
    expect(result.current.savedSimulations[0].name).toBe('Preexistent');
  });

  it('deletes a saved scenario and removes it from localStorage', () => {
    const { result } = renderHook(() => useSavedSimulations());
    const input = buildInput();
    const output = buildOutput(input);

    act(() => {
      result.current.saveSimulation('Escenari A', input, output);
    });
    const savedId = result.current.savedSimulations[0].id;

    act(() => {
      result.current.deleteSimulation(savedId);
    });

    expect(result.current.savedSimulations).toEqual([]);
    const stored = JSON.parse(window.localStorage.getItem('brossessor.savedSimulations.v9') ?? '[]');
    expect(stored).toEqual([]);
  });

  it('deleting a scenario also drops it from the current selection', () => {
    const { result } = renderHook(() => useSavedSimulations());
    const input = buildInput();
    const output = buildOutput(input);

    act(() => {
      result.current.saveSimulation('Escenari A', input, output);
    });
    const savedId = result.current.savedSimulations[0].id;

    act(() => {
      result.current.toggleSelected(savedId);
    });
    expect(result.current.selectedIds).toEqual([savedId]);

    act(() => {
      result.current.deleteSimulation(savedId);
    });
    expect(result.current.selectedIds).toEqual([]);
  });

  it('toggles selection on and off, and derives comparedSimulations from it', () => {
    const { result } = renderHook(() => useSavedSimulations());
    const inputA = buildInput({ holderNames: ['A'] });
    const inputB = buildInput({ holderNames: ['B'] });

    act(() => {
      result.current.saveSimulation('Escenari A', inputA, buildOutput(inputA));
      result.current.saveSimulation('Escenari B', inputB, buildOutput(inputB));
    });

    const [idA, idB] = result.current.savedSimulations.map((simulation) => simulation.id);

    act(() => {
      result.current.toggleSelected(idA);
      result.current.toggleSelected(idB);
    });
    expect(result.current.comparedSimulations.map((simulation) => simulation.name)).toEqual(['Escenari A', 'Escenari B']);

    act(() => {
      result.current.toggleSelected(idA);
    });
    expect(result.current.comparedSimulations.map((simulation) => simulation.name)).toEqual(['Escenari B']);
  });

  it('clears the whole selection at once', () => {
    const { result } = renderHook(() => useSavedSimulations());
    const input = buildInput();

    act(() => {
      result.current.saveSimulation('Escenari A', input, buildOutput(input));
    });
    const savedId = result.current.savedSimulations[0].id;

    act(() => {
      result.current.toggleSelected(savedId);
    });
    expect(result.current.selectedIds).toHaveLength(1);

    act(() => {
      result.current.clearSelection();
    });
    expect(result.current.selectedIds).toEqual([]);
  });

  it('recovers gracefully from corrupted localStorage content', () => {
    window.localStorage.setItem('brossessor.savedSimulations.v9', '{not valid json');
    const { result } = renderHook(() => useSavedSimulations());
    expect(result.current.savedSimulations).toEqual([]);
  });
});
