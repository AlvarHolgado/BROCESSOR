/**
 * Data contracts for /src/data/formalizationFees.json — official notary and
 * property-registry arancel schedules. See /engine/formalizationCosts.ts.
 */

/** One tier of a progressive fee arancel. Exactly one of `ratePerMille`/`flatFee` is set. */
export interface FeeBracket {
  /** Upper bound of this tier, in EUR. `null` marks the top-open tier. */
  upTo: number | null;
  /** Marginal rate for this tier, in per-mille (e.g. 4.5 = 4.5‰ = 0.45%). */
  ratePerMille?: number;
  /** Flat fee replacing a rate for this tier (used for the registry's first tier). */
  flatFee?: number;
}

export interface NotaryFeeSchedule {
  brackets: FeeBracket[];
  fixedComponentBeforeVat: number;
  vatPercentage: number;
  source: string;
}

export interface RegistryFeeSchedule {
  brackets: FeeBracket[];
  source: string;
}

export interface FormalizationFeesData {
  notaryFeeSchedule: NotaryFeeSchedule;
  registryFeeSchedule: RegistryFeeSchedule;
}
