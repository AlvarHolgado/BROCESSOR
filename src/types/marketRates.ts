/**
 * Data contracts for /src/data/marketRates.json — market TIN/TAE/LTV
 * reference data used by the dynamic bank-vs-broker TIN resolver.
 * See /engine/marketTinResolver.ts for the pure functions that consume this.
 */

import type { MortgageType } from './simulator';

export interface SourcedValue {
  value: number;
  source: string;
}

export interface IneAverageByMonth {
  [month: string]: number | string;
}

export interface OfficialAnchors {
  euribor12MonthAverage2025: SourcedValue;
  euribor12MonthDecember2025: SourcedValue;
  ineAverageNewMortgageRateByMonth2025: IneAverageByMonth;
  bdeAverageTaeNewCreditDecember2025: SourcedValue;
  maxLtvHabitualHousingBank: SourcedValue;
}

/** A single named market quote (comparator listing), not an official aggregate. */
export interface MarketQuote {
  mortgageType: MortgageType;
  entity: string;
  product: string | null;
  /**
   * Nominal rate, as a percentage. `null` when the source only disclosed the
   * TAE. For VARIABLE quotes this is the steady-state (post-initial-period)
   * rate — the one used for the full-term loan-cost calculation, since the
   * engine does not model a multi-phase amortization schedule. The initial
   * teaser rate is carried separately in `initialPeriodTin`, for display only.
   */
  tin: number | null;
  /** Annual equivalent rate, as a percentage. `null` when unavailable or ambiguous at the source. */
  tae: number | null;
  /** Whether this quote requires bundled linked products to unlock the rate. */
  bonified: boolean;
  notes: string | null;
  /** Years the fixedPeriodTin (MIXED only) applies before switching to the post-fixed differential. */
  fixedPeriodYears?: number;
  /** Differential over Euribor applicable after the initial/fixed period (VARIABLE and MIXED), as a percentage. */
  postFixedDifferentialOverEuribor?: number;
  /** Initial teaser TIN (VARIABLE only), as a percentage — display only, see the `tin` doc comment above. */
  initialPeriodTin?: number;
  /** Duration of the initial teaser period (VARIABLE only), in months. */
  initialPeriodMonths?: number;
  source: string;
}

export interface LtvConventions {
  bankMaxLtvPercentage: SourcedValue;
  brokerMaxLtvPercentage: SourcedValue;
}

export interface MarketRatesData {
  officialAnchors: OfficialAnchors;
  marketQuotes: MarketQuote[];
  ltvConventions: LtvConventions;
}
