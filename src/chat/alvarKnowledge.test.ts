import { describe, expect, it } from 'vitest';
import { ALVAR_KNOWLEDGE_BASE, getKnowledgeByCategory, type KnowledgeCategory } from './alvarKnowledge';

const ALL_CATEGORIES: KnowledgeCategory[] = [
  'FIXED_RATE',
  'VARIABLE_RATE',
  'MIXED_RATE',
  'EURIBOR',
  'COMMISSIONS',
  'TAXES_GENERAL',
  'ITP',
  'FORMALIZATION_FEES',
  'VIABILITY',
  'SIMULATOR_USAGE',
];

describe('ALVAR_KNOWLEDGE_BASE', () => {
  it('has up to 100 entries, none missing required content', () => {
    expect(ALVAR_KNOWLEDGE_BASE.length).toBeGreaterThan(0);
    expect(ALVAR_KNOWLEDGE_BASE.length).toBeLessThanOrEqual(100);
    for (const entry of ALVAR_KNOWLEDGE_BASE) {
      expect(entry.id.trim()).not.toBe('');
      expect(entry.question.trim()).not.toBe('');
      expect(entry.answer.trim().length).toBeGreaterThan(10);
      expect(entry.keywords.length).toBeGreaterThan(0);
      expect(ALL_CATEGORIES).toContain(entry.category);
    }
  });

  it('has no duplicate ids', () => {
    const ids = ALVAR_KNOWLEDGE_BASE.map((entry) => entry.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('covers every required category with at least one entry', () => {
    for (const category of ALL_CATEGORIES) {
      expect(getKnowledgeByCategory(category).length).toBeGreaterThan(0);
    }
  });

  it('never claims BROSSESSOR models a bank/broker commission numerically (it does not — see engine/costOfCredit.ts)', () => {
    const commissionEntry = ALVAR_KNOWLEDGE_BASE.find((entry) => entry.id === 'commission-002');
    expect(commissionEntry?.answer).toMatch(/no modela cap comissió/i);
  });
});
