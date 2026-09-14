/**
 * Manages saved mortgage scenarios in localStorage: save, delete, and
 * select a subset for side-by-side comparison. Pure client-side state —
 * persistence is a plain JSON array under STORAGE_KEY.
 */

import { useCallback, useMemo, useState } from 'react';
import type { SimulatorInput } from '../types/simulator';
import type { SimulatorOutput } from '../engine/simulate';

/** Bumped to v9 and reprefixed after the BROCESSOR -> BROSSESSOR rename — old brocessor.* keys (v1-v8) are intentionally left unread rather than migrated. */
const STORAGE_KEY = 'brossessor.savedSimulations.v9';

export interface SavedSimulation {
  id: string;
  name: string;
  /** ISO 8601 timestamp of when the scenario was saved. */
  savedAt: string;
  input: SimulatorInput;
  output: SimulatorOutput;
}

export interface UseSavedSimulationsResult {
  savedSimulations: SavedSimulation[];
  saveSimulation: (name: string, input: SimulatorInput, output: SimulatorOutput) => void;
  deleteSimulation: (id: string) => void;
  /** IDs currently checked for side-by-side comparison. */
  selectedIds: string[];
  toggleSelected: (id: string) => void;
  clearSelection: () => void;
  /** Saved simulations matching selectedIds, in saved order — ready for a comparison view. */
  comparedSimulations: SavedSimulation[];
}

function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function loadFromStorage(): SavedSimulation[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as SavedSimulation[]) : [];
  } catch {
    return [];
  }
}

function persistToStorage(simulations: SavedSimulation[]): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(simulations));
}

export function useSavedSimulations(): UseSavedSimulationsResult {
  const [savedSimulations, setSavedSimulations] = useState<SavedSimulation[]>(() => loadFromStorage());
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const saveSimulation = useCallback((name: string, input: SimulatorInput, output: SimulatorOutput) => {
    setSavedSimulations((previous) => {
      const next = [...previous, { id: generateId(), name, savedAt: new Date().toISOString(), input, output }];
      persistToStorage(next);
      return next;
    });
  }, []);

  const deleteSimulation = useCallback((id: string) => {
    setSavedSimulations((previous) => {
      const next = previous.filter((simulation) => simulation.id !== id);
      persistToStorage(next);
      return next;
    });
    setSelectedIds((previous) => previous.filter((selectedId) => selectedId !== id));
  }, []);

  const toggleSelected = useCallback((id: string) => {
    setSelectedIds((previous) =>
      previous.includes(id) ? previous.filter((selectedId) => selectedId !== id) : [...previous, id]
    );
  }, []);

  const clearSelection = useCallback(() => setSelectedIds([]), []);

  const comparedSimulations = useMemo(
    () => savedSimulations.filter((simulation) => selectedIds.includes(simulation.id)),
    [savedSimulations, selectedIds]
  );

  return {
    savedSimulations,
    saveSimulation,
    deleteSimulation,
    selectedIds,
    toggleSelected,
    clearSelection,
    comparedSimulations,
  };
}
