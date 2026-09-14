/**
 * Core data contracts for the BROSSESSOR mortgage simulator.
 * Covers the full 8-screen wizard: user profile, property details,
 * bank vs. broker offer comparison, viability analysis and amortization.
 *
 * These are pure type definitions only. No calculations live here —
 * see /engine for the pure functions that operate on these shapes.
 */

// ============================================================
// SCREEN 1: User Profile & Financial Situation
// ============================================================

/** Employment classification, collected per holder — used for income stability / risk weighting. */
export type EmploymentType = 'INDEFINITE' | 'TEMPORARY' | 'SELF_EMPLOYED' | 'STATE_OFFICIAL' | 'RETIRED' | 'UNEMPLOYED' | 'OTHER';

/** Highest number of mortgage holders (titulars) the wizard supports collecting individual income for. */
export const MAX_MORTGAGE_HOLDERS = 4;

export interface UserProfile {
  /** Number of mortgage holders (titulars) — 1, 2, or more, up to MAX_MORTGAGE_HOLDERS. */
  numberOfHolders: number;
  /** Full name per holder, in the same order as the other per-holder arrays below — length always equals numberOfHolders. */
  holderNames: string[];
  /** Age per holder, in the same order as holderNames — length always equals numberOfHolders. */
  holderAges: number[];
  /** Employment status per holder, in the same order as holderNames — length always equals numberOfHolders. */
  employmentTypes: EmploymentType[];
  /** Free-text explanation per holder, only meaningful when the matching employmentTypes entry is 'OTHER' — '' otherwise. Length always equals numberOfHolders. */
  employmentOtherDetails: string[];
  /** Net monthly income per holder, in EUR — length always equals numberOfHolders. Summed into household net monthly income for DSTI/risk evaluation; see /engine/simulate.ts. */
  monthlyNetIncomes: number[];
  /** Sum of all recurring monthly debt obligations (loans, cards, alimony), in EUR. */
  pendingDebts: number;
  /** Months remaining until pendingDebts are fully paid off. Only meaningful when pendingDebts > 0; 0 otherwise — see /engine/scoring.ts assessTemporalMortgageRisk. */
  pendingDebtsRemainingMonths: number;
  /** Total liquid savings available for down payment and costs, in EUR. */
  availableSavings: number;
}

// ============================================================
// SCREEN 2-3: Property Details
// ============================================================

export type PropertyType = 'NEW_BUILD' | 'SECOND_HAND';

/** Whether the property being financed will be the buyer's primary home or a second residence. Collected for profile/PDF context only — no sourced LTV/rate differential by usage exists yet, see /engine/ltvResolver.ts. */
export type PropertyUsage = 'HABITUAL' | 'SECOND_HOME';

export type MortgageType = 'FIXED' | 'VARIABLE' | 'MIXED';

export interface PropertyDetails {
  propertyType: PropertyType;
  propertyUsage: PropertyUsage;
  /** CCAA identifier code, matched against mortgageData.json ccaaTaxRates[].code — see CcaaTaxRate in ./ccaaTax. */
  ccaa: string;
  /** Bank/official appraisal (tasación) value of the property, in EUR. */
  appraisalValue: number;
  /** Agreed purchase price of the property, in EUR. */
  purchaseValue: number;
  mortgageType: MortgageType;
  durationYears: number;
}

// ============================================================
// FASE 3: Standalone quick-simulator input (Screens 1-3, single offer)
// ============================================================

/**
 * Flattened input for the standalone quick simulator, distinct from the
 * multi-offer wizard state below: combines the user's financial profile
 * and the property being financed. TIN/TAE are no longer user input — see
 * /engine/marketTinResolver.ts, which derives bank-bonified,
 * bank-non-bonified and broker rates from market reference data and
 * produces a three-way comparison (/engine/simulate.ts).
 */
export interface SimulatorInput extends UserProfile, PropertyDetails {
  /** Desired loan-to-value for the BANK channel, as a percentage (e.g. 80) — evaluated against the bank's max and auto-capped if not viable. The broker channel always uses its own maximum achievable LTV instead. */
  requestedLtvPercentage: number;
}

// ============================================================
// Shared rate primitives
// ============================================================

/** A single set of interest/payment conditions for a mortgage offer. */
export interface RateConditions {
  /** Tipus d'Interès Nominal — nominal interest rate, as a percentage (e.g. 3.45). */
  tin: number;
  /** Taxa Anual Equivalent — annual equivalent rate, as a percentage (e.g. 3.78). */
  tae: number;
  /** Recurring monthly installment (quota mensual), in EUR. */
  monthlyQuota: number;
}

export type RiskProfile = 'LOW' | 'MEDIUM' | 'HIGH';

// ============================================================
// SCREEN 4-5: Bank Offer
// ============================================================

/** Bonified rate conditions, contingent on hiring linked products (payroll, insurance, etc.). */
export interface BonifiedRateConditions extends RateConditions {
  /** Products the borrower must contract to unlock the bonified rate (e.g. "Assegurança de vida"). */
  linkedProducts: string[];
}

export interface BankOffer {
  bankName: string;
  bonifiedRates: BonifiedRateConditions;
  nonBonifiedRates: RateConditions;
  /** Maximum loan-to-value the bank will finance, as a percentage of appraisal/purchase value. */
  maxLtvPercentage: number;
  riskProfile: RiskProfile;
}

// ============================================================
// SCREEN 5-6: Broker Offer
// ============================================================

export interface AdditionalCosts {
  /** Taxes payable as part of closing the operation (ITP/AJD, notary tax portion), in EUR. */
  taxes: number;
  /** Non-tax closing expenses (notary, registry, appraisal, agency), in EUR. */
  expenses: number;
}

export interface BrokerOffer {
  brokerName: string;
  negotiatedRates: RateConditions;
  /** Fee charged by the broker for the negotiated operation, in EUR. */
  brokerFees: number;
  additionalCosts: AdditionalCosts;
  maxLtvPercentage: number;
}

// ============================================================
// SCREEN 7: Amortization
// ============================================================

/** Single row of a French-system (or applicable) amortization schedule. */
export interface AmortizationRow {
  monthNumber: number;
  principalPaid: number;
  interestPaid: number;
  remainingBalance: number;
}

// ============================================================
// SCREEN 6-7: Viability & Comparison (computed by /engine)
// ============================================================

/** Debt Service to Income assessment for a candidate offer. */
export interface ViabilityAssessment {
  /** Debt Service to Income ratio, as a percentage of net annual income. */
  dstiRatio: number;
  isViable: boolean;
  /** Maximum monthly quota recommended given the user's income and existing debts, in EUR. */
  maxRecommendedQuota: number;
}

export type RecommendedOption = 'BANK' | 'BROKER';

/** Head-to-head comparison result between a bank offer and a broker offer. */
export interface OfferComparisonResult {
  bankOffer: BankOffer;
  brokerOffer: BrokerOffer;
  /** Total cost of credit over the full duration for the bank offer, in EUR. */
  bankTotalCost: number;
  /** Total cost of credit over the full duration for the broker offer, in EUR. */
  brokerTotalCost: number;
  recommendedOption: RecommendedOption;
  /** Absolute savings of the recommended option over the alternative, in EUR. */
  savingsAmount: number;
}

// ============================================================
// SCREEN 8 / Wizard orchestration state
// ============================================================

export type WizardStep = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

/**
 * Full state of the simulation wizard across all 8 screens.
 * Input slices (screens 1-5) are partial until the user completes each step.
 * Derived slices (screens 6-8) are null until computed by /engine.
 */
export interface SimulationWizardState {
  currentStep: WizardStep;
  completedSteps: WizardStep[];

  /** Screen 1: identity and financial profile. */
  userProfile: Partial<UserProfile>;

  /** Screen 2-3: property being financed. */
  propertyDetails: Partial<PropertyDetails>;

  /** Screen 4: bank offer(s) under evaluation. */
  bankOffers: BankOffer[];

  /** Screen 5: broker offer(s) under evaluation. */
  brokerOffers: BrokerOffer[];

  /** Screen 6: DSTI / affordability analysis, computed by /engine. */
  viabilityAssessment: ViabilityAssessment | null;

  /** Screen 7: bank vs. broker comparison result, computed by /engine. */
  comparisonResult: OfferComparisonResult | null;

  /** Screen 8: amortization schedule for the selected offer, computed by /engine. */
  amortizationSchedule: AmortizationRow[];

  isComplete: boolean;
}
