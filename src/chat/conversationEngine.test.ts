import { describe, expect, it } from 'vitest';
import { EMPTY_SIMULATOR_FORM_STATE, type SimulatorFormState } from '../hooks/useSimulator';
import { ca } from '../i18n/dictionaries/ca';
import {
  applyAnswerToValues,
  buildQuestionText,
  getNextQuestion,
  getQuestionStep,
  getScrollTargetId,
  questionKey,
  resolveAnswer,
  resolveNumberOfHolders,
  type CcaaCandidate,
} from './conversationEngine';

const CCAA_CANDIDATES: CcaaCandidate[] = [{ code: 'MAD', names: ['Madrid'] }];

function withValues(overrides: Partial<SimulatorFormState>): SimulatorFormState {
  return { ...EMPTY_SIMULATOR_FORM_STATE, ...overrides };
}

describe('getNextQuestion', () => {
  it('asks for numberOfHolders first on an empty form', () => {
    expect(getNextQuestion(EMPTY_SIMULATOR_FORM_STATE)).toEqual({ kind: 'numberOfHolders' });
  });

  it('walks through holder-scoped fields in order, one holder at a time', () => {
    const values = withValues({ numberOfHolders: '2', holderNames: ['Marc', ''] });
    expect(getNextQuestion(values)).toEqual({ kind: 'holderName', index: 1 });
  });

  it('asks employmentOtherDetail only when that holder selected OTHER', () => {
    const values = withValues({
      numberOfHolders: '1',
      holderNames: ['Marc'],
      holderAges: ['35'],
      employmentTypes: ['OTHER'],
      employmentOtherDetails: [''],
    });
    expect(getNextQuestion(values)).toEqual({ kind: 'employmentOtherDetail', index: 0 });
  });

  it('skips pendingDebtsRemainingMonths when pendingDebts is 0', () => {
    const values = withValues({
      numberOfHolders: '1',
      holderNames: ['Marc'],
      holderAges: ['35'],
      employmentTypes: ['INDEFINITE'],
      employmentOtherDetails: [''],
      monthlyNetIncomes: ['3000'],
      pendingDebts: '0',
    });
    expect(getNextQuestion(values)).toEqual({ kind: 'availableSavings' });
  });

  it('asks pendingDebtsRemainingMonths when pendingDebts is positive', () => {
    const values = withValues({
      numberOfHolders: '1',
      holderNames: ['Marc'],
      holderAges: ['35'],
      employmentTypes: ['INDEFINITE'],
      employmentOtherDetails: [''],
      monthlyNetIncomes: ['3000'],
      pendingDebts: '150',
    });
    expect(getNextQuestion(values)).toEqual({ kind: 'pendingDebtsRemainingMonths' });
  });

  it('returns done once every field is filled', () => {
    const values = withValues({
      numberOfHolders: '1',
      holderNames: ['Marc'],
      holderAges: ['35'],
      employmentTypes: ['INDEFINITE'],
      employmentOtherDetails: [''],
      monthlyNetIncomes: ['3000'],
      pendingDebts: '0',
      availableSavings: '20000',
      purchaseValue: '200000',
      appraisalValue: '210000',
      propertyType: 'SECOND_HAND',
      propertyUsage: 'HABITUAL',
      ccaa: 'MAD',
      requestedLtvPercentage: '80',
      durationYears: '30',
      mortgageType: 'FIXED',
    });
    expect(getNextQuestion(values)).toEqual({ kind: 'done' });
  });
});

describe('questionKey', () => {
  it('disambiguates the same kind across different holder indices', () => {
    expect(questionKey({ kind: 'holderName', index: 0 })).not.toBe(questionKey({ kind: 'holderName', index: 1 }));
  });

  it('is stable for a plain (non-indexed) question', () => {
    expect(questionKey({ kind: 'ccaa' })).toBe('ccaa');
  });
});

describe('resolveAnswer', () => {
  it('extracts a valid numberOfHolders reply', () => {
    expect(resolveAnswer({ kind: 'numberOfHolders' }, 'som 2', 'ca', CCAA_CANDIDATES)).toEqual({
      success: true,
      kind: 'numberOfHolders',
      count: 2,
    });
  });

  it('rejects a numberOfHolders reply above the supported maximum', () => {
    expect(resolveAnswer({ kind: 'numberOfHolders' }, '10', 'ca', CCAA_CANDIDATES)).toEqual({ success: false });
  });

  it('extracts a holder name', () => {
    expect(resolveAnswer({ kind: 'holderName', index: 0 }, 'Marc Puig', 'ca', CCAA_CANDIDATES)).toEqual({
      success: true,
      kind: 'holderName',
      index: 0,
      value: 'Marc Puig',
    });
  });

  it('extracts a CCAA code via the provided candidates', () => {
    expect(resolveAnswer({ kind: 'ccaa' }, 'a Madrid', 'ca', CCAA_CANDIDATES)).toEqual({
      success: true,
      kind: 'ccaa',
      value: 'MAD',
    });
  });

  it('rejects an out-of-range LTV percentage reply', () => {
    expect(resolveAnswer({ kind: 'requestedLtvPercentage' }, '150', 'ca', CCAA_CANDIDATES)).toEqual({ success: false });
  });

  it('returns failure for the done question', () => {
    expect(resolveAnswer({ kind: 'done' }, 'anything', 'ca', CCAA_CANDIDATES)).toEqual({ success: false });
  });
});

describe('applyAnswerToValues', () => {
  it('resizes every per-holder array when numberOfHolders is answered, preserving existing entries', () => {
    const values = withValues({ numberOfHolders: '', holderNames: ['Marc'] });
    const next = applyAnswerToValues(values, { success: true, kind: 'numberOfHolders', count: 2 });
    expect(next.numberOfHolders).toBe('2');
    expect(next.holderNames).toEqual(['Marc', '']);
    expect(next.holderAges).toEqual(['', '']);
  });

  it('sets a single holder-scoped field without touching the others', () => {
    const values = withValues({ numberOfHolders: '2', holderNames: ['Marc', 'Laia'], holderAges: ['', ''] });
    const next = applyAnswerToValues(values, { success: true, kind: 'holderAge', index: 1, value: 40 });
    expect(next.holderAges).toEqual(['', '40']);
    expect(next.holderNames).toEqual(['Marc', 'Laia']);
  });

  it('sets a plain scalar field', () => {
    const values = withValues({});
    const next = applyAnswerToValues(values, { success: true, kind: 'purchaseValue', value: 200000 });
    expect(next.purchaseValue).toBe('200000');
  });
});

describe('buildQuestionText', () => {
  it('addresses a holder by their already-known name', () => {
    const values = withValues({ numberOfHolders: '1', holderNames: ['Marc'] });
    expect(buildQuestionText({ kind: 'holderAge', index: 0 }, values, ca)).toContain('Marc');
  });

  it('falls back to a generic holder label when the name is not yet known', () => {
    const values = withValues({ numberOfHolders: '1', holderNames: [''] });
    expect(buildQuestionText({ kind: 'holderAge', index: 0 }, values, ca)).toContain('Titular 1');
  });

  it('asks whether to download the PDF for the done question, using singular phrasing by default', () => {
    expect(buildQuestionText({ kind: 'done' }, EMPTY_SIMULATOR_FORM_STATE, ca)).toBe(ca.chat.askDownloadPdf(1));
  });

  it('picks the plural form for questions with a direct "you" verb once there are 2+ holders', () => {
    const singular = withValues({ numberOfHolders: '1' });
    const plural = withValues({ numberOfHolders: '2' });
    expect(buildQuestionText({ kind: 'availableSavings' }, singular, ca)).toContain('tens');
    expect(buildQuestionText({ kind: 'availableSavings' }, plural, ca)).toContain('teniu');
  });
});

describe('resolveNumberOfHolders', () => {
  it('defaults to 1 (singular) while numberOfHolders is still blank', () => {
    expect(resolveNumberOfHolders(EMPTY_SIMULATOR_FORM_STATE)).toBe(1);
  });

  it('reflects the actual filled-in count', () => {
    expect(resolveNumberOfHolders(withValues({ numberOfHolders: '3' }))).toBe(3);
  });
});

describe('getQuestionStep', () => {
  it('maps holder/income/debt questions to step 2', () => {
    expect(getQuestionStep({ kind: 'numberOfHolders' })).toBe(2);
    expect(getQuestionStep({ kind: 'holderAge', index: 0 })).toBe(2);
    expect(getQuestionStep({ kind: 'availableSavings' })).toBe(2);
  });

  it('maps property/financing questions to step 3', () => {
    expect(getQuestionStep({ kind: 'purchaseValue' })).toBe(3);
    expect(getQuestionStep({ kind: 'mortgageType' })).toBe(3);
  });

  it('returns null for the done question', () => {
    expect(getQuestionStep({ kind: 'done' })).toBeNull();
  });
});

describe('getScrollTargetId', () => {
  it('returns the matching form-field id for scalar questions', () => {
    expect(getScrollTargetId({ kind: 'purchaseValue' })).toBe('purchaseValue');
    expect(getScrollTargetId({ kind: 'holderAge', index: 1 })).toBe('holderAge-1');
  });

  it('returns the QuestionBlock wrapper id for card-selector questions with no single input', () => {
    expect(getScrollTargetId({ kind: 'numberOfHolders' })).toBe('question-numberOfHolders');
    expect(getScrollTargetId({ kind: 'propertyUsage' })).toBe('question-propertyUsage');
  });

  it('returns null for the done question', () => {
    expect(getScrollTargetId({ kind: 'done' })).toBeNull();
  });
});
