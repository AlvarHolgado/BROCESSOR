/**
 * Introductory language selector, shown before Screen1Welcome — the very
 * first thing a new user sees. Shares Screen1Welcome/Screen8Closing's hero
 * treatment: a navy/gold radial-mesh gradient background, HeroBackdrop's
 * ultra-faint blueprint-line house/chart motif (see HeroBackdrop.tsx), and
 * the glowing mustard-accented white brand title with its "highlight band"
 * underline — so the flow's cover style stays visually consistent from the
 * very first screen.
 */
import type { CSSProperties } from 'react';
import { COLORS } from '../styles/theme';
import { LANGUAGE_OPTIONS, type Language } from '../i18n/language';
import { useLanguage } from '../i18n/LanguageContext';
import { HeroBackdrop } from './HeroBackdrop';

export interface Screen0LanguageSelectProps {
  onContinue: () => void;
}

const pageStyle: CSSProperties = {
  position: 'relative',
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '1.5rem',
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
  gap: '1.5rem',
};

const brandStyle: CSSProperties = {
  fontSize: 'clamp(2.25rem, 7vw, 3.5rem)',
  fontWeight: 900,
  margin: 0,
  letterSpacing: '-0.02em',
  color: COLORS.textPrimary,
  filter: `drop-shadow(0 0 24px ${COLORS.hero.glow})`,
};

const brandHighlightBandStyle: CSSProperties = {
  width: '4.5rem',
  height: '4px',
  borderRadius: '2px',
  margin: '-0.5rem auto 0',
  backgroundColor: COLORS.brand.mustard,
};

const titleStyle: CSSProperties = {
  fontSize: '1.4rem',
  fontWeight: 700,
  color: '#FFFFFF',
  margin: 0,
};

const subtitleStyle: CSSProperties = {
  fontSize: '1rem',
  color: COLORS.hero.subtitleText,
  margin: '0 0 0.5rem 0',
  maxWidth: '480px',
};

const optionsRowStyle: CSSProperties = {
  display: 'flex',
  gap: '1rem',
  flexWrap: 'wrap',
  justifyContent: 'center',
};

function optionButtonStyle(active: boolean): CSSProperties {
  return {
    padding: '1rem 1.75rem',
    minWidth: '160px',
    borderRadius: '0.9rem',
    border: `2px solid ${active ? COLORS.brand.mustard : 'rgba(255,255,255,0.25)'}`,
    backgroundColor: active ? 'rgba(217, 159, 38, 0.18)' : 'rgba(255,255,255,0.04)',
    color: '#FFFFFF',
    fontWeight: 700,
    fontSize: '1.05rem',
    cursor: 'pointer',
  };
}

// Visual treatment (gradient, gold border/glow, hover/active) comes from
// the shared .btn-pill class in global.css — see WizardShell.tsx's own note.
const ctaButtonStyle: CSSProperties = {
  marginTop: '0.75rem',
  padding: '1rem 2.5rem',
  fontSize: '1.05rem',
  fontWeight: 700,
};

export function Screen0LanguageSelect({ onContinue }: Screen0LanguageSelectProps) {
  const { language, setLanguage, t } = useLanguage();

  const handleSelect = (code: Language) => {
    setLanguage(code);
  };

  return (
    <div style={pageStyle}>
      <HeroBackdrop />
      <div style={contentStyle}>
        <h1 style={brandStyle}>{t.common.brand}</h1>
        <div style={brandHighlightBandStyle} aria-hidden="true" />
        <h2 style={titleStyle}>{t.languageSelect.title}</h2>
        <p style={subtitleStyle}>{t.languageSelect.subtitle}</p>

        <div role="group" aria-label={t.languageSelect.title} style={optionsRowStyle}>
          {LANGUAGE_OPTIONS.map((option) => (
            <button
              key={option.code}
              type="button"
              style={optionButtonStyle(option.code === language)}
              aria-pressed={option.code === language}
              onClick={() => handleSelect(option.code)}
            >
              {option.nativeName}
            </button>
          ))}
        </div>

        <button type="button" className="btn-pill" style={ctaButtonStyle} onClick={onContinue}>
          {t.languageSelect.cta}
        </button>
      </div>
    </div>
  );
}
