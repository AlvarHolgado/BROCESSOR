/**
 * SCREEN 8 of the wizard: the closing/farewell screen. Rendered outside
 * WizardShell, like Screen1Welcome — no progress header, no back/continue
 * footer, since the flow has already finished. Shares Screen1Welcome's
 * high-impact hero treatment (navy/gold radial-mesh gradient background,
 * HeroBackdrop's ultra-faint blueprint-line house/chart motif, glowing
 * mustard-accented white brand title) so the flow visually "bookends" on the
 * same cover style it opened with.
 */

import type { CSSProperties } from 'react';
import { COLORS } from '../styles/theme';
import { useLanguage } from '../i18n/LanguageContext';
import { HeroBackdrop } from './HeroBackdrop';

export interface Screen8ClosingProps {
  numberOfHolders: number;
  onRestart: () => void;
}

const pageStyle: CSSProperties = {
  position: 'relative',
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '1.25rem',
  backgroundImage: `radial-gradient(ellipse 85% 65% at 12% 30%, rgba(217, 159, 38, 0.16) 0%, rgba(217, 159, 38, 0) 55%), linear-gradient(160deg, ${COLORS.hero.backgroundFrom} 0%, ${COLORS.hero.backgroundTo} 100%)`,
  padding: '2rem',
  textAlign: 'center',
  overflow: 'hidden',
};

const contentStyle: CSSProperties = {
  position: 'relative',
  zIndex: 1,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '1.25rem',
};

const brandStyle: CSSProperties = {
  fontSize: 'clamp(2.75rem, 8vw, 4.5rem)',
  fontWeight: 900,
  margin: 0,
  letterSpacing: '-0.02em',
  color: COLORS.textPrimary,
  filter: `drop-shadow(0 0 24px ${COLORS.hero.glow})`,
};

const brandHighlightBandStyle: CSSProperties = {
  width: '6rem',
  height: '5px',
  borderRadius: '2.5px',
  margin: '-0.6rem auto 0',
  backgroundColor: COLORS.brand.mustard,
};

const thankYouStyle: CSSProperties = {
  fontSize: '1.15rem',
  color: COLORS.hero.subtitleText,
  margin: '0 0 1.75rem 0',
  maxWidth: '480px',
};

// Visual treatment comes from the shared .btn-pill class in global.css.
const restartButtonStyle: CSSProperties = {
  padding: '0.9rem 2.1rem',
  fontSize: '1.02rem',
  fontWeight: 700,
};

export function Screen8Closing({ numberOfHolders, onRestart }: Screen8ClosingProps) {
  const { t } = useLanguage();

  return (
    <div style={pageStyle}>
      <HeroBackdrop />
      <div style={contentStyle}>
        <h1 style={brandStyle}>{t.common.brand}</h1>
        <div style={brandHighlightBandStyle} aria-hidden="true" />
        <p style={thankYouStyle}>{t.screen8.thankYou(numberOfHolders)}</p>
        <button type="button" className="btn-pill" style={restartButtonStyle} onClick={onRestart}>
          {t.screen8.restartCta}
        </button>
      </div>
    </div>
  );
}
