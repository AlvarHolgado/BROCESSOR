/**
 * Shared chrome around every wizard screen: a "Step X of N" progress header
 * with a step indicator bar, and a sticky bottom navigation bar with an
 * outline "Back" button and a filled primary "Continue"-style button. Text
 * comes from the active language's Dictionary (see /i18n) via useLanguage().
 * Purely presentational/navigational — screen content and validation stay
 * in each screen component.
 */

import type { CSSProperties, ReactNode } from 'react';
import { COLORS, FONTS } from '../styles/theme';
import { useLanguage } from '../i18n/LanguageContext';

export const TOTAL_WIZARD_STEPS = 8;

// Deliberately a flat, solid navy fill — no texture, gradient, or decorative
// graphic. Per an explicit design directive, the rich hero treatment (light
// ribbons, the gold-lit monument, the navy/gold gradient mesh — see
// HeroBackdrop.tsx) is reserved for the 3 cover/hero screens
// (Screen0LanguageSelect, Screen1Welcome, Screen8Closing); every operational
// wizard screen (steps 2-7, all rendered through this shell) stays a clean,
// high-focus, distraction-free navy surface.
const pageStyle: CSSProperties = {
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: COLORS.background,
};

const headerStyle: CSSProperties = {
  position: 'sticky',
  top: 0,
  zIndex: 1,
  backgroundColor: COLORS.background,
  padding: '1.25rem 1.5rem 1rem',
  borderBottom: `1px solid ${COLORS.border}33`,
};

const headerRowStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'baseline',
  maxWidth: '960px',
  margin: '0 auto 0.6rem',
};

const brandStyle: CSSProperties = {
  fontFamily: FONTS.serif,
  fontWeight: 700,
  fontSize: '1.1rem',
  color: COLORS.textPrimary,
  margin: 0,
};

const stepLabelStyle: CSSProperties = {
  color: COLORS.textSecondary,
  fontSize: '0.85rem',
  fontWeight: 600,
};

const progressTrackStyle: CSSProperties = {
  maxWidth: '960px',
  margin: '0 auto',
  display: 'grid',
  gridTemplateColumns: `repeat(${TOTAL_WIZARD_STEPS}, 1fr)`,
  gap: '0.4rem',
};

function progressSegmentStyle(filled: boolean): CSSProperties {
  return {
    height: '6px',
    borderRadius: '3px',
    backgroundColor: filled ? COLORS.brand.mustard : `${COLORS.border}33`,
  };
}

const mainStyle: CSSProperties = {
  flex: 1,
  width: '100%',
  maxWidth: '960px',
  margin: '0 auto',
  padding: '1.5rem 1.5rem 6.5rem',
  boxSizing: 'border-box',
};

const bottomNavStyle: CSSProperties = {
  position: 'sticky',
  bottom: 0,
  backgroundColor: COLORS.surface,
  borderTop: `1px solid ${COLORS.border}33`,
  padding: '1rem 1.5rem',
  boxShadow: '0 -2px 8px rgba(0, 0, 0, 0.35)',
};

const bottomNavRowStyle: CSSProperties = {
  maxWidth: '960px',
  margin: '0 auto',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '1rem',
};

// Visual treatment (gradient, border, glow, hover/active/disabled states) comes
// from the shared .btn-pill/.btn-pill-outline classes in global.css — these
// inline styles are layout-only (padding/font weight), left as plain objects
// so JSX can still merge in nothing else beyond the className.
const outlineButtonStyle: CSSProperties = {
  padding: '0.75rem 1.5rem',
  fontWeight: 600,
};

const primaryButtonStyle: CSSProperties = {
  padding: '0.75rem 1.75rem',
  fontWeight: 700,
};

export interface WizardShellProps {
  step: number;
  onBack?: () => void;
  onContinue?: () => void;
  continueLabel?: string;
  continueDisabled?: boolean;
  children: ReactNode;
}

export function WizardShell({ step, onBack, onContinue, continueLabel, continueDisabled, children }: WizardShellProps) {
  const { t } = useLanguage();

  return (
    <div style={pageStyle}>
      <header style={headerStyle}>
        <div style={headerRowStyle}>
          <p style={brandStyle}>{t.common.brand}</p>
          <span style={stepLabelStyle}>{t.common.stepLabel(step, TOTAL_WIZARD_STEPS)}</span>
        </div>
        <div style={progressTrackStyle} role="progressbar" aria-valuenow={step} aria-valuemin={1} aria-valuemax={TOTAL_WIZARD_STEPS}>
          {Array.from({ length: TOTAL_WIZARD_STEPS }, (_, index) => (
            <div key={index} style={progressSegmentStyle(index < step)} />
          ))}
        </div>
      </header>

      <main style={mainStyle}>{children}</main>

      {(onBack || onContinue) && (
        <nav style={bottomNavStyle}>
          <div style={bottomNavRowStyle}>
            {onBack ? (
              <button type="button" className="btn-pill-outline" style={outlineButtonStyle} onClick={onBack}>
                {t.common.back}
              </button>
            ) : (
              <span />
            )}
            {onContinue && (
              <button type="button" className="btn-pill" style={primaryButtonStyle} onClick={onContinue} disabled={continueDisabled}>
                {continueLabel ?? t.common.continueDefault}
              </button>
            )}
          </div>
        </nav>
      )}
    </div>
  );
}
