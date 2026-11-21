/**
 * Structured, read-only summary of what the simulation has so far, shown
 * beside the conversation (full-screen chat) or as a collapsible block (small
 * chat): the data the user has entered, grouped by topic, and — once the form
 * validates — one line per offer with loan, LTV and monthly quota. Purely
 * presentational: it reads the same shared form `values` and the already
 * computed SimulatorOutput as the rest of the app, and uses the chat's own
 * original colour palette. Text comes from the active Dictionary.
 */

import type { CSSProperties } from 'react';
import type { SimulatorFormState } from '../hooks/useSimulator';
import type { SimulatorOutput } from '../engine/simulate';
import { COLORS } from '../styles/theme';
import { useLanguage } from '../i18n/LanguageContext';

export interface ChatSummaryProps {
  values: SimulatorFormState;
  output: SimulatorOutput | null;
  ccaaName: string;
}

interface SummaryRow {
  label: string;
  value: string;
}

interface SummarySection {
  heading: string;
  rows: SummaryRow[];
}

const sectionStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.35rem',
  paddingBottom: '0.9rem',
  marginBottom: '0.9rem',
  borderBottom: `1px solid ${COLORS.hero.subtitleText}22`,
};

const headingStyle: CSSProperties = {
  margin: 0,
  color: COLORS.hero.subtitleText,
  fontSize: '0.72rem',
  fontWeight: 700,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
};

const rowStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'baseline',
  gap: '0.75rem',
  fontSize: '0.85rem',
};

const labelStyle: CSSProperties = { color: COLORS.hero.subtitleText };

const valueStyle: CSSProperties = { color: '#FFFFFF', fontWeight: 600, textAlign: 'right' };

function parseNumber(raw: string | undefined): number | null {
  if (raw === undefined || raw.trim() === '') {
    return null;
  }
  const parsed = Number(raw.replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : null;
}

export function ChatSummary({ values, output, ccaaName }: ChatSummaryProps) {
  const { t, formatters } = useLanguage();
  const s = t.chat.summary;
  const money = (raw: string | undefined) => {
    const parsed = parseNumber(raw);
    return parsed === null ? null : formatters.currency0.format(parsed);
  };

  const sections: SummarySection[] = [];

  const holderRows: SummaryRow[] = [];
  const holderCount = Math.max(values.holderNames.length, values.holderAges.length, values.monthlyNetIncomes.length, values.employmentTypes.length);
  for (let index = 0; index < holderCount; index++) {
    const name = values.holderNames[index]?.trim() ?? '';
    const age = parseNumber(values.holderAges[index]);
    const employmentRaw = values.employmentTypes[index] ?? '';
    const employment = employmentRaw ? (t.labels.employmentType as Record<string, string>)[employmentRaw] ?? employmentRaw : '';
    const income = money(values.monthlyNetIncomes[index]);
    const details = [age !== null ? t.screen2.ageHint(age) : '', employment, income ? `${income}${s.perMonth}` : ''].filter(Boolean);
    if (name || details.length > 0) {
      holderRows.push({ label: name || t.screen2.holderFallbackLabel(index), value: details.join(' · ') });
    }
  }
  if (holderRows.length > 0) {
    sections.push({ heading: s.holdersHeading, rows: holderRows });
  }

  const economyRows: SummaryRow[] = [];
  const debts = money(values.pendingDebts);
  if (debts) {
    const months = parseNumber(values.pendingDebtsRemainingMonths);
    economyRows.push({ label: s.debtsLabel, value: `${debts}${s.perMonth}${months ? ` · ${t.screen2.monthsHint(months)}` : ''}` });
  }
  const savings = money(values.availableSavings);
  if (savings) {
    economyRows.push({ label: s.savingsLabel, value: savings });
  }
  if (economyRows.length > 0) {
    sections.push({ heading: s.economyHeading, rows: economyRows });
  }

  const propertyRows: SummaryRow[] = [];
  const price = money(values.purchaseValue);
  if (price) {
    propertyRows.push({ label: s.priceLabel, value: price });
  }
  const appraisal = money(values.appraisalValue);
  if (appraisal) {
    propertyRows.push({ label: s.appraisalLabel, value: appraisal });
  }
  if (values.propertyType) {
    propertyRows.push({ label: s.typeLabel, value: (t.labels.propertyType as Record<string, string>)[values.propertyType] ?? values.propertyType });
  }
  if (values.propertyUsage) {
    propertyRows.push({ label: s.usageLabel, value: (t.labels.propertyUsage as Record<string, string>)[values.propertyUsage] ?? values.propertyUsage });
  }
  if (values.ccaa && ccaaName) {
    propertyRows.push({ label: s.ccaaLabel, value: ccaaName });
  }
  if (propertyRows.length > 0) {
    sections.push({ heading: s.propertyHeading, rows: propertyRows });
  }

  const financingRows: SummaryRow[] = [];
  const ltv = parseNumber(values.requestedLtvPercentage);
  if (ltv !== null) {
    financingRows.push({ label: s.requestedLtvLabel, value: `${formatters.percent1.format(ltv)}%` });
  }
  const years = parseNumber(values.durationYears);
  if (years !== null) {
    financingRows.push({ label: s.termLabel, value: t.screen3.durationHint(years) });
  }
  if (values.mortgageType) {
    financingRows.push({ label: s.mortgageTypeLabel, value: (t.labels.mortgageType as Record<string, string>)[values.mortgageType] ?? values.mortgageType });
  }
  if (financingRows.length > 0) {
    sections.push({ heading: s.financingHeading, rows: financingRows });
  }

  if (output) {
    const paths = [output.bankBonified, output.bankNonBonified, output.broker];
    sections.push({
      heading: s.resultsHeading,
      rows: paths.map((path) => ({
        label: t.offerCard.pathLabels[path.channel],
        value: [
          formatters.currency0.format(path.loanPrincipal),
          `${formatters.percent2.format(path.actualLtvPercentage)}% ${t.offerCard.ltvLabel}`,
          path.monthlyQuota !== null ? `${formatters.currency0.format(path.monthlyQuota)}${s.perMonth}` : t.offerCard.notAvailable,
        ].join(' · '),
      })),
    });
  }

  return (
    <div>
      <h3 style={{ margin: '0 0 1rem 0', color: '#FFFFFF', fontSize: '0.95rem' }}>{s.title}</h3>
      {sections.length === 0 ? (
        <p style={{ ...labelStyle, fontSize: '0.85rem', margin: 0 }}>{s.empty}</p>
      ) : (
        sections.map((section, sectionIndex) => (
          <section key={section.heading} style={sectionIndex === sections.length - 1 ? { ...sectionStyle, borderBottom: 'none', marginBottom: 0 } : sectionStyle}>
            <h4 style={headingStyle}>{section.heading}</h4>
            {section.rows.map((row) => (
              <div key={`${section.heading}-${row.label}`} style={rowStyle}>
                <span style={labelStyle}>{row.label}</span>
                <span style={valueStyle}>{row.value}</span>
              </div>
            ))}
          </section>
        ))
      )}
    </div>
  );
}
