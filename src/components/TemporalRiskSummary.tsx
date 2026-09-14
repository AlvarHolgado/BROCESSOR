/**
 * Renders the dual/temporal DSTI profile from scoring.ts: an immediate risk
 * badge (existing debts still active) and, when relevant, a long-term one
 * (existing debts fully paid off before the mortgage ends). Text comes from
 * the active language's Dictionary (see /i18n) via useLanguage().
 */

import type { CSSProperties } from 'react';
import type { TemporalDstiAssessment } from '../engine/scoring';
import { COLORS } from '../styles/theme';
import { useLanguage } from '../i18n/LanguageContext';
import type { Dictionary } from '../i18n/dictionaries/ca';
import { RiskBadge } from './RiskBadge';

export interface TemporalRiskSummaryProps {
  assessment: TemporalDstiAssessment;
}

const containerStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
};

const rowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.6rem',
  flexWrap: 'wrap',
};

const labelStyle: CSSProperties = {
  fontSize: '0.85rem',
  color: COLORS.textSecondary,
  minWidth: '15rem',
};

const noteStyle: CSSProperties = {
  fontSize: '0.8rem',
  color: COLORS.textSecondary,
  margin: 0,
};

function formatMonthsDuration(months: number, t: Dictionary): string {
  if (months < 12) {
    return t.temporalRisk.monthsDuration(months);
  }
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  return remainingMonths === 0 ? t.temporalRisk.yearsDuration(years) : t.temporalRisk.yearsAndMonthsDuration(years, remainingMonths);
}

export function TemporalRiskSummary({ assessment }: TemporalRiskSummaryProps) {
  const { t } = useLanguage();
  const { immediate, longTerm, reachesLongTermProfile, pendingDebtsRemainingMonths } = assessment;
  const showDualProfile = pendingDebtsRemainingMonths > 0 && reachesLongTermProfile;

  if (!showDualProfile) {
    return (
      <div style={containerStyle}>
        <RiskBadge dstiRatio={immediate.dstiRatio} />
        {pendingDebtsRemainingMonths > 0 && !reachesLongTermProfile && <p style={noteStyle}>{t.temporalRisk.persistentNote}</p>}
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div style={rowStyle}>
        <span style={labelStyle}>{t.temporalRisk.shortTermLabel}</span>
        <RiskBadge dstiRatio={immediate.dstiRatio} />
      </div>
      <div style={rowStyle}>
        <span style={labelStyle}>{t.temporalRisk.longTermLabel(formatMonthsDuration(pendingDebtsRemainingMonths, t))}</span>
        <RiskBadge dstiRatio={longTerm.dstiRatio} />
      </div>
      <p style={noteStyle}>{t.temporalRisk.improvesNote}</p>
    </div>
  );
}
