/**
 * Visual traffic-light badge for the DSTI risk profile.
 * Thresholds/classification are not duplicated here — they come straight
 * from scoreDstiRisk in /engine/scoring.ts, so the UI can never drift out
 * of sync with the underlying risk logic.
 */

import type { CSSProperties } from 'react';
import { scoreDstiRisk, type RiskColorIndicator } from '../engine/scoring';
import { COLORS } from '../styles/theme';
import { useLanguage } from '../i18n/LanguageContext';

export interface RiskBadgeProps {
  /** DSTI ratio as a decimal fraction (e.g. 0.32 for 32%). */
  dstiRatio: number;
}

const COLOR_STYLES: Record<RiskColorIndicator, CSSProperties> = {
  GREEN: {
    backgroundColor: COLORS.risk.GREEN.background,
    color: COLORS.risk.GREEN.text,
    borderColor: COLORS.risk.GREEN.border,
  },
  YELLOW: {
    backgroundColor: COLORS.risk.YELLOW.background,
    color: COLORS.risk.YELLOW.text,
    borderColor: COLORS.risk.YELLOW.border,
  },
  RED: {
    backgroundColor: COLORS.risk.RED.background,
    color: COLORS.risk.RED.text,
    borderColor: COLORS.risk.RED.border,
  },
};

const badgeBaseStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.4rem',
  padding: '0.25rem 0.75rem',
  borderRadius: '999px',
  border: '1px solid',
  fontWeight: 600,
  fontSize: '0.875rem',
  lineHeight: 1.4,
};

export function RiskBadge({ dstiRatio }: RiskBadgeProps) {
  const { t, formatters } = useLanguage();
  const { riskProfile, colorIndicator } = scoreDstiRisk(dstiRatio);
  const dstiLabel = formatters.dstiPercent.format(dstiRatio);
  const riskLabel = t.labels.riskProfile[riskProfile];

  return (
    <span
      role="status"
      aria-label={t.riskBadge.ariaLabel(riskLabel, dstiLabel)}
      style={{ ...badgeBaseStyle, ...COLOR_STYLES[colorIndicator] }}
    >
      {riskLabel} · DSTI {dstiLabel}
    </span>
  );
}
