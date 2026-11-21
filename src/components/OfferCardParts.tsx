/**
 * Shared presentational pieces for a single MortgagePathResult's offer card,
 * reused across the wizard's bank screen (Screen 4) and broker screen
 * (Screen 5): the metrics tile grid, the non-viability warning banner, and
 * the channel labels/formatters both screens need. Numbers only — all
 * figures are read straight from the already-computed engine output. Text
 * comes from the active language's Dictionary (see /i18n) via useLanguage().
 */

import type { CSSProperties, ReactNode } from 'react';
import type { MortgagePathResult, SimulatorOutput } from '../engine/simulate';
import { buildBrokerStrategyText } from '../utils/brokerStrategyText';
import type { PricingDifferentialResult } from '../engine/pricingDifferential';
import { DSTI_GREEN_THRESHOLD } from '../engine/scoring';
import { COLORS } from '../styles/theme';
import { useLanguage } from '../i18n/LanguageContext';
import type { Dictionary } from '../i18n/dictionaries/ca';
import type { Formatters } from '../i18n/formatters';

export function formatRate(path: MortgagePathResult, t: Dictionary, formatters: Formatters): string {
  if (!path.rate.dataAvailable || path.rate.tin === null) {
    return t.offerCard.notAvailable;
  }
  const tinLabel = `TIN ${formatters.percent2.format(path.rate.tin)}%`;
  const taeLabel =
    path.effectiveAnnualRate !== null
      ? ` · ${t.common.taeAbbreviation} ${formatters.percent2.format(path.effectiveAnnualRate)}%`
      : '';
  return tinLabel + taeLabel;
}

const tileGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
  gap: '0.6rem',
};

const tileStyle: CSSProperties = {
  border: `1px solid ${COLORS.border}33`,
  borderRadius: '0.65rem',
  padding: '0.7rem 0.9rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.25rem',
};

const highlightTileStyle: CSSProperties = {
  ...tileStyle,
  border: `1.5px solid ${COLORS.brand.mustard}`,
  backgroundColor: COLORS.brand.mustardTint,
};

export const tileLabelStyle: CSSProperties = {
  fontSize: '0.72rem',
  fontWeight: 600,
  color: COLORS.textSecondary,
  textTransform: 'uppercase',
  letterSpacing: '0.07em',
};

const tileValueStyle: CSSProperties = {
  fontSize: '1.15rem',
};

export function SummaryTile({ label, value, highlight }: { label: string; value: ReactNode; highlight?: boolean }) {
  return (
    <div style={highlight ? highlightTileStyle : tileStyle}>
      <span style={tileLabelStyle}>{label}</span>
      <strong style={tileValueStyle}>{value}</strong>
    </div>
  );
}

export function PathMetricsGrid({ path }: { path: MortgagePathResult }) {
  const { t, formatters } = useLanguage();

  return (
    <div style={tileGridStyle}>
      <SummaryTile label={t.offerCard.tinTaeLabel} value={formatRate(path, t, formatters)} />
      <SummaryTile
        label={t.offerCard.ltvLabel}
        value={`${formatters.percent2.format(path.actualLtvPercentage)}%${path.ltv.wasCapped ? t.offerCard.ltvCapped : ''}`}
      />
      <SummaryTile label={t.offerCard.loanAmountLabel} value={formatters.currency0.format(path.loanPrincipal)} />
      <SummaryTile
        label={t.offerCard.monthlyQuotaLabel}
        value={path.monthlyQuota !== null ? formatters.currency0.format(path.monthlyQuota) : t.offerCard.notAvailable}
        highlight
      />
      <SummaryTile
        label={t.offerCard.shortTermRiskLabel}
        value={
          path.riskAssessment
            ? `${t.labels.riskProfile[path.riskAssessment.immediate.riskProfile]} (${formatters.percent1.format(path.riskAssessment.immediate.dstiRatio * 100)}%)`
            : '—'
        }
      />
      <SummaryTile
        label={t.offerCard.totalCostLabel}
        value={path.costOfCredit ? formatters.currency0.format(path.costOfCredit.totalCostOfCredit) : '—'}
      />
    </div>
  );
}

const variableDetailStyle: CSSProperties = {
  border: `1px solid ${COLORS.brand.mustard}55`,
  borderRadius: '0.65rem',
  padding: '0.8rem 1rem',
  backgroundColor: COLORS.brand.mustardTint,
  display: 'flex',
  flexDirection: 'column',
  gap: '0.35rem',
};

const variableDetailTaeStyle: CSSProperties = {
  fontSize: '1.05rem',
  color: COLORS.textPrimary,
  margin: '0.15rem 0 0 0',
};

const variableDetailDisclaimerStyle: CSSProperties = {
  fontSize: '0.78rem',
  color: COLORS.textSecondary,
  margin: '0.2rem 0 0 0',
};

const variableDetailMetaStyle: CSSProperties = {
  fontSize: '0.8rem',
  color: COLORS.textSecondary,
  margin: 0,
};

/**
 * VARIABLE-only breakdown: the initial teaser TIN/duration, the post-initial
 * Euríbor + differential formula (for this path's own bonified/non-bonified
 * condition), an optional comparison line against the sibling channel's own
 * differential, the disclosed TAE Variable, the reference index/reset
 * cadence, and an explicit caps/floors disclosure. Renders nothing when the
 * path isn't VARIABLE or the initial-period data isn't available — never
 * fabricates a figure the market data doesn't carry: the reference-index
 * line only NAMES the index this data was already built from (see
 * marketRates.json's `euribor12MonthAverage2025`/`euribor12MonthDecember2025`
 * anchors), and the caps/floors line is an explicit "not specified in the
 * source" disclosure rather than a guessed clause — this is the SAME
 * content the PDF export renders (exportPdf.ts) for full on-screen/PDF
 * parity, sourced from these same t.offerCard.variable* dictionary keys.
 */
export function VariableRateDetail({
  path,
  siblingPath,
  numberOfHolders,
}: {
  path: MortgagePathResult;
  /** The other bank channel (bonified <-> non-bonified), to show its differential as a contrast line. Omit for the broker/standalone case. */
  siblingPath?: MortgagePathResult;
  numberOfHolders: number;
}) {
  const { t, formatters } = useLanguage();
  const rate = path.rate;
  if (!rate.dataAvailable || rate.initialPeriodTin === undefined || rate.postFixedDifferentialOverEuribor === undefined) {
    return null;
  }

  const months = rate.initialPeriodMonths ?? 12;
  const isBonified = path.channel === 'BANK_BONIFIED';
  const conditionLabel = isBonified ? t.offerCard.variableConditionMet : t.offerCard.variableConditionNotMet;
  const siblingDifferential = siblingPath?.rate.postFixedDifferentialOverEuribor;

  const disclaimer = t.offerCard.variableDisclaimer(numberOfHolders);

  return (
    <div style={variableDetailStyle}>
      <span>{t.offerCard.variableInitial(formatters.percent2.format(rate.initialPeriodTin), months)}</span>
      <span>
        {t.offerCard.variablePostInitial(formatters.percent2.format(rate.postFixedDifferentialOverEuribor), months + 1, conditionLabel)}
      </span>
      {siblingDifferential !== undefined && (
        <span>{t.offerCard.variableSiblingDifferential(formatters.percent2.format(siblingDifferential))}</span>
      )}
      {rate.tae !== null && (
        <strong style={variableDetailTaeStyle}>{t.offerCard.variableTae(formatters.percent2.format(rate.tae))}</strong>
      )}
      <p style={variableDetailMetaStyle}>{t.offerCard.variableReferenceIndexNote()}</p>
      <p style={variableDetailMetaStyle}>{t.offerCard.variableCapsFloorsNote()}</p>
      <p style={variableDetailDisclaimerStyle}>{disclaimer}</p>
    </div>
  );
}

const justificationBannerStyle: CSSProperties = {
  border: `1px solid ${COLORS.risk.YELLOW.border}`,
  borderRadius: '0.65rem',
  padding: '1rem 1.25rem',
  backgroundColor: COLORS.risk.YELLOW.background,
  color: COLORS.risk.YELLOW.text,
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
};

/**
 * Factual justification for why this bank path's offer was auto-adjusted
 * below the requested amount — see MortgagePathResult.wasAutoAdjustedForViability.
 * Built from real, already-computed figures (the path's own post-adjustment
 * LTV, and the sourced DSTI_GREEN_THRESHOLD constant), never a static/generic
 * template, so the reason always matches the specific numbers shown above it
 * in PathMetricsGrid.
 */
function buildJustificationMessage(path: MortgagePathResult, t: Dictionary, formatters: Formatters): string {
  const viability = path.bankViability;
  if (!viability) {
    return '';
  }
  const channelLabel = t.offerCard.pathLabels[path.channel];
  const adjustedLtvLabel = `${formatters.percent2.format(path.actualLtvPercentage)}%`;
  const dstiThresholdLabel = `${formatters.percent1.format(DSTI_GREEN_THRESHOLD * 100)}%`;

  if (viability.justificationReason === 'BOTH_EXCEEDED') {
    return t.offerCard.justificationBothExceeded(channelLabel, adjustedLtvLabel, dstiThresholdLabel);
  }
  if (viability.justificationReason === 'LTV_EXCEEDED') {
    return t.offerCard.justificationLtvExceeded(channelLabel, adjustedLtvLabel);
  }
  return t.offerCard.justificationDstiExceeded(channelLabel, adjustedLtvLabel, dstiThresholdLabel);
}

/**
 * Justification banner for a direct bank path whose offer was automatically
 * reduced to the largest amount the bank could actually grant this profile
 * (see MortgagePathResult.wasAutoAdjustedForViability) — the card's own
 * headline figures above already reflect that adjusted amount, so this only
 * explains *why*. Renders nothing when no adjustment was needed (or for the
 * broker channel, which has no bankViability at all).
 */
export function BankViabilityBanner({ path }: { path: MortgagePathResult }) {
  const { t, formatters } = useLanguage();
  if (!path.wasAutoAdjustedForViability) {
    return null;
  }

  return (
    <div role="status" style={justificationBannerStyle}>
      <strong>{buildJustificationMessage(path, t, formatters)}</strong>
      <p style={{ margin: 0 }}>{t.offerCard.brokerAlternativeNote}</p>
    </div>
  );
}

/** Convenience hook for screens/components that only need the channel labels (e.g. a card title or a toggle button). */
export function usePathLabels(): Record<MortgagePathResult['channel'], string> {
  const { t } = useLanguage();
  return t.offerCard.pathLabels;
}

const differentialCardStyle: CSSProperties = {
  border: `1px solid ${COLORS.border}33`,
  borderRadius: '0.75rem',
  padding: '1rem 1.2rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
};

const differentialTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: '1rem',
  color: COLORS.textPrimary,
};

const differentialBaselineStyle: CSSProperties = {
  margin: 0,
  fontSize: '0.82rem',
  color: COLORS.textSecondary,
};

const differentialRowStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  fontSize: '0.9rem',
  gap: '0.75rem',
};

const differentialNoteStyle: CSSProperties = {
  margin: 0,
  fontSize: '0.82rem',
  color: COLORS.textSecondary,
};

const strategyCardStyle: CSSProperties = {
  border: `1px solid ${COLORS.border}33`,
  borderLeft: `4px solid ${COLORS.brand.mustard}`,
  borderRadius: '0.75rem',
  padding: '1rem 1.2rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.6rem',
};

const strategyListStyle: CSSProperties = {
  margin: 0,
  paddingLeft: '1.2rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.3rem',
  fontSize: '0.88rem',
  color: COLORS.textSecondary,
};

/**
 * Explains which strategy the broker follows for this client — maximum
 * financing when the operation is tight for a direct bank, lowest cost when
 * it is viable — and how the offer is structured. All text is composed from
 * the engine's brokerStrategy output by buildBrokerStrategyText, shared with
 * the PDF so both say exactly the same thing.
 */
export function BrokerStrategyCard({ output }: { output: SimulatorOutput }) {
  const { t, formatters } = useLanguage();
  const text = buildBrokerStrategyText(output, t, formatters);

  return (
    <div style={strategyCardStyle}>
      <h4 style={differentialTitleStyle}>{text.title}</h4>
      {text.paragraphs.map((paragraph) => (
        <p key={paragraph} style={{ margin: 0, fontSize: '0.92rem', color: COLORS.textPrimary }}>
          {paragraph}
        </p>
      ))}
      <ul style={strategyListStyle}>
        {text.conditions.map((condition) => (
          <li key={condition}>{condition}</li>
        ))}
      </ul>
    </div>
  );
}

function deltaTone(delta: number | null, positiveIsBetterForBroker: boolean): 'better' | 'worse' | 'equal' | 'unknown' {
  if (delta === null) {
    return 'unknown';
  }
  if (delta === 0) {
    return 'equal';
  }
  const brokerIsBetter = positiveIsBetterForBroker ? delta > 0 : delta < 0;
  return brokerIsBetter ? 'better' : 'worse';
}

function toneColor(tone: ReturnType<typeof deltaTone>): string {
  if (tone === 'better') {
    return COLORS.brand.mustard;
  }
  if (tone === 'worse') {
    return COLORS.risk.RED.text;
  }
  return COLORS.textSecondary;
}

function DifferentialRow({
  label,
  formattedValue,
  tone,
  t,
}: {
  label: string;
  formattedValue: string;
  tone: ReturnType<typeof deltaTone>;
  t: Dictionary;
}) {
  const suffix = tone === 'better' ? t.offerCard.differential.betterSuffix : tone === 'worse' ? t.offerCard.differential.worseSuffix : tone === 'equal' ? t.offerCard.differential.equalSuffix : '';
  return (
    <div style={differentialRowStyle}>
      <span style={tileLabelStyle}>{label}</span>
      <strong style={{ color: toneColor(tone) }}>
        {formattedValue}
        {tone !== 'unknown' && <span style={{ fontWeight: 400, fontSize: '0.78rem' }}>{suffix}</span>}
      </strong>
    </div>
  );
}

/**
 * Explicit, transparent broker-vs-direct-bank pricing comparison — see
 * pricingDifferential.ts. Renders raw deltas (never a fabricated number)
 * and, when the currently available market data shows no distinguishable
 * broker advantage for this mortgage type, an honest note saying so instead
 * of implying an improvement that isn't there.
 */
export function PricingDifferentialCard({ differential }: { differential: PricingDifferentialResult }) {
  const { t, formatters } = useLanguage();
  const d = t.offerCard.differential;

  if (!differential.baselineChannel) {
    return (
      <div style={differentialCardStyle}>
        <h4 style={differentialTitleStyle}>{d.title}</h4>
        <p style={differentialNoteStyle}>{d.noBaselineNote}</p>
      </div>
    );
  }

  const formatPercentagePointDelta = (value: number) => `${value > 0 ? '+' : ''}${formatters.percent2.format(value)} p.p.`;
  const formatCurrencyDelta = (value: number) => `${value > 0 ? '+' : ''}${formatters.currency0.format(value)}`;

  return (
    <div style={differentialCardStyle}>
      <h4 style={differentialTitleStyle}>{d.title}</h4>
      <p style={differentialBaselineStyle}>{d.baselineLabel(t.offerCard.pathLabels[differential.baselineChannel])}</p>

      {differential.tinDeltaPercentagePoints !== null && (
        <DifferentialRow
          label={d.tinLabel}
          formattedValue={formatPercentagePointDelta(differential.tinDeltaPercentagePoints)}
          tone={deltaTone(differential.tinDeltaPercentagePoints, false)}
          t={t}
        />
      )}
      {differential.taeDeltaPercentagePoints !== null && (
        <DifferentialRow
          label={d.taeLabel}
          formattedValue={formatPercentagePointDelta(differential.taeDeltaPercentagePoints)}
          tone={deltaTone(differential.taeDeltaPercentagePoints, false)}
          t={t}
        />
      )}
      <DifferentialRow
        label={d.ltvLabel}
        formattedValue={formatPercentagePointDelta(differential.maxLtvDeltaPercentagePoints)}
        tone={deltaTone(differential.maxLtvDeltaPercentagePoints, true)}
        t={t}
      />
      {!differential.sameLoanAmount && (
        <DifferentialRow
          label={d.loanLabel}
          formattedValue={formatCurrencyDelta(differential.loanAmountDelta)}
          tone="unknown"
          t={t}
        />
      )}
      {differential.monthlyQuotaDelta !== null && (
        <DifferentialRow
          label={d.quotaLabel}
          formattedValue={formatCurrencyDelta(differential.monthlyQuotaDelta)}
          tone={deltaTone(differential.monthlyQuotaDelta, false)}
          t={t}
        />
      )}
      {differential.totalCostOfCreditDelta !== null && (
        <DifferentialRow
          label={d.totalCostLabel}
          formattedValue={formatCurrencyDelta(differential.totalCostOfCreditDelta)}
          tone={deltaTone(differential.totalCostOfCreditDelta, false)}
          t={t}
        />
      )}

      {!differential.sameLoanAmount && <p style={differentialNoteStyle}>{d.differentLoansNote}</p>}
      {!differential.hasMeaningfulAdvantage && <p style={differentialNoteStyle}>{d.noAdvantageNote}</p>}
    </div>
  );
}
