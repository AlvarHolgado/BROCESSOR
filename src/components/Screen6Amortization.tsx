/**
 * SCREEN 6 of the wizard: full amortization schedule for a chosen path
 * (bank-bonified / bank-non-bonified / broker), with the monthly
 * principal-vs-interest-vs-remaining-balance breakdown, plus that path's
 * temporal DSTI risk summary. Text comes from the active language's
 * Dictionary (see /i18n) via useLanguage().
 */

import type { CSSProperties } from 'react';
import type { MortgagePathResult, SimulatorOutput } from '../engine/simulate';
import { COLORS } from '../styles/theme';
import { useLanguage } from '../i18n/LanguageContext';
import { AmortizationChart } from './AmortizationChart';
import { AmortizationTable } from './AmortizationTable';
import { usePathLabels } from './OfferCardParts';
import { TemporalRiskSummary } from './TemporalRiskSummary';

export interface Screen6AmortizationProps {
  output: SimulatorOutput;
  numberOfHolders: number;
  selectedChannel: MortgagePathResult['channel'];
  onSelectChannel: (channel: MortgagePathResult['channel']) => void;
}

const introStyle: CSSProperties = {
  color: COLORS.textSecondary,
  fontSize: '0.95rem',
  margin: '0 0 1.25rem 0',
};

const toggleGroupStyle: CSSProperties = {
  display: 'flex',
  gap: '0.6rem',
  flexWrap: 'wrap',
  marginBottom: '1.5rem',
};

// Visual treatment (glossy gradient / translucent outline, gold border/glow)
// comes from the shared .btn-pill (active)/.btn-pill-outline (inactive)
// classes in global.css — see toggleButtonClassName below.
const toggleButtonStyle: CSSProperties = {
  padding: '0.55rem 1.1rem',
  fontWeight: 700,
};

function toggleButtonClassName(active: boolean): string {
  return active ? 'btn-pill' : 'btn-pill-outline';
}

const noteStyle: CSSProperties = {
  color: COLORS.textSecondary,
  fontSize: '0.85rem',
  margin: 0,
};

export function Screen6Amortization({ output, numberOfHolders, selectedChannel, onSelectChannel }: Screen6AmortizationProps) {
  const { t } = useLanguage();
  const pathLabels = usePathLabels();
  const paths: MortgagePathResult[] = [output.bankBonified, output.bankNonBonified, output.broker];
  const selectedPath = paths.find((path) => path.channel === selectedChannel) ?? paths[0];

  const introText = t.screen6.intro(numberOfHolders);

  return (
    <div>
      <p style={introStyle}>{introText}</p>

      <div role="group" aria-label={t.screen6.selectorAriaLabel} style={toggleGroupStyle}>
        {paths.map((path) => (
          <button
            key={path.channel}
            type="button"
            className={toggleButtonClassName(path.channel === selectedChannel)}
            style={toggleButtonStyle}
            onClick={() => onSelectChannel(path.channel)}
          >
            {pathLabels[path.channel]}
          </button>
        ))}
      </div>

      {selectedPath.monthlyQuota !== null && selectedPath.riskAssessment ? (
        <>
          <TemporalRiskSummary assessment={selectedPath.riskAssessment} />
          <AmortizationChart schedule={selectedPath.amortizationSchedule} />
          <AmortizationTable schedule={selectedPath.amortizationSchedule} />
        </>
      ) : (
        <p role="alert" style={noteStyle}>
          {t.screen6.noAmortizationData}
        </p>
      )}
    </div>
  );
}
