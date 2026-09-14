/**
 * Paginated, year-filterable display of an amortization schedule, with a
 * toggle between the raw monthly rows and a yearly roll-up (aggregation
 * logic lives in /engine/amortization.ts, kept pure and unit-tested there).
 */

import { useMemo, useState, type CSSProperties } from 'react';
import { aggregateAmortizationByYear } from '../engine/amortization';
import { COLORS } from '../styles/theme';
import type { AmortizationRow } from '../types/simulator';
import { blurNumberInputOnWheel } from '../utils/domEvents';
import { useLanguage } from '../i18n/LanguageContext';
import type { Dictionary } from '../i18n/dictionaries/ca';

export interface AmortizationTableProps {
  schedule: AmortizationRow[];
}

type ViewMode = 'MONTHLY' | 'YEARLY';

interface DisplayRow {
  key: number;
  periodLabel: string;
  year: number;
  principalPaid: number;
  interestPaid: number;
  remainingBalance: number;
}

const PAGE_SIZE = 12;

const containerStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.75rem',
};

const controlsRowStyle: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: '1rem',
};

// Visual treatment comes from the shared .btn-pill (active)/.btn-pill-outline
// (inactive) classes in global.css.
const toggleButtonStyle: CSSProperties = {
  padding: '0.4rem 0.9rem',
};

function toggleButtonClassName(active: boolean): string {
  return active ? 'btn-pill' : 'btn-pill-outline';
}

const yearInputStyle: CSSProperties = {
  width: '4.5rem',
  padding: '0.3rem 0.5rem',
  borderRadius: '0.375rem',
  border: `1px solid ${COLORS.border}`,
  backgroundColor: COLORS.surface,
  color: COLORS.textPrimary,
};

const labelStyle: CSSProperties = {
  fontSize: '0.85rem',
  color: COLORS.textSecondary,
  display: 'flex',
  alignItems: 'center',
  gap: '0.4rem',
};

const tableWrapperStyle: CSSProperties = {
  overflowX: 'auto',
};

const tableStyle: CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: '0.9rem',
};

const thStyle: CSSProperties = {
  textAlign: 'right',
  padding: '0.5rem 0.75rem',
  borderBottom: `1px solid ${COLORS.border}`,
  color: COLORS.textPrimary,
};

const thFirstStyle: CSSProperties = { ...thStyle, textAlign: 'left' };

const tdStyle: CSSProperties = {
  textAlign: 'right',
  padding: '0.4rem 0.75rem',
  borderBottom: `1px solid ${COLORS.surface}`,
};

const tdFirstStyle: CSSProperties = { ...tdStyle, textAlign: 'left' };

const paginationRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '1rem',
};

// Visual treatment comes from the shared .btn-pill-outline class in global.css.
const pageButtonStyle: CSSProperties = {
  padding: '0.35rem 0.9rem',
};

function toDisplayRows(schedule: AmortizationRow[], viewMode: ViewMode, t: Dictionary): DisplayRow[] {
  if (viewMode === 'YEARLY') {
    return aggregateAmortizationByYear(schedule).map((row) => ({
      key: row.year,
      periodLabel: t.amortizationTable.yearPeriodLabel(row.year),
      year: row.year,
      principalPaid: row.principalPaid,
      interestPaid: row.interestPaid,
      remainingBalance: row.remainingBalance,
    }));
  }

  return schedule.map((row) => ({
    key: row.monthNumber,
    periodLabel: t.amortizationTable.monthPeriodLabel(row.monthNumber),
    year: Math.ceil(row.monthNumber / 12),
    principalPaid: row.principalPaid,
    interestPaid: row.interestPaid,
    remainingBalance: row.remainingBalance,
  }));
}

export function AmortizationTable({ schedule }: AmortizationTableProps) {
  const { t, formatters } = useLanguage();
  const [viewMode, setViewMode] = useState<ViewMode>('YEARLY');
  const [yearFrom, setYearFrom] = useState('');
  const [yearTo, setYearTo] = useState('');
  const [page, setPage] = useState(0);

  const totalYears = Math.ceil(schedule.length / 12);

  const displayRows = useMemo(() => toDisplayRows(schedule, viewMode, t), [schedule, viewMode, t]);

  const filteredRows = useMemo(() => {
    const from = yearFrom === '' ? null : Number(yearFrom);
    const to = yearTo === '' ? null : Number(yearTo);
    return displayRows.filter((row) => {
      if (from !== null && row.year < from) return false;
      if (to !== null && row.year > to) return false;
      return true;
    });
  }, [displayRows, yearFrom, yearTo]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages - 1);
  const pageRows = filteredRows.slice(currentPage * PAGE_SIZE, currentPage * PAGE_SIZE + PAGE_SIZE);

  const changeViewMode = (mode: ViewMode) => {
    setViewMode(mode);
    setPage(0);
  };

  const changeYearFilter = (setter: (value: string) => void) => (value: string) => {
    setter(value);
    setPage(0);
  };

  return (
    <section aria-labelledby="amortization-table-heading" style={containerStyle}>
      <h3 id="amortization-table-heading">{t.amortizationTable.heading}</h3>

      <div style={controlsRowStyle}>
        <div role="group" aria-label={t.amortizationTable.viewGroupAriaLabel}>
          <button
            type="button"
            className={toggleButtonClassName(viewMode === 'YEARLY')}
            style={toggleButtonStyle}
            onClick={() => changeViewMode('YEARLY')}
          >
            {t.amortizationTable.yearly}
          </button>{' '}
          <button
            type="button"
            className={toggleButtonClassName(viewMode === 'MONTHLY')}
            style={toggleButtonStyle}
            onClick={() => changeViewMode('MONTHLY')}
          >
            {t.amortizationTable.monthly}
          </button>
        </div>

        <label style={labelStyle}>
          {t.amortizationTable.fromYear}
          <input
            type="number"
            min={1}
            max={totalYears}
            style={yearInputStyle}
            value={yearFrom}
            onChange={(event) => changeYearFilter(setYearFrom)(event.target.value)}
            onWheel={blurNumberInputOnWheel}
          />
        </label>

        <label style={labelStyle}>
          {t.amortizationTable.toYear}
          <input
            type="number"
            min={1}
            max={totalYears}
            style={yearInputStyle}
            value={yearTo}
            onChange={(event) => changeYearFilter(setYearTo)(event.target.value)}
            onWheel={blurNumberInputOnWheel}
          />
        </label>
      </div>

      <div style={tableWrapperStyle}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thFirstStyle}>{t.amortizationTable.periodHeader}</th>
              <th style={thStyle}>{t.amortizationTable.principalHeader}</th>
              <th style={thStyle}>{t.amortizationTable.interestHeader}</th>
              <th style={thStyle}>{t.amortizationTable.balanceHeader}</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row) => (
              <tr key={row.key}>
                <td style={tdFirstStyle}>{row.periodLabel}</td>
                <td style={tdStyle}>{formatters.currency0.format(row.principalPaid)}</td>
                <td style={tdStyle}>{formatters.currency0.format(row.interestPaid)}</td>
                <td style={tdStyle}>{formatters.currency0.format(row.remainingBalance)}</td>
              </tr>
            ))}
            {pageRows.length === 0 && (
              <tr>
                <td style={tdFirstStyle} colSpan={4}>
                  {t.amortizationTable.noRowsMatch}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div style={paginationRowStyle}>
        <button
          type="button"
          className="btn-pill-outline"
          style={pageButtonStyle}
          onClick={() => setPage((previous) => Math.max(previous - 1, 0))}
          disabled={currentPage === 0}
        >
          {t.amortizationTable.previous}
        </button>
        <span style={labelStyle}>{t.amortizationTable.pageLabel(currentPage + 1, totalPages)}</span>
        <button
          type="button"
          className="btn-pill-outline"
          style={pageButtonStyle}
          onClick={() => setPage((previous) => Math.min(previous + 1, totalPages - 1))}
          disabled={currentPage >= totalPages - 1}
        >
          {t.amortizationTable.next}
        </button>
      </div>
    </section>
  );
}
