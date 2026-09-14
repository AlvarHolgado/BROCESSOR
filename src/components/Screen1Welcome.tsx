/**
 * SCREEN 1 of the wizard: the welcome/cover page. Rendered outside
 * WizardShell entirely — no progress header, no back/continue footer —
 * since it precedes step counting altogether (see MortgageWizard.tsx).
 * High-impact hero treatment: a navy/gold radial-mesh gradient background,
 * HeroBackdrop's ultra-faint blueprint-line house/chart motif (see
 * HeroBackdrop.tsx), and a glowing, mustard-accented white brand title (a
 * mustard "highlight band" underlines the wordmark) — see
 * COLORS.hero/COLORS.brand in theme.ts, used only on this screen,
 * Screen0LanguageSelect and Screen8Closing.
 */

import type { CSSProperties } from 'react';
import { COLORS } from '../styles/theme';
import { useLanguage } from '../i18n/LanguageContext';
import { HeroBackdrop } from './HeroBackdrop';

export interface Screen1WelcomeProps {
  onStart: () => void;
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
  fontSize: 'clamp(3.25rem, 10vw, 5.5rem)',
  fontWeight: 900,
  margin: 0,
  letterSpacing: '-0.02em',
  color: COLORS.textPrimary,
  filter: `drop-shadow(0 0 24px ${COLORS.hero.glow})`,
};

const brandHighlightBandStyle: CSSProperties = {
  width: '7rem',
  height: '5px',
  borderRadius: '2.5px',
  margin: '-0.6rem auto 0',
  backgroundColor: COLORS.brand.mustard,
};

const subtitleStyle: CSSProperties = {
  fontSize: '1.3rem',
  fontWeight: 500,
  color: COLORS.hero.subtitleText,
  margin: '0 0 1.75rem 0',
};

// Visual treatment comes from the shared .btn-pill class in global.css.
const ctaButtonStyle: CSSProperties = {
  padding: '1.05rem 2.5rem',
  fontSize: '1.1rem',
  fontWeight: 700,
};

export function Screen1Welcome({ onStart }: Screen1WelcomeProps) {
  const { t } = useLanguage();

  return (
    <div style={pageStyle}>
      <HeroBackdrop />
      <div style={contentStyle}>
        <h1 style={brandStyle}>{t.common.brand}</h1>
        <div style={brandHighlightBandStyle} aria-hidden="true" />
        <p style={subtitleStyle}>{t.screen1.subtitle}</p>
        <button type="button" className="btn-pill" style={ctaButtonStyle} onClick={onStart}>
          {t.screen1.cta}
        </button>
      </div>
    </div>
  );
}
