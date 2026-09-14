/**
 * Full amortization schedule generation under the French system.
 * Pure function only — reuses the quota formula from mortgageEngine.ts
 * rather than recomputing it, keeping a single source of truth for the
 * French amortization math.
 */

import type { AmortizationRow } from '../types/simulator';
import { calculateFrenchMonthlyQuota } from './mortgageEngine';

/**
 * Generates the month-by-month amortization schedule for a French-system loan:
 * every row has the same total quota, split between principal and interest,
 * with the interest share shrinking and the principal share growing over time.
 *
 * @param principal Loan amount, in EUR.
 * @param annualInterestRatePercentage Nominal annual interest rate (TIN), as a percentage (e.g. 3.45).
 * @param termYears Loan duration, in years.
 */
export function generateAmortizationSchedule(
  principal: number,
  annualInterestRatePercentage: number,
  termYears: number
): AmortizationRow[] {
  const numberOfPayments = termYears * 12;
  if (numberOfPayments <= 0 || principal <= 0) {
    return [];
  }

  const monthlyRate = annualInterestRatePercentage / 100 / 12;
  const monthlyQuota = calculateFrenchMonthlyQuota(principal, annualInterestRatePercentage, termYears);

  const schedule: AmortizationRow[] = [];
  let remainingBalance = principal;

  for (let monthNumber = 1; monthNumber <= numberOfPayments; monthNumber++) {
    const interestPaid = remainingBalance * monthlyRate;
    const isLastPayment = monthNumber === numberOfPayments;
    const principalPaid = isLastPayment ? remainingBalance : monthlyQuota - interestPaid;

    remainingBalance = isLastPayment ? 0 : remainingBalance - principalPaid;

    schedule.push({
      monthNumber,
      principalPaid,
      interestPaid,
      remainingBalance,
    });
  }

  return schedule;
}

/** One year of an amortization schedule, aggregated from its 12 monthly rows. */
export interface YearlyAmortizationRow {
  /** 1-indexed year of the loan term. */
  year: number;
  /** Sum of principalPaid across the year's 12 months. */
  principalPaid: number;
  /** Sum of interestPaid across the year's 12 months. */
  interestPaid: number;
  /** remainingBalance at the year's final month. */
  remainingBalance: number;
}

/**
 * Groups a monthly amortization schedule into yearly rows, for a more
 * readable year-by-year view of the same underlying data.
 */
export function aggregateAmortizationByYear(schedule: AmortizationRow[]): YearlyAmortizationRow[] {
  const yearlyRows: YearlyAmortizationRow[] = [];

  for (let startIndex = 0; startIndex < schedule.length; startIndex += 12) {
    const monthsInYear = schedule.slice(startIndex, startIndex + 12);
    const principalPaid = monthsInYear.reduce((sum, row) => sum + row.principalPaid, 0);
    const interestPaid = monthsInYear.reduce((sum, row) => sum + row.interestPaid, 0);
    const remainingBalance = monthsInYear[monthsInYear.length - 1].remainingBalance;

    yearlyRows.push({
      year: yearlyRows.length + 1,
      principalPaid,
      interestPaid,
      remainingBalance,
    });
  }

  return yearlyRows;
}
