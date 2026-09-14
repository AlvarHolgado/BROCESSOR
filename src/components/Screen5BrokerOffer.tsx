/**
 * SCREEN 5 of the wizard: the negotiated broker pathway, always shown
 * regardless of whether the direct bank options were viable — emphasizing
 * its capability to reach a higher LTV or a better negotiated rate than a
 * bank would offer directly. Styled with the signature mustard "highlight
 * band" accent to visually distinguish it as the negotiated alternative.
 * Text comes from the active language's Dictionary (see /i18n).
 */

import type { CSSProperties } from 'react';
import type { SimulatorOutput } from '../engine/simulate';
import type { SimulatorInput } from '../types/simulator';
import { COLORS } from '../styles/theme';
import { useLanguage } from '../i18n/LanguageContext';
import { PathMetricsGrid, PricingDifferentialCard, usePathLabels } from './OfferCardParts';
import { InitialContributionCard } from './InitialContributionCard';

export interface Screen5BrokerOfferProps {
  input: SimulatorInput;
  output: SimulatorOutput;
}

const introStyle: CSSProperties = {
  color: COLORS.textSecondary,
  fontSize: '0.95rem',
  margin: '0 0 1.5rem 0',
};

const pathCardStyle: CSSProperties = {
  border: `1px solid ${COLORS.border}33`,
  borderBottom: `4px solid ${COLORS.brand.mustard}`,
  borderRadius: '0.9rem',
  padding: '1.5rem 1.6rem',
  backgroundColor: COLORS.surface,
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem',
};

const pathTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: '1.25rem',
  color: COLORS.textPrimary,
};

const emphasisStyle: CSSProperties = {
  color: COLORS.brand.mustard,
  fontWeight: 600,
  margin: 0,
};

const noDataStyle: CSSProperties = {
  color: COLORS.textSecondary,
  fontSize: '0.9rem',
};

export function Screen5BrokerOffer({ input, output }: Screen5BrokerOfferProps) {
  const { t } = useLanguage();
  const pathLabels = usePathLabels();
  const path = output.broker;

  const introText = t.screen5.intro(input.numberOfHolders);

  return (
    <div>
      <p style={introStyle}>{introText}</p>
      <div style={pathCardStyle}>
        <h3 style={pathTitleStyle}>{pathLabels[path.channel]}</h3>
        <p style={emphasisStyle}>{t.screen5.emphasis}</p>

        {path.rate.dataAvailable && path.rate.tin !== null ? (
          <>
            <PathMetricsGrid path={path} />
            <InitialContributionCard
              input={input}
              path={path}
              taxBreakdown={output.taxBreakdown}
              formalizationCosts={output.formalizationCosts}
            />
            <PricingDifferentialCard differential={output.pricingDifferential} />
          </>
        ) : (
          <p role="alert" style={noDataStyle}>
            {t.screen5.noMarketData}
          </p>
        )}
      </div>
    </div>
  );
}
