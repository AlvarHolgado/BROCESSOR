import { describe, expect, it } from 'vitest';
import { detectGlossaryTopic } from './glossary';

describe('detectGlossaryTopic', () => {
  it('detects LTV from a bare acronym mention, no question cue required', () => {
    expect(detectGlossaryTopic('ltv?', 'ca')).toBe('LTV');
    expect(detectGlossaryTopic('what is my LTV', 'en')).toBe('LTV');
  });

  it('detects DSTI from a bare mention in any supported language', () => {
    expect(detectGlossaryTopic('què és el DSTI', 'ca')).toBe('DSTI');
    expect(detectGlossaryTopic('qué es el dsti', 'es')).toBe('DSTI');
    expect(detectGlossaryTopic('what does dsti mean', 'en')).toBe('DSTI');
  });

  it('does NOT treat a plain mortgageType-style answer as a rate-type-risk side question', () => {
    expect(detectGlossaryTopic('variable', 'ca')).toBeNull();
    expect(detectGlossaryTopic('fixed', 'en')).toBeNull();
    expect(detectGlossaryTopic('la vull fixa', 'ca')).toBeNull();
  });

  it('detects rate-type risk only when an explicit question cue is present', () => {
    expect(detectGlossaryTopic('quina diferència hi ha entre fix i variable?', 'ca')).toBe('RATE_TYPE_RISK');
    expect(detectGlossaryTopic('what is the difference between fixed and variable rate?', 'en')).toBe('RATE_TYPE_RISK');
  });

  it('is diacritic-insensitive, so an unaccented cue still triggers (regression: found live when this returned null and the raw text was then misread as a "fix" mortgageType answer)', () => {
    expect(detectGlossaryTopic('quina diferencia hi ha entre fix i variable?', 'ca')).toBe('RATE_TYPE_RISK');
  });

  it('returns null for plain field-answer-shaped text', () => {
    expect(detectGlossaryTopic('2500', 'ca')).toBeNull();
    expect(detectGlossaryTopic('Joan Garcia', 'ca')).toBeNull();
    expect(detectGlossaryTopic('Catalunya', 'ca')).toBeNull();
  });
});
