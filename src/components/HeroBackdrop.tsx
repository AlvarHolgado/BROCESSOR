/**
 * Shared decorative backdrop for the 3 cover/hero screens ONLY
 * (Screen0LanguageSelect, Screen1Welcome, Screen8Closing) — never used on
 * the operational wizard screens (steps 2-7 via WizardShell), which stay a
 * clean solid navy surface per an explicit design directive. Renders a
 * single `aria-hidden`, `pointer-events: none` decorative layer (every
 * consumer renders its own content in a `position: relative; z-index: 1`
 * wrapper above it) in a minimalist "blueprint line" style — thin,
 * open-stroke gold linework, never filled shapes, inspired by (but not a
 * copy of) a generic stock-illustration reference: a schematic house
 * outline crossed by an upward trend arrow on one side, and a schematic
 * bar-chart-plus-trend-line on the other.
 *
 * Deliberately replaces an earlier, more ornate version of this component
 * (a filled classical-monument silhouette + a filled house glyph + sweeping
 * gradient "light ribbons") per an explicit design directive to strip out
 * every heavy/complex/filled element and keep ONLY thin, restrained line
 * motifs. Each motif sits at ~17-18% opacity plus a soft gold
 * `drop-shadow` glow — bumped up from an initial 5-8%/no-glow pass per a
 * follow-up "give it more presence" directive — so the linework reads as
 * softly illuminated against the navy canvas rather than barely-there,
 * while staying well short of competing with foreground UI/text contrast.
 */

import type { CSSProperties } from 'react';

const wrapperStyle: CSSProperties = {
  position: 'absolute',
  inset: 0,
  overflow: 'hidden',
  pointerEvents: 'none',
};

// A soft, low-spread gold drop-shadow on top of the base opacity — reads as
// a gentle "glow" the linework casts against the navy canvas, rather than a
// sharp duplicate outline. Shared by both motifs so the two sides of the
// composition feel like one consistent light source, not two different
// treatments.
const softGoldGlow = 'drop-shadow(0 0 6px rgba(217, 159, 38, 0.45))';

const houseTrendWrapperStyle: CSSProperties = {
  position: 'absolute',
  left: '-2%',
  top: '50%',
  transform: 'translateY(-50%)',
  width: 'clamp(220px, 30vw, 420px)',
  height: 'auto',
  opacity: 0.18,
  filter: softGoldGlow,
};

const chartTrendWrapperStyle: CSSProperties = {
  position: 'absolute',
  right: '-2%',
  top: '50%',
  transform: 'translateY(-50%)',
  width: 'clamp(220px, 30vw, 420px)',
  height: 'auto',
  opacity: 0.17,
  filter: softGoldGlow,
};

const svgFillStyle: CSSProperties = { width: '100%', height: 'auto', display: 'block' };

const strokeProps = {
  stroke: '#D99F26',
  fill: 'none',
  strokeWidth: 1.5,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

/**
 * Thin blueprint-line house outline (roofline + walls + a simple
 * window/door glyph, all open stroke, no fill) crossed by a zigzagging
 * upward trend arrow — echoes the "home value/affordability is trending up"
 * idea without any literal chart labels or currency glyphs, keeping it
 * purely abstract/decorative.
 */
function HouseTrendLine() {
  return (
    <svg viewBox="0 0 400 300" style={svgFillStyle} xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M60,260 L60,140 L150,70 L240,140 L240,260" {...strokeProps} />
      <path d="M60,260 L240,260" {...strokeProps} />
      <rect x="130" y="190" width="40" height="70" {...strokeProps} />
      <rect x="85" y="170" width="30" height="30" {...strokeProps} />
      <path d="M85,185 L115,185 M100,170 L100,200" {...strokeProps} strokeWidth={1} />
      <path
        d="M30,250 L100,190 L135,215 L190,120 L230,140 L300,50"
        {...strokeProps}
        strokeWidth={2}
      />
      <path d="M278,58 L300,50 L292,72" {...strokeProps} strokeWidth={2} />
    </svg>
  );
}

/**
 * Thin blueprint-line bar chart (open-stroke bars of increasing height) plus
 * an overlaid zigzag trend line ending in an arrowhead — the "financial
 * chart trend line" motif, kept purely geometric/abstract (no currency
 * glyphs or numbers, so it never reads as real, specific data).
 */
function ChartTrendLine() {
  return (
    <svg viewBox="0 0 400 300" style={svgFillStyle} xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M40,260 L360,260" {...strokeProps} />
      <rect x="70" y="200" width="34" height="60" {...strokeProps} />
      <rect x="130" y="165" width="34" height="95" {...strokeProps} />
      <rect x="190" y="185" width="34" height="75" {...strokeProps} />
      <rect x="250" y="120" width="34" height="140" {...strokeProps} />
      <path d="M60,215 L120,150 L175,175 L235,90 L310,55" {...strokeProps} strokeWidth={2} />
      <path d="M288,50 L310,55 L302,77" {...strokeProps} strokeWidth={2} />
    </svg>
  );
}

/** aria-hidden decorative composition — see the module doc comment above for the full rationale. */
export function HeroBackdrop() {
  return (
    <div style={wrapperStyle} aria-hidden="true">
      <div style={houseTrendWrapperStyle}>
        <HouseTrendLine />
      </div>
      <div style={chartTrendWrapperStyle}>
        <ChartTrendLine />
      </div>
    </div>
  );
}
