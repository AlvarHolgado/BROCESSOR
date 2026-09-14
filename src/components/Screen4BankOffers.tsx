/**
 * SCREEN 4 of the wizard: direct bank pathways only (bonified vs.
 * non-bonified). Each card shows TIN/TAE, LTV, quota, DSTI risk, a
 * non-viability warning with the max viable bank offer when applicable, and
 * the unified initial-contribution breakdown for that path. Text comes from
 * the active language's Dictionary (see /i18n) via useLanguage().
 */

import type { CSSProperties } from 'react';
import type { MortgagePathResult, SimulatorOutput } from '../engine/simulate';
import type { SimulatorInput } from '../types/simulator';
import { COLORS } from '../styles/theme';
import { useLanguage } from '../i18n/LanguageContext';
import { BankViabilityBanner, PathMetricsGrid, usePathLabels, VariableRateDetail } from './OfferCardParts';
import { InitialContributionCard } from './InitialContributionCard';

export interface Screen4BankOffersProps {
  input: SimulatorInput;
  output: SimulatorOutput;
}

const introStyle: CSSProperties = {
  color: COLORS.textSecondary,
  fontSize: '0.95rem',
  margin: '0 0 1.5rem 0',
};

const bankGroupGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
  gap: '1.25rem',
};

const pathCardStyle: CSSProperties = {
  border: `1px solid ${COLORS.border}33`,
  borderRadius: '0.9rem',
  padding: '1.25rem 1.4rem',
  backgroundColor: COLORS.surface,
  display: 'flex',
  flexDirection: 'column',
  gap: '0.9rem',
};

const pathTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: '1.15rem',
  color: COLORS.textPrimary,
};

const noDataStyle: CSSProperties = {
  color: COLORS.textSecondary,
  fontSize: '0.9rem',
};

function BankPathCard({
  path,
  siblingPath,
  input,
  taxBreakdown,
  formalizationCosts,
}: {
  path: MortgagePathResult;
  /** The other bank channel, so a VARIABLE bonified card can contrast its differential against the non-bonified one. */
  siblingPath?: MortgagePathResult;
  input: SimulatorInput;
  taxBreakdown: SimulatorOutput['taxBreakdown'];
  formalizationCosts: SimulatorOutput['formalizationCosts'];
}) {
  const { t } = useLanguage();
  const pathLabels = usePathLabels();

  return (
    <div style={pathCardStyle}>
      <h3 style={pathTitleStyle}>{pathLabels[path.channel]}</h3>

      {path.rate.dataAvailable && path.rate.tin !== null ? (
        <>
          <PathMetricsGrid path={path} />
          {input.mortgageType === 'VARIABLE' && (
            <VariableRateDetail path={path} siblingPath={siblingPath} numberOfHolders={input.numberOfHolders} />
          )}
          <BankViabilityBanner path={path} />
          <InitialContributionCard
            input={input}
            path={path}
            taxBreakdown={taxBreakdown}
            formalizationCosts={formalizationCosts}
          />
        </>
      ) : (
        <p role="alert" style={noDataStyle}>
          {t.screen4.noMarketData}
        </p>
      )}
    </div>
  );
}

export function Screen4BankOffers({ input, output }: Screen4BankOffersProps) {
  const { t } = useLanguage();
  const introText = t.screen4.intro(input.numberOfHolders);

  return (
    <div>
      <p style={introStyle}>{introText}</p>
      <div style={bankGroupGridStyle}>
        <BankPathCard
          path={output.bankBonified}
          siblingPath={output.bankNonBonified}
          input={input}
          taxBreakdown={output.taxBreakdown}
          formalizationCosts={output.formalizationCosts}
        />
        <BankPathCard
          path={output.bankNonBonified}
          input={input}
          taxBreakdown={output.taxBreakdown}
          formalizationCosts={output.formalizationCosts}
        />
      </div>
    </div>
  );
}
