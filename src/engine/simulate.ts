/**
 * Orchestrates every pure engine module into a three-way comparison
 * (bank-bonified, bank-non-bonified, broker) for a single validated input.
 * Still a pure function — no I/O, no React — so it stays independently
 * testable per .clauderules Rule 2, with all reference data injected as
 * arguments rather than imported.
 *
 * Household net monthly income is the sum of every holder's own declared
 * monthlyNetIncomes entry (SCREEN 1) — collected directly from the user,
 * not derived from a gross figure — and is used to feed DSTI/viability
 * evaluation below.
 */

import type { AmortizationRow, SimulatorInput } from '../types/simulator';
import type { CcaaTaxRate } from '../types/ccaaTax';
import type { MarketRatesData } from '../types/marketRates';
import type { FormalizationFeesData } from '../types/formalizationFees';
import { assessTemporalMortgageRisk, type TemporalDstiAssessment } from './scoring';
import {
  calculateFrenchMonthlyQuota,
  calculateInitialContribution,
  calculateLtvPercentage,
  calculateRegionalTaxBurden,
  type RegionalTaxResult,
} from './mortgageEngine';
import { generateAmortizationSchedule } from './amortization';
import { calculateCostOfCredit, type CostOfCreditSummary } from './costOfCredit';
import { calculateEffectiveAnnualRate } from './effectiveRate';
import { calculateFormalizationCosts, type FormalizationCostsResult } from './formalizationCosts';
import { assessBankViability, type BankViabilityAssessment } from './bankViability';
import {
  getBankMaxLtvPercentage,
  getBrokerMaxLtvPercentage,
  resolveBankBonifiedRate,
  resolveBankNonBonifiedRate,
  resolveBrokerRate,
  type RateReference,
} from './marketTinResolver';
import { resolveBankLtv, resolveBrokerLtv, type LtvResolutionResult } from './ltvResolver';
import { computePricingDifferential, type PricingDifferentialResult } from './pricingDifferential';

export type MortgagePathChannel = 'BANK_BONIFIED' | 'BANK_NON_BONIFIED' | 'BROKER';

export interface MortgagePathResult {
  channel: MortgagePathChannel;
  rate: RateReference;
  ltv: LtvResolutionResult;
  /** Amount financeable at ltv.effectiveLtvPercentage, before considering available savings. */
  maxFinancingAmount: number;
  /** Amount actually needed from the lender once available savings are applied to the purchase price. */
  requiredLoanAmount: number;
  loanPrincipal: number;
  /** False when the channel's LTV plus available savings do not cover the purchase price. */
  isFullyFinanceable: boolean;
  /**
   * Realized LTV of loanPrincipal over the lower of appraisal/purchase
   * value, as a percentage rounded to 2 decimal places — see
   * calculateLtvPercentage in mortgageEngine.ts. This is the true,
   * regulatory-formula LTV of the actual loan being taken, which can be
   * lower than ltv.effectiveLtvPercentage (the channel's LTV ceiling) once
   * available savings reduce the required loan below what that ceiling
   * would allow. UI/PDF display this field as "LTV", not the ceiling.
   */
  actualLtvPercentage: number;
  /** Aportació inicial necessària: purchaseValue + taxes/expenses - loanPrincipal. Always computable, even when the TIN is unavailable. */
  initialContributionRequired: number;
  /** Null when rate.dataAvailable is false — no quota can be computed without a TIN. */
  monthlyQuota: number | null;
  /**
   * Effective annual rate computed from THIS channel's own loanPrincipal,
   * monthlyQuota, term and formalization costs — see effectiveRate.ts.
   * Deliberately not rate.tae (the raw market-survey TAE): that figure was
   * measured under a different lender's own amount/term/fees and stayed
   * flat/inconsistent across channels. Null when monthlyQuota is null.
   */
  effectiveAnnualRate: number | null;
  riskAssessment: TemporalDstiAssessment | null;
  amortizationSchedule: AmortizationRow[];
  costOfCredit: CostOfCreditSummary | null;
  /** Only set for BANK_BONIFIED/BANK_NON_BONIFIED (never BROKER, which has its own LTV ceiling instead) and only when a TIN was available. */
  bankViability: BankViabilityAssessment | null;
}

export interface SimulatorOutput {
  taxBreakdown: RegionalTaxResult;
  formalizationCosts: FormalizationCostsResult;
  bankBonified: MortgagePathResult;
  bankNonBonified: MortgagePathResult;
  broker: MortgagePathResult;
  /** Explicit, transparent broker-vs-direct-bank comparison — see pricingDifferential.ts. */
  pricingDifferential: PricingDifferentialResult;
}

export interface SimulatorReferenceData {
  ccaaTaxRates: CcaaTaxRate[];
  marketRates: MarketRatesData;
  formalizationFees: FormalizationFeesData;
}

/**
 * Computes the full three-way simulation result for a single validated input.
 * Household netAnnualIncome is the sum of every holder's monthlyNetIncomes
 * entry, annualized — see the module doc comment. The tax/formalization
 * taxable base is the purchase price — see the documented assumptions in
 * mortgageEngine.ts and formalizationCosts.ts.
 */
export function computeSimulatorOutput(input: SimulatorInput, referenceData: SimulatorReferenceData): SimulatorOutput {
  const { ccaaTaxRates, marketRates, formalizationFees } = referenceData;
  const referenceValue = Math.min(input.appraisalValue, input.purchaseValue);

  const netAnnualIncome = input.monthlyNetIncomes.reduce((sum, holderIncome) => sum + holderIncome, 0) * 12;

  const taxBreakdown = calculateRegionalTaxBurden(input.ccaa, input.propertyType, input.purchaseValue, ccaaTaxRates);
  const formalizationCosts = calculateFormalizationCosts(input.purchaseValue, formalizationFees);
  const taxesAndExpenses = taxBreakdown.totalTaxAmount + formalizationCosts.totalAmount;

  const bankMaxLtv = getBankMaxLtvPercentage(marketRates);
  const brokerMaxLtv = getBrokerMaxLtvPercentage(marketRates);

  const buildPath = (channel: MortgagePathChannel, rate: RateReference, ltv: LtvResolutionResult) =>
    buildMortgagePath(
      channel,
      rate,
      ltv,
      input,
      referenceValue,
      netAnnualIncome,
      taxesAndExpenses,
      taxBreakdown,
      formalizationCosts,
      bankMaxLtv
    );

  const bankBonified = buildPath(
    'BANK_BONIFIED',
    resolveBankBonifiedRate(input.mortgageType, marketRates),
    resolveBankLtv(input.requestedLtvPercentage, bankMaxLtv)
  );
  const bankNonBonified = buildPath(
    'BANK_NON_BONIFIED',
    resolveBankNonBonifiedRate(input.mortgageType, marketRates),
    resolveBankLtv(input.requestedLtvPercentage, bankMaxLtv)
  );
  const broker = buildPath('BROKER', resolveBrokerRate(input.mortgageType, marketRates), resolveBrokerLtv(brokerMaxLtv));
  const pricingDifferential = computePricingDifferential(broker, bankBonified, bankNonBonified);

  return { taxBreakdown, formalizationCosts, bankBonified, bankNonBonified, broker, pricingDifferential };
}

function buildMortgagePath(
  channel: MortgagePathChannel,
  rate: RateReference,
  ltv: LtvResolutionResult,
  input: SimulatorInput,
  referenceValue: number,
  netAnnualIncome: number,
  taxesAndExpenses: number,
  taxBreakdown: RegionalTaxResult,
  formalizationCosts: FormalizationCostsResult,
  bankMaxLtvPercentage: number
): MortgagePathResult {
  const maxFinancingAmount = referenceValue * (ltv.effectiveLtvPercentage / 100);
  const requiredLoanAmount = Math.max(input.purchaseValue - input.availableSavings, 0);
  const loanPrincipal = Math.min(requiredLoanAmount, maxFinancingAmount);
  const isFullyFinanceable = requiredLoanAmount <= maxFinancingAmount;
  const actualLtvPercentage = calculateLtvPercentage(loanPrincipal, referenceValue);
  const initialContributionRequired = calculateInitialContribution(input.purchaseValue, taxesAndExpenses, loanPrincipal);

  if (!rate.dataAvailable || rate.tin === null) {
    return {
      channel,
      rate,
      ltv,
      maxFinancingAmount,
      requiredLoanAmount,
      loanPrincipal,
      isFullyFinanceable,
      actualLtvPercentage,
      initialContributionRequired,
      monthlyQuota: null,
      effectiveAnnualRate: null,
      riskAssessment: null,
      amortizationSchedule: [],
      costOfCredit: null,
      bankViability: null,
    };
  }

  const numberOfPayments = input.durationYears * 12;
  const monthlyQuota = calculateFrenchMonthlyQuota(loanPrincipal, rate.tin, input.durationYears);
  const effectiveAnnualRate = calculateEffectiveAnnualRate(
    loanPrincipal,
    monthlyQuota,
    numberOfPayments,
    formalizationCosts.totalAmount
  );
  const riskAssessment = assessTemporalMortgageRisk(
    input.pendingDebts,
    input.pendingDebtsRemainingMonths,
    monthlyQuota,
    netAnnualIncome,
    numberOfPayments
  );
  const amortizationSchedule = generateAmortizationSchedule(loanPrincipal, rate.tin, input.durationYears);
  const costOfCredit = calculateCostOfCredit(
    loanPrincipal,
    amortizationSchedule,
    taxBreakdown.totalTaxAmount,
    formalizationCosts.totalAmount
  );

  const bankViability =
    channel === 'BROKER'
      ? null
      : assessBankViability(
          ltv.wasCapped,
          riskAssessment.immediate.dstiRatio,
          input.pendingDebts,
          netAnnualIncome,
          rate.tin,
          input.durationYears,
          referenceValue,
          bankMaxLtvPercentage
        );

  return {
    channel,
    rate,
    ltv,
    maxFinancingAmount,
    requiredLoanAmount,
    loanPrincipal,
    isFullyFinanceable,
    actualLtvPercentage,
    initialContributionRequired,
    monthlyQuota,
    effectiveAnnualRate,
    riskAssessment,
    amortizationSchedule,
    costOfCredit,
    bankViability,
  };
}
