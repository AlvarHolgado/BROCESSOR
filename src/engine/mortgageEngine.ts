/**
 * Mortgage quota, financing capacity and regional tax calculations.
 * Pure functions only — all data (CCAA tax rates, property details) is
 * injected as arguments rather than imported, so these functions stay
 * independently testable and decoupled from /data file loading.
 */

import type { PropertyType } from '../types/simulator';
import type { CcaaTaxRate, ItpBracket } from '../types/ccaaTax';

// ============================================================
// French amortization system — monthly quota
// ============================================================

/**
 * Calculates the fixed monthly installment (quota) under the French amortization
 * system, where every payment is equal and the principal/interest split shifts
 * over time.
 *
 * @param principal Loan amount, in EUR.
 * @param annualInterestRatePercentage Nominal annual interest rate (TIN), as a percentage (e.g. 3.45).
 * @param termYears Loan duration, in years.
 */
export function calculateFrenchMonthlyQuota(
  principal: number,
  annualInterestRatePercentage: number,
  termYears: number
): number {
  const monthlyRate = annualInterestRatePercentage / 100 / 12;
  const numberOfPayments = termYears * 12;

  if (numberOfPayments <= 0) {
    return 0;
  }

  if (monthlyRate === 0) {
    return principal / numberOfPayments;
  }

  const compoundFactor = Math.pow(1 + monthlyRate, numberOfPayments);
  return (principal * monthlyRate * compoundFactor) / (compoundFactor - 1);
}

/**
 * Exact algebraic inverse of calculateFrenchMonthlyQuota: the largest loan
 * principal whose French-system monthly quota does not exceed
 * maxMonthlyPayment, at the given TIN and term. Used to size the maximum
 * loan a borrower can afford under a monthly-budget constraint (e.g. the
 * DSTI-safe quota from scoring.ts), rather than a fixed LTV cap.
 */
export function calculateMaxLoanFromMonthlyBudget(
  maxMonthlyPayment: number,
  annualInterestRatePercentage: number,
  termYears: number
): number {
  const monthlyRate = annualInterestRatePercentage / 100 / 12;
  const numberOfPayments = termYears * 12;

  if (numberOfPayments <= 0 || maxMonthlyPayment <= 0) {
    return 0;
  }

  if (monthlyRate === 0) {
    return maxMonthlyPayment * numberOfPayments;
  }

  const compoundFactor = Math.pow(1 + monthlyRate, numberOfPayments);
  return (maxMonthlyPayment * (compoundFactor - 1)) / (monthlyRate * compoundFactor);
}

// ============================================================
// Financing capacity
// ============================================================

/**
 * Maximum amount a lender will finance, applying the LTV percentage to the
 * lower of appraisal value and purchase value — lenders never finance a
 * percentage of the higher figure.
 */
export function calculateMaxFinancingAmount(
  appraisalValue: number,
  purchaseValue: number,
  maxLtvPercentage: number
): number {
  const referenceValue = Math.min(appraisalValue, purchaseValue);
  return referenceValue * (maxLtvPercentage / 100);
}

/**
 * Loan-to-Value percentage per the standard regulatory formula:
 *   LTV (%) = (Loan Amount / min(Purchase Price, Appraisal Value)) * 100
 * rounded to 2 decimal places. `referenceValue` must already be the lower
 * of purchase price and appraisal value — every call site in this codebase
 * shares that single `referenceValue` (computed once per simulation) so the
 * "lower of the two" rule can never drift between callers. Returns 0 when
 * `referenceValue` is non-positive, to avoid a division by zero.
 */
export function calculateLtvPercentage(loanAmount: number, referenceValue: number): number {
  if (referenceValue <= 0) {
    return 0;
  }
  const rawPercentage = (loanAmount / referenceValue) * 100;
  return Math.round(rawPercentage * 100) / 100;
}

/**
 * Aportació inicial necessària: the cash the buyer must bring to closing —
 * purchase price plus taxes/formalization expenses, minus what the loan
 * actually covers. Mirrors the "Aportación económica necesaria = Coste
 * total de la operación - Importe financiado" structure used by real
 * mortgage-offer documents.
 */
export function calculateInitialContribution(
  purchaseValue: number,
  taxesAndExpenses: number,
  loanPrincipal: number
): number {
  return purchaseValue + taxesAndExpenses - loanPrincipal;
}

// ============================================================
// Regional tax burden (ITP / AJD)
// ============================================================

/**
 * Applies a progressive bracket scale to a taxable base using marginal-rate
 * calculation: each tier's rate applies only to the slice of the base that
 * falls within that tier, matching how the current regional ITP scales
 * (Aragó, Catalunya, Astúries, etc.) are structured in their consolidated texts.
 */
export function calculateProgressiveTax(taxableBase: number, brackets: ItpBracket[]): number {
  let tax = 0;
  let lowerBound = 0;

  for (const bracket of brackets) {
    const upperBound = bracket.upTo ?? Infinity;
    if (taxableBase <= lowerBound) {
      break;
    }
    const sliceAmount = Math.min(taxableBase, upperBound) - lowerBound;
    tax += sliceAmount * (bracket.rate / 100);
    lowerBound = upperBound;
  }

  return tax;
}

export interface ItpResult {
  /** ITP applies to second-hand property transfers; new builds are VAT-taxed instead. */
  applicable: boolean;
  /** Effective flat rate applied, as a percentage. `null` when brackets were used or ITP does not apply. */
  ratePercentage: number | null;
  amount: number;
  usedProgressiveBrackets: boolean;
}

export interface AjdResult {
  /** AJD is charged on the notarial deed; modeled here for new-build purchases. */
  applicable: boolean;
  ratePercentage: number | null;
  amount: number;
  /** False when the CCAA's ajdPercentage has not been researched/populated yet. */
  dataAvailable: boolean;
}

export interface RegionalTaxResult {
  ccaaCode: string;
  propertyType: PropertyType;
  taxableBase: number;
  itp: ItpResult;
  ajd: AjdResult;
  totalTaxAmount: number;
}

/**
 * Computes the regional transfer/stamp tax burden for a property purchase.
 *
 * ITP and AJD are mutually exclusive on the same transaction (Art. 31.2 TRLITPAJD):
 * second-hand transfers are taxed under ITP, while new builds are subject to VAT
 * (not modeled here — national tax, out of scope) plus AJD on the deed.
 *
 * Only the CCAA's general rate/brackets are applied — reduced-rate categories
 * (jóvenes, família numerosa, etc.) require collective-specific eligibility logic
 * and are intentionally not applied here.
 *
 * Throws if `ccaaCode` has no matching entry in `ccaaTaxRates`, rather than
 * silently falling back to a guessed rate.
 */
export function calculateRegionalTaxBurden(
  ccaaCode: string,
  propertyType: PropertyType,
  taxableBase: number,
  ccaaTaxRates: CcaaTaxRate[]
): RegionalTaxResult {
  const ccaaRate = ccaaTaxRates.find((entry) => entry.code === ccaaCode);
  if (!ccaaRate) {
    throw new Error(`No tax rate data found for CCAA code "${ccaaCode}".`);
  }

  const itp = calculateItp(propertyType, taxableBase, ccaaRate);
  const ajd = calculateAjd(propertyType, taxableBase, ccaaRate);

  return {
    ccaaCode,
    propertyType,
    taxableBase,
    itp,
    ajd,
    totalTaxAmount: itp.amount + ajd.amount,
  };
}

function calculateItp(propertyType: PropertyType, taxableBase: number, ccaaRate: CcaaTaxRate): ItpResult {
  if (propertyType !== 'SECOND_HAND') {
    return { applicable: false, ratePercentage: null, amount: 0, usedProgressiveBrackets: false };
  }

  if (ccaaRate.itpBrackets) {
    return {
      applicable: true,
      ratePercentage: null,
      amount: calculateProgressiveTax(taxableBase, ccaaRate.itpBrackets),
      usedProgressiveBrackets: true,
    };
  }

  const flatRate = ccaaRate.itpPercentage ?? 0;
  return {
    applicable: true,
    ratePercentage: ccaaRate.itpPercentage,
    amount: taxableBase * (flatRate / 100),
    usedProgressiveBrackets: false,
  };
}

function calculateAjd(propertyType: PropertyType, taxableBase: number, ccaaRate: CcaaTaxRate): AjdResult {
  if (propertyType !== 'NEW_BUILD') {
    return { applicable: false, ratePercentage: null, amount: 0, dataAvailable: true };
  }

  const dataAvailable = ccaaRate.ajdPercentage !== null;
  const rate = ccaaRate.ajdPercentage ?? 0;

  return {
    applicable: true,
    ratePercentage: ccaaRate.ajdPercentage,
    amount: taxableBase * (rate / 100),
    dataAvailable,
  };
}
