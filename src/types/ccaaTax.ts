/**
 * ITP (Impost sobre Transmissions Patrimonials) data contracts for CCAA tax benchmarks.
 * Populated from official regional/foral tax authority sources as of 2026-08-24.
 * See /docs/ITP_CCAA_2025_2026.html for the full research dossier, and the `sources`
 * field on each CcaaTaxRate entry for per-jurisdiction citations.
 */

/** One tier of a progressive ITP scale, in ascending order of `upTo`. */
export interface ItpBracket {
  /** Upper bound of this tier, in EUR. `null` marks the top-open tier (no upper bound). */
  upTo: number | null;
  /** Rate applicable within this tier, as a percentage. */
  rate: number;
}

/** Collective or condition a reduced ITP rate applies to. */
export type ReducedRateCategory =
  | 'JOVENES'
  | 'FAMILIA_NUMEROSA'
  | 'MONOPARENTAL'
  | 'DISCAPACIDAD'
  | 'VPO'
  | 'VPO_ESPECIAL'
  | 'VIOLENCIA_GENERO'
  | 'RURAL_DESPOBLACION'
  | 'GENERAL_REDUCIDO';

/**
 * How well-sourced a given reduced rate is, per `RULE 1` in `.clauderules` (zero data
 * hallucination): `verified` comes from an official primary source, `unverified` only from
 * a private/secondary source or an ambiguous official text, `not-found` means no source
 * mentions it at all, and `not-applicable` means an official source confirms the category
 * does not exist in that jurisdiction.
 */
export type VerificationStatus = 'verified' | 'unverified' | 'not-found' | 'not-applicable';

export interface TaxSource {
  label: string;
  url: string;
}

export interface ReducedItpRate {
  category: ReducedRateCategory;
  /** Human-readable description of the collective and its conditions. */
  label: string;
  /** Flat reduced rate, as a percentage. Mutually exclusive with rateBrackets/bonusPercentage. */
  rate: number | null;
  /** Progressive reduced-rate tiers, when the reduction itself is tiered by price. */
  rateBrackets: ItpBracket[] | null;
  /** Percentage discount applied to the cuota (bonificación) instead of a direct rate. */
  bonusPercentage: number | null;
  /** Maximum property price/value this reduced rate applies to, in EUR. */
  priceLimit: number | null;
  /** Maximum age (exclusive, "menor de X años") required for this reduced rate. */
  ageLimit: number | null;
  /** Minimum disability grade (%) required for this reduced rate. */
  disabilityMinPercentage: number | null;
  /** Maximum income/tax-base limit under individual taxation, in EUR. */
  incomeLimitIndividual: number | null;
  /** Maximum income/tax-base limit under joint taxation, in EUR. */
  incomeLimitJoint: number | null;
  /** Additional conditions or caveats not captured by the structured fields above. */
  notes: string | null;
  status: VerificationStatus;
}

export interface CcaaTaxRate {
  code: string;
  name: string;
  /** Simplified headline ITP rate: the base/first-tier rate when `itpBrackets` is set. */
  itpPercentage: number | null;
  /** Full progressive scale, when the CCAA taxes by price tier instead of a flat rate. `null` for a flat-rate CCAA. */
  itpBrackets: ItpBracket[] | null;
  ajdPercentage: number | null;
  /** General-population reduced rate or bonus not tied to any specific collective, when one exists. */
  generalNote: string | null;
  /** Known discrepancy between sources, or an additional benefit not covered by the structured categories. */
  cautionNote: string | null;
  reducedRates: ReducedItpRate[];
  sources: TaxSource[];
}
