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
import { DSTI_COMPARISON_EPSILON, assessTemporalMortgageRisk, type TemporalDstiAssessment } from './scoring';
import {
  calculateFrenchMonthlyQuota,
  calculateInitialContribution,
  calculateLtvPercentage,
  calculateMaxLoanFromMonthlyBudget,
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
import {
  BROKER_MAX_DSTI_RATIO,
  describeBrokerStrategy,
  resolveBrokerModeDecision,
  type BrokerStrategyResult,
  type BrokerSustainability,
} from './brokerStrategy';
import { buildInitialContributionBreakdown, calculateRequiredLoanAmount, type InitialContributionBreakdown } from './contributionBreakdown';

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
  /** Aportació inicial necessària: purchaseValue + taxes/expenses - loanPrincipal, exact (unrounded). Always computable, even when the TIN is unavailable. */
  initialContributionRequired: number;
  /** The same contribution in whole euros, split into the lines the UI/PDF show — the displayed total is the sum of the displayed parts. See contributionBreakdown.ts. */
  contributionBreakdown: InitialContributionBreakdown;
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
  /**
   * Only set for BANK_BONIFIED/BANK_NON_BONIFIED (never BROKER, which has
   * its own LTV ceiling instead) and only when a TIN was available. Always
   * describes the ORIGINALLY requested amount/LTV — even after
   * wasAutoAdjustedForViability reduces loanPrincipal below it — so the UI
   * can render a stable "here's why this was adjusted" justification
   * instead of a self-referential one computed on the already-adjusted figures.
   */
  bankViability: BankViabilityAssessment | null;
  /** True when this bank path's loanPrincipal was reduced below the requested amount because the request exceeded bankViability's LTV/DSTI limits — see bankViability.justificationReason for why. Always false for BROKER. */
  wasAutoAdjustedForViability: boolean;
  /** Only set for the BROKER path in MAX_FINANCING mode: the sustainability limit on its DSTI and whether it had to reduce the loan to respect it — see brokerStrategy.ts. */
  brokerSustainability: BrokerSustainability | null;
}

export interface SimulatorOutput {
  taxBreakdown: RegionalTaxResult;
  formalizationCosts: FormalizationCostsResult;
  bankBonified: MortgagePathResult;
  bankNonBonified: MortgagePathResult;
  broker: MortgagePathResult;
  /** Explicit, transparent broker-vs-direct-bank comparison — see pricingDifferential.ts. */
  pricingDifferential: PricingDifferentialResult;
  /** Which strategy the broker path follows for this client (max financing vs. lowest cost) and how it is structured relative to the direct bank — see brokerStrategy.ts. */
  brokerStrategy: BrokerStrategyResult;
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

  const buildPath = (channel: MortgagePathChannel, rate: RateReference, ltv: LtvResolutionResult, brokerDstiLimit: number | null = null) =>
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
      bankMaxLtv,
      brokerDstiLimit
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
  // The broker is built last: its strategy (max financing vs. lowest cost) depends on whether the direct-bank paths above were viable for this client.
  const brokerModeDecision = resolveBrokerModeDecision(bankBonified, bankNonBonified);
  const broker = buildPath(
    'BROKER',
    resolveBrokerRate(input.mortgageType, marketRates),
    resolveBrokerLtv(brokerMaxLtv, brokerModeDecision.mode, input.requestedLtvPercentage),
    brokerModeDecision.mode === 'MAX_FINANCING' ? BROKER_MAX_DSTI_RATIO : null
  );
  const pricingDifferential = computePricingDifferential(broker, bankBonified, bankNonBonified);
  const brokerStrategy = describeBrokerStrategy(brokerModeDecision, broker, bankBonified, bankNonBonified);

  return { taxBreakdown, formalizationCosts, bankBonified, bankNonBonified, broker, pricingDifferential, brokerStrategy };
}

/** Every figure that depends on the loan amount actually being financed — recomputed twice for a bank path that gets auto-adjusted (once at the requested amount, once at the viable one), and once for broker/no-adjustment paths. */
interface LoanDependentFigures {
  loanPrincipal: number;
  isFullyFinanceable: boolean;
  actualLtvPercentage: number;
  initialContributionRequired: number;
  contributionBreakdown: InitialContributionBreakdown;
  monthlyQuota: number;
  effectiveAnnualRate: number | null;
  riskAssessment: TemporalDstiAssessment;
  amortizationSchedule: AmortizationRow[];
  costOfCredit: CostOfCreditSummary;
}

function computeLoanDependentFigures(
  loanPrincipal: number,
  requiredLoanAmount: number,
  maxFinancingAmount: number,
  tin: number,
  input: SimulatorInput,
  referenceValue: number,
  netAnnualIncome: number,
  taxesAndExpenses: number,
  taxBreakdown: RegionalTaxResult,
  formalizationCosts: FormalizationCostsResult
): LoanDependentFigures {
  const numberOfPayments = input.durationYears * 12;
  const isFullyFinanceable = requiredLoanAmount <= maxFinancingAmount && requiredLoanAmount <= loanPrincipal + 0.01;
  const actualLtvPercentage = calculateLtvPercentage(loanPrincipal, referenceValue);
  const initialContributionRequired = calculateInitialContribution(input.purchaseValue, taxesAndExpenses, loanPrincipal);
  const monthlyQuota = calculateFrenchMonthlyQuota(loanPrincipal, tin, input.durationYears);
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
  const amortizationSchedule = generateAmortizationSchedule(loanPrincipal, tin, input.durationYears);
  const costOfCredit = calculateCostOfCredit(
    loanPrincipal,
    amortizationSchedule,
    taxBreakdown.totalTaxAmount,
    formalizationCosts.totalAmount
  );

  return {
    loanPrincipal,
    isFullyFinanceable,
    actualLtvPercentage,
    initialContributionRequired,
    contributionBreakdown: buildInitialContributionBreakdown(input.purchaseValue, loanPrincipal, taxBreakdown, formalizationCosts, input.availableSavings),
    monthlyQuota,
    effectiveAnnualRate,
    riskAssessment,
    amortizationSchedule,
    costOfCredit,
  };
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
  bankMaxLtvPercentage: number,
  brokerDstiLimit: number | null
): MortgagePathResult {
  const maxFinancingAmount = referenceValue * (ltv.effectiveLtvPercentage / 100);
  // Savings first cover taxes + formalization; only the rest is the down payment (see contributionBreakdown.ts) — never all of it toward a minimal LTV.
  const requiredLoanAmount = calculateRequiredLoanAmount(input.purchaseValue, input.availableSavings, taxesAndExpenses);
  const requestedLoanPrincipal = Math.min(requiredLoanAmount, maxFinancingAmount);

  if (!rate.dataAvailable || rate.tin === null) {
    return {
      channel,
      rate,
      ltv,
      maxFinancingAmount,
      requiredLoanAmount,
      loanPrincipal: requestedLoanPrincipal,
      isFullyFinanceable: requiredLoanAmount <= maxFinancingAmount,
      actualLtvPercentage: calculateLtvPercentage(requestedLoanPrincipal, referenceValue),
      initialContributionRequired: calculateInitialContribution(input.purchaseValue, taxesAndExpenses, requestedLoanPrincipal),
      contributionBreakdown: buildInitialContributionBreakdown(input.purchaseValue, requestedLoanPrincipal, taxBreakdown, formalizationCosts, input.availableSavings),
      monthlyQuota: null,
      effectiveAnnualRate: null,
      riskAssessment: null,
      amortizationSchedule: [],
      costOfCredit: null,
      bankViability: null,
      wasAutoAdjustedForViability: false,
      brokerSustainability: null,
    };
  }

  const requestedFigures = computeLoanDependentFigures(
    requestedLoanPrincipal,
    requiredLoanAmount,
    maxFinancingAmount,
    rate.tin,
    input,
    referenceValue,
    netAnnualIncome,
    taxesAndExpenses,
    taxBreakdown,
    formalizationCosts
  );

  // The broker has no bank-style viability assessment — its LTV comes from resolveBrokerLtv (max ceiling when the bank was tight, the client's own request otherwise) and its only extra limit is the sustainability cap below.
  const bankViability =
    channel === 'BROKER'
      ? null
      : assessBankViability(
          ltv.wasCapped,
          requestedFigures.riskAssessment.immediate.dstiRatio,
          input.pendingDebts,
          netAnnualIncome,
          rate.tin,
          input.durationYears,
          referenceValue,
          bankMaxLtvPercentage
        );

  // Never reject outright: when the requested amount isn't viable for a direct bank channel, the offer becomes the
  // largest amount the bank could actually grant this profile — never more than what was requested/needed, only less.
  const wasAutoAdjustedForViability = bankViability !== null && !bankViability.isViable;

  // Broker maximizing financing: it may take the client's effort above the bank's 35% rule, but never past its own
  // sustainability limit. If the maximum LTV would, the loan becomes the largest amount that keeps the effort at that limit.
  let brokerSustainability: BrokerSustainability | null = null;
  let loanCap: number | null = wasAutoAdjustedForViability ? bankViability!.maxViableLoanAmount : null;
  if (channel === 'BROKER' && brokerDstiLimit !== null) {
    const dstiBeforeLimit = requestedFigures.riskAssessment.immediate.dstiRatio;
    const wasLimited = dstiBeforeLimit > brokerDstiLimit + DSTI_COMPARISON_EPSILON;
    brokerSustainability = { dstiLimit: brokerDstiLimit, wasLimited, loanBeforeLimit: requestedLoanPrincipal, dstiBeforeLimit };
    if (wasLimited) {
      const maxQuotaWithinLimit = Math.max((netAnnualIncome / 12) * brokerDstiLimit - input.pendingDebts, 0);
      loanCap = calculateMaxLoanFromMonthlyBudget(maxQuotaWithinLimit, rate.tin, input.durationYears);
    }
  }

  const finalFigures =
    loanCap !== null
      ? computeLoanDependentFigures(
          Math.min(requestedLoanPrincipal, loanCap),
          requiredLoanAmount,
          maxFinancingAmount,
          rate.tin,
          input,
          referenceValue,
          netAnnualIncome,
          taxesAndExpenses,
          taxBreakdown,
          formalizationCosts
        )
      : requestedFigures;

  return {
    channel,
    rate,
    ltv,
    maxFinancingAmount,
    requiredLoanAmount,
    ...finalFigures,
    bankViability,
    wasAutoAdjustedForViability,
    brokerSustainability,
  };
}
