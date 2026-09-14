/**
 * Resolves bank-bonified, bank-non-bonified and broker TIN/TAE/LTV from the
 * market reference data in /data/marketRates.json, replacing manual TIN
 * entry. No official cross-tabulated benchmark exists (see that file's
 * disclaimer), so "bonified"/"non-bonified" per mortgage type is computed
 * as the average of the named market quotes carrying that label — every
 * result reports which entities it was averaged from and flags when no
 * matching quote exists at all, rather than silently returning 0.
 */

import type { MortgageType } from '../types/simulator';
import type { MarketRatesData, MarketQuote } from '../types/marketRates';

export interface RateReference {
  /** False when no market quote exists for this mortgage type/category — never silently defaulted. */
  dataAvailable: boolean;
  tin: number | null;
  tae: number | null;
  /** MIXED only: years the resolved TIN applies before switching to the post-fixed differential. */
  fixedPeriodYears?: number;
  /** VARIABLE and MIXED: differential over Euribor applicable after the initial/fixed period, as a percentage. Averaged across matching quotes, same as tin/tae. */
  postFixedDifferentialOverEuribor?: number;
  /** VARIABLE only: initial teaser TIN, as a percentage — display only, see RateReference.tin's doc comment. Averaged across matching quotes, same as tin/tae. */
  initialPeriodTin?: number;
  /** VARIABLE only: duration of the initial teaser period, in months. */
  initialPeriodMonths?: number;
  /** Named entities this reference was derived from, for transparency in the UI/PDF. */
  sourceEntities: string[];
}

function averageDefined(values: Array<number | null | undefined>): number | null {
  const defined = values.filter((value): value is number => value !== null && value !== undefined);
  if (defined.length === 0) {
    return null;
  }
  return defined.reduce((sum, value) => sum + value, 0) / defined.length;
}

function resolveRate(mortgageType: MortgageType, bonified: boolean, marketRates: MarketRatesData): RateReference {
  const matches: MarketQuote[] = marketRates.marketQuotes.filter(
    (quote) => quote.mortgageType === mortgageType && quote.bonified === bonified
  );

  const tin = averageDefined(matches.map((quote) => quote.tin));
  const tae = averageDefined(matches.map((quote) => quote.tae));
  const postFixedDifferentialOverEuribor = averageDefined(matches.map((quote) => quote.postFixedDifferentialOverEuribor));
  const initialPeriodTin = averageDefined(matches.map((quote) => quote.initialPeriodTin));
  // Structural facts (how long the initial/fixed period lasts) rather than priced quantities — taken from the
  // first quote that discloses one, since every sourced quote for a given type/category shares the same duration.
  const fixedPeriodYears = matches.find((quote) => quote.fixedPeriodYears !== undefined)?.fixedPeriodYears;
  const initialPeriodMonths = matches.find((quote) => quote.initialPeriodMonths !== undefined)?.initialPeriodMonths;

  return {
    dataAvailable: tin !== null,
    tin,
    tae,
    fixedPeriodYears,
    postFixedDifferentialOverEuribor: postFixedDifferentialOverEuribor ?? undefined,
    initialPeriodTin: initialPeriodTin ?? undefined,
    initialPeriodMonths,
    sourceEntities: matches.map((quote) => quote.entity),
  };
}

export function resolveBankBonifiedRate(mortgageType: MortgageType, marketRates: MarketRatesData): RateReference {
  return resolveRate(mortgageType, true, marketRates);
}

export function resolveBankNonBonifiedRate(mortgageType: MortgageType, marketRates: MarketRatesData): RateReference {
  return resolveRate(mortgageType, false, marketRates);
}

/**
 * Broker TIN/TAE is modeled as the single best real market quote for the
 * mortgage type (lowest TIN among ALL disclosed quotes, bonified or not) —
 * not an average, and not a fabricated extra discount on top of the bank
 * rate. This mirrors the broker's actual documented value proposition
 * (shopping the request to multiple banks simultaneously and negotiating
 * the best one found) and is why it naturally differs from the
 * bank-bonified average: it is one concrete winning quote, not a blend.
 */
export function resolveBrokerRate(mortgageType: MortgageType, marketRates: MarketRatesData): RateReference {
  const candidates = marketRates.marketQuotes.filter(
    (quote) => quote.mortgageType === mortgageType && quote.tin !== null
  );

  if (candidates.length === 0) {
    return { dataAvailable: false, tin: null, tae: null, sourceEntities: [] };
  }

  const bestQuote = candidates.reduce((lowest, quote) => ((quote.tin as number) < (lowest.tin as number) ? quote : lowest));

  return {
    dataAvailable: true,
    tin: bestQuote.tin,
    tae: bestQuote.tae,
    fixedPeriodYears: bestQuote.fixedPeriodYears,
    postFixedDifferentialOverEuribor: bestQuote.postFixedDifferentialOverEuribor,
    initialPeriodTin: bestQuote.initialPeriodTin,
    initialPeriodMonths: bestQuote.initialPeriodMonths,
    sourceEntities: [bestQuote.entity],
  };
}

export function getBankMaxLtvPercentage(marketRates: MarketRatesData): number {
  return marketRates.ltvConventions.bankMaxLtvPercentage.value;
}

export function getBrokerMaxLtvPercentage(marketRates: MarketRatesData): number {
  return marketRates.ltvConventions.brokerMaxLtvPercentage.value;
}
