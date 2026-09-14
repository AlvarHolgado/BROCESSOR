import { describe, expect, it } from 'vitest';
import { resolveBankLtv, resolveBrokerLtv } from './ltvResolver';

describe('resolveBankLtv', () => {
  it('leaves the requested LTV untouched when within the bank max', () => {
    const result = resolveBankLtv(70, 80);
    expect(result.effectiveLtvPercentage).toBe(70);
    expect(result.wasCapped).toBe(false);
  });

  it('caps the effective LTV at the bank max when the request exceeds it', () => {
    const result = resolveBankLtv(95, 80);
    expect(result.effectiveLtvPercentage).toBe(80);
    expect(result.wasCapped).toBe(true);
    expect(result.requestedLtvPercentage).toBe(95);
  });

  it('treats a request exactly at the max as not capped', () => {
    const result = resolveBankLtv(80, 80);
    expect(result.wasCapped).toBe(false);
    expect(result.effectiveLtvPercentage).toBe(80);
  });
});

describe('resolveBrokerLtv', () => {
  it('always uses the broker max as both requested and effective LTV', () => {
    const result = resolveBrokerLtv(90);
    expect(result.requestedLtvPercentage).toBe(90);
    expect(result.effectiveLtvPercentage).toBe(90);
    expect(result.wasCapped).toBe(false);
  });
});
