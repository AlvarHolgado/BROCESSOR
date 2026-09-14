/**
 * Shared color tokens for the simulator UI: the "midnight & mustard" brand
 * palette — deep midnight/navy blocks, a single warm mustard/ocher accent,
 * and crisp white typography — applied uniformly across the wizard flow, the
 * hero/cover screens, and the PDF export template (see exportPdf.ts, whose
 * own RGB constants mirror these same four hex values). Exactly four colors
 * define the brand identity (see `brand` below); every other token in this
 * file is either a derived shade/tint of one of those four (for states like
 * hover, active-tint, subtle borders) or a semantic/functional color
 * (`risk`, `error`) that is deliberately kept OUTSIDE the brand palette,
 * since risk/error indicators rely on universal red/amber/green meaning
 * that a brand reskin must never override.
 *
 * Every pairing below is checked against the WCAG 2.1 contrast formula for
 * this dark canvas:
 *   white text on navy surface (#152951)      -> ~14.3:1
 *   white text on navy-trim background (#0E1B38) -> ~17:1
 *   mustard text/accent on navy surface        -> ~6.1:1  (passes AA for normal text)
 *   secondary slate text on navy surface        -> ~8.2:1
 *   navy text on a mustard-filled button/bubble -> ~6.1:1 (white-on-mustard is only ~2.35:1 and FAILS AA — every mustard-filled control uses navy text on top, never white)
 *   full-strength border vs navy surface        -> ~3.2:1 (meets the >=3:1 non-text UI-component threshold)
 */
export const COLORS = {
  /**
   * The four brand colors, exactly as specified: dominant container/background
   * base (navy), primary accent (mustard), primary typography (white), and
   * structural contrast/trim (a darker slate-navy). `mustardDeep`/`mustardTint`
   * are shade/tint DERIVATIONS of the same mustard hue (for gradients and
   * translucent active-state washes) — not a second accent color.
   */
  brand: {
    navy: '#152951',
    navyTrim: '#0E1B38',
    mustard: '#D99F26',
    mustardDeep: '#B37F1A',
    mustardTint: 'rgba(217, 159, 38, 0.16)',
    white: '#FFFFFF',
  },
  background: '#0E1B38',
  surface: '#152951',
  border: '#5978B0',
  textPrimary: '#FFFFFF',
  textSecondary: '#B9C4DC',
  error: '#F87171',
  errorBackground: '#3A1418',
  errorBorder: '#F87171',
  errorTextOnBanner: '#FECACA',
  /** Traffic-light risk indicators — deliberately semantic/universal (red=danger, green=safe), never restyled to the brand accent. Self-contained light-tint chips that read correctly on any page background. */
  risk: {
    GREEN: { background: '#ECFDF5', text: '#065F46', border: '#10B981' },
    YELLOW: { background: '#FFFBEB', text: '#92400E', border: '#F59E0B' },
    RED: { background: '#FEF2F2', text: '#991B1B', border: '#DC2626' },
  },
  /** Chart series accents — mustard for the "hero" principal line, white for the contrasting interest line, both >=3:1 non-text contrast on the navy chart background. */
  chart: {
    principal: '#D99F26',
    interest: '#FFFFFF',
  },
  /**
   * Hero/cover screens (Screen0LanguageSelect, Screen1Welcome, Screen8Closing)
   * — the same navy-to-navyTrim gradient as the rest of the app, just used as
   * a full-bleed background rather than a card surface, with the mustard
   * glow behind the (now solid-white, see COLORS.textPrimary) brand title.
   */
  hero: {
    backgroundFrom: '#152951',
    backgroundTo: '#0E1B38',
    subtitleText: '#B9C4DC',
    glow: 'rgba(217, 159, 38, 0.45)',
  },
} as const;

/**
 * The two-typeface editorial system: a display serif (Playfair Display,
 * loaded in index.html) for headings/titles ONLY — see the global `h1-h4`
 * rule in global.css, which is where most headings pick this up automatically
 * since they're real heading tags — and the system sans-serif stack for
 * everything else (form labels/inputs, body copy, buttons), which stays
 * untouched for maximum legibility on data-entry screens. Exported here (not
 * just left in global.css) for the handful of non-heading elements that need
 * the serif treatment explicitly in their inline style (e.g. a `<div>`/`<span>`
 * standing in for a heading).
 */
export const FONTS = {
  serif: "'Playfair Display', Georgia, 'Times New Roman', serif",
  sans: "system-ui, -apple-system, 'Segoe UI', sans-serif",
} as const;
