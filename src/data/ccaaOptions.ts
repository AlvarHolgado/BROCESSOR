/**
 * Derived CCAA lookup helpers for schemas and form dropdowns.
 * Single source of truth: reads the codes/names already sourced in
 * mortgageData.json instead of duplicating them, so validation and the UI
 * dropdown can never drift out of sync with the underlying tax data.
 */

import type { CcaaTaxRate } from '../types/ccaaTax';
import mortgageData from './mortgageData.json';

const ccaaTaxRates = mortgageData.ccaaTaxRates as CcaaTaxRate[];

export interface CcaaOption {
  code: string;
  name: string;
}

/** {code, name} pairs for populating the CCAA select input, in data-file order. */
export const CCAA_OPTIONS: CcaaOption[] = ccaaTaxRates.map(({ code, name }) => ({ code, name }));

/** Valid CCAA codes, for schema validation. */
export const CCAA_CODES: string[] = CCAA_OPTIONS.map((option) => option.code);

/** Full tax rate records, re-exported with the proper type applied to the JSON import. */
export const CCAA_TAX_RATES: CcaaTaxRate[] = ccaaTaxRates;

export function findCcaaTaxRate(code: string): CcaaTaxRate | undefined {
  return CCAA_TAX_RATES.find((entry) => entry.code === code);
}
