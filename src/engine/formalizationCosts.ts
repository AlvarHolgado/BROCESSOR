/**
 * Notary and property-registry formalization costs for the PURCHASE deed,
 * using the official arancel schedules in /data/formalizationFees.json,
 * plus the MORTGAGE deed's notary/registry/gestoria costs — all three of
 * which are legally borne by the lender, not the buyer, per Llei 5/2019
 * (LCCI) Art. 14.1.e: "los gastos de tasación del inmueble correrán a
 * cargo del prestatario y los aranceles notariales y registrales de la
 * escritura de préstamo hipotecario [...] así como los de las eventuales
 * escrituras de subsanación [...] serán de cuenta del prestamista." This
 * is corroborated by a real broker quote in /docs (ESTUDIO HOMTER.pdf),
 * which itemizes "Notario, gestoría y Registro (Hipoteca)" at 0€ for an
 * actual 2026 mortgage operation. Only the appraisal (tasació) remains a
 * buyer cost, and it is not modeled here since no sourced fee schedule for
 * it exists — see MISSING_DATA_REPORT.md.
 *
 * Any separate "regional CCAA commission" — confirmed not to exist beyond
 * the ITP/AJD already modeled in mortgageEngine.ts.
 */

import type { FeeBracket, FormalizationFeesData } from '../types/formalizationFees';

/** Applies a progressive fee arancel: each tier's flatFee or ratePerMille applies only to its slice of the base. */
export function calculateBracketedFee(base: number, brackets: FeeBracket[]): number {
  let fee = 0;
  let lowerBound = 0;

  for (const bracket of brackets) {
    const upperBound = bracket.upTo ?? Infinity;
    if (base <= lowerBound) {
      break;
    }
    const sliceAmount = Math.min(base, upperBound) - lowerBound;

    if (bracket.flatFee !== undefined) {
      fee += bracket.flatFee;
    } else if (bracket.ratePerMille !== undefined) {
      fee += sliceAmount * (bracket.ratePerMille / 1000);
    }

    lowerBound = upperBound;
  }

  return fee;
}

export interface NotaryFeeResult {
  variableComponent: number;
  fixedComponentWithVat: number;
  totalAmount: number;
}

export function calculateNotaryFee(
  purchasePrice: number,
  schedule: FormalizationFeesData['notaryFeeSchedule']
): NotaryFeeResult {
  const variableComponent = calculateBracketedFee(purchasePrice, schedule.brackets);
  const fixedComponentWithVat = schedule.fixedComponentBeforeVat * (1 + schedule.vatPercentage / 100);

  return {
    variableComponent,
    fixedComponentWithVat,
    totalAmount: variableComponent + fixedComponentWithVat,
  };
}

export function calculateRegistryFee(
  purchasePrice: number,
  schedule: FormalizationFeesData['registryFeeSchedule']
): number {
  return calculateBracketedFee(purchasePrice, schedule.brackets);
}

export interface FormalizationCostsResult {
  notaryFeePurchase: NotaryFeeResult;
  registryFeePurchase: number;
  /** Mortgage-deed notary fee — always 0 to the buyer, borne by the lender per Llei 5/2019 (LCCI) Art. 14.1.e. */
  notaryFeeMortgage: 0;
  /** Mortgage-deed registry fee — always 0 to the buyer, borne by the lender per Llei 5/2019 (LCCI) Art. 14.1.e. */
  registryFeeMortgage: 0;
  /** Mortgage-deed gestoria — always 0 to the buyer, borne by the lender per Llei 5/2019 (LCCI) Art. 14.1.e. */
  gestoriaCostToBuyer: 0;
  totalAmount: number;
}

export function calculateFormalizationCosts(
  purchasePrice: number,
  fees: FormalizationFeesData
): FormalizationCostsResult {
  const notaryFeePurchase = calculateNotaryFee(purchasePrice, fees.notaryFeeSchedule);
  const registryFeePurchase = calculateRegistryFee(purchasePrice, fees.registryFeeSchedule);

  return {
    notaryFeePurchase,
    registryFeePurchase,
    notaryFeeMortgage: 0,
    registryFeeMortgage: 0,
    gestoriaCostToBuyer: 0,
    // Mortgage-deed notary/registry/gestoria are always 0 to the buyer, so they don't add to totalAmount.
    totalAmount: notaryFeePurchase.totalAmount + registryFeePurchase,
  };
}
