/**
 * Unified initial-contribution card for a single mortgage path: itemizes
 * own capital, regional taxes (ITP/AJD) and formalization costs (notary,
 * registry, gestoria) as one connected breakdown instead of separate,
 * disconnected tables. All figures are read straight from the already
 * computed RegionalTaxResult / FormalizationCostsResult / MortgagePathResult
 * — purely presentational, per .clauderules Rule 3. Text comes from the
 * active language's Dictionary (see /i18n) via useLanguage().
 */

import type { CSSProperties } from 'react';
import type { RegionalTaxResult } from '../engine/mortgageEngine';
import type { MortgagePathResult } from '../engine/simulate';
import type { SimulatorInput } from '../types/simulator';
import { COLORS } from '../styles/theme';
import { useLanguage } from '../i18n/LanguageContext';
import { buildSavingsAllocationLines } from '../utils/savingsAllocationText';

export interface InitialContributionCardProps {
  input: SimulatorInput;
  path: MortgagePathResult;
  taxBreakdown: RegionalTaxResult;
}

const cardStyle: CSSProperties = {
  border: `1px solid ${COLORS.border}`,
  borderRadius: '0.5rem',
  padding: '0.9rem 1.1rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.2rem',
};

const titleStyle: CSSProperties = {
  margin: '0 0 0.4rem 0',
  fontSize: '1rem',
};

const rowStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: '1rem',
  padding: '0.35rem 0',
};

const noteStyle: CSSProperties = {
  color: COLORS.textSecondary,
  fontSize: '0.8rem',
  margin: '0 0 0.3rem 0',
};

const totalRowStyle: CSSProperties = {
  ...rowStyle,
  fontWeight: 700,
  borderTop: `1px solid ${COLORS.border}`,
  marginTop: '0.3rem',
  paddingTop: '0.6rem',
};

const allocationBlockStyle: CSSProperties = {
  borderTop: `1px dashed ${COLORS.border}`,
  marginTop: '0.6rem',
  paddingTop: '0.6rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.1rem',
};

const allocationTitleStyle: CSSProperties = {
  margin: '0 0 0.2rem 0',
  fontSize: '0.9rem',
};

const allocationRowStyle: CSSProperties = {
  ...rowStyle,
  padding: '0.2rem 0',
  fontSize: '0.88rem',
};

const warningStyle: CSSProperties = {
  color: COLORS.risk.YELLOW.text,
  fontStyle: 'italic',
};

export function InitialContributionCard({ input, path, taxBreakdown }: InitialContributionCardProps) {
  const { t, formatters } = useLanguage();
  // Every euro figure below comes from the engine's whole-euro breakdown, whose total is the sum of these very lines.
  const breakdown = path.contributionBreakdown;

  // AJD only applies to NEW_BUILD purchases (ITP applies to SECOND_HAND
  // instead — the two are mutually exclusive per propertyType), so this can
  // only be true when the property is NEW_BUILD and the CCAA's ajdPercentage
  // hasn't been sourced yet (e.g. Catalunya, and 16 of the other 18
  // CCAA — see MISSING_DATA_REPORT.md). In that case `taxBreakdown.totalTaxAmount`
  // is really "0 known + 1 unknown", not a confirmed zero: rendering it as a
  // plain currency amount would silently claim a tax bill of exactly 0 €,
  // which is factually wrong. Show "not available" instead, matching how
  // the rest of the app already discloses missing data rather than
  // defaulting it to zero.
  const ajdDataMissing = taxBreakdown.ajd.applicable && !taxBreakdown.ajd.dataAvailable;

  return (
    <div style={cardStyle}>
      <h4 style={titleStyle}>{t.initialContribution.title}</h4>

      <div style={rowStyle}>
        <span>{t.initialContribution.ownCapitalLabel}</span>
        <strong>{formatters.currency0.format(breakdown.ownCapital)}</strong>
      </div>
      <p style={noteStyle}>
        {t.initialContribution.ownCapitalNote(
          formatters.currency0.format(input.purchaseValue),
          formatters.currency0.format(path.loanPrincipal)
        )}
      </p>

      <div style={rowStyle}>
        <span>{t.initialContribution.taxesLabel}</span>
        <strong>{ajdDataMissing ? t.offerCard.notAvailable : formatters.currency0.format(breakdown.taxes)}</strong>
      </div>
      {taxBreakdown.itp.applicable && (
        <p style={noteStyle}>
          {t.initialContribution.itpLine(
            taxBreakdown.itp.usedProgressiveBrackets
              ? t.initialContribution.itpProgressive
              : `${formatters.percent2.format(taxBreakdown.itp.ratePercentage ?? 0)}%`,
            formatters.currency0.format(taxBreakdown.itp.amount)
          )}
        </p>
      )}
      {taxBreakdown.ajd.applicable && (
        <p style={taxBreakdown.ajd.dataAvailable ? noteStyle : { ...noteStyle, ...warningStyle }}>
          {taxBreakdown.ajd.dataAvailable
            ? t.initialContribution.ajdLine(
                `${formatters.percent2.format(taxBreakdown.ajd.ratePercentage ?? 0)}%`,
                formatters.currency0.format(taxBreakdown.ajd.amount)
              )
            : t.initialContribution.ajdUnavailable}
        </p>
      )}
      {!taxBreakdown.itp.applicable && !taxBreakdown.ajd.applicable && <p style={noteStyle}>{t.initialContribution.noTaxesApplicable}</p>}

      <div style={rowStyle}>
        <span>{t.initialContribution.formalizationLabel}</span>
        <strong>{formatters.currency0.format(breakdown.formalization)}</strong>
      </div>
      <p style={noteStyle}>
        {t.initialContribution.formalizationNote(
          formatters.currency0.format(breakdown.notary),
          formatters.currency0.format(breakdown.registry)
        )}
      </p>

      <div style={totalRowStyle}>
        <span>{t.initialContribution.totalLabel}</span>
        <strong>{formatters.currency0.format(breakdown.total)}</strong>
      </div>
      {ajdDataMissing && (
        <p role="alert" style={{ ...noteStyle, ...warningStyle, margin: '0.3rem 0 0 0' }}>
          {t.initialContribution.totalExcludesUnavailableTax}
        </p>
      )}

      <div style={allocationBlockStyle} aria-label={t.savingsAllocation.title}>
        <h5 style={allocationTitleStyle}>{t.savingsAllocation.title}</h5>
        {buildSavingsAllocationLines(path, t, formatters).map((line) => (
          <div key={line.label} style={allocationRowStyle}>
            <span>{line.label}</span>
            <strong style={line.tone === 'warning' ? { color: COLORS.risk.YELLOW.text } : undefined}>{line.value}</strong>
          </div>
        ))}
        <p style={{ ...noteStyle, margin: '0.3rem 0 0 0' }}>{t.savingsAllocation.note}</p>
      </div>

      {!path.isFullyFinanceable && (
        <p role="alert" style={{ color: COLORS.error, fontSize: '0.85rem', margin: '0.3rem 0 0 0' }}>
          {t.initialContribution.notFullyFinanceableWarning}
        </p>
      )}
    </div>
  );
}
