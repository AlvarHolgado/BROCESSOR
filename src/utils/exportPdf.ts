/**
 * Client-side PDF report generation for a computed simulation. All figures
 * are read straight from SimulatorInput/SimulatorOutput — nothing here
 * recomputes or guesses a financial value, it only formats what /engine
 * already produced. Text and number formatting come from the active
 * language's Dictionary/Formatters (see /i18n), so the report can be
 * generated in Catalan, Spanish, or English. Visual style mirrors the
 * wizard's "midnight & mustard" hero treatment (deep navy canvas, glossy
 * mustard brand title, white content text) — see COLORS.brand/COLORS.hero
 * in /styles/theme.ts for the on-screen equivalent and its exact hex values
 * — laid out as modular info-cards (rounded container, left accent bar,
 * label/value stat grid) rather than a flat line-by-line report, mirroring
 * the on-screen SummaryTile grids.
 */

import { jsPDF } from 'jspdf';
import type { MortgagePathResult, SimulatorOutput } from '../engine/simulate';
import type { SimulatorInput } from '../types/simulator';
import { DSTI_GREEN_THRESHOLD } from '../engine/scoring';
import { buildBrokerStrategyText } from './brokerStrategyText';
import { getDictionary } from '../i18n/LanguageContext';
import { getFormatters } from '../i18n/formatters';
import type { Dictionary } from '../i18n/dictionaries/ca';
import type { Formatters } from '../i18n/formatters';
import { DEFAULT_LANGUAGE, type Language } from '../i18n/language';

export interface GenerateSimulationPdfParams {
  input: SimulatorInput;
  output: SimulatorOutput;
  ccaaName: string;
  /** Language to render the report in — defaults to Catalan when omitted. */
  language?: Language;
}

const PAGE_MARGIN = 15;
const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const CONTENT_WIDTH = PAGE_WIDTH - PAGE_MARGIN * 2;
const LINE_HEIGHT = 6;
const SECTION_GAP = 5;

type Rgb = [number, number, number];

/**
 * RGB triples matching the four brand colors exactly (see COLORS.brand in
 * /styles/theme.ts): PDF_BACKGROUND = navyTrim (#0E1B38), PDF_CARD_BG = navy
 * (#152951), PDF_ACCENT_MUSTARD = mustard (#D99F26), PDF_TEXT = white
 * (#FFFFFF) — plus a couple of tones derived from that same family for
 * card-specific needs (a lighter-navy border, a light-slate neutral/muted
 * tone, and a semantic warning red kept OUTSIDE the brand palette, same as
 * COLORS.risk/COLORS.error on-screen).
 */
const PDF_BACKGROUND: Rgb = [14, 27, 56]; // #0E1B38 — page canvas (structural contrast / trim)
const PDF_CARD_BG: Rgb = [21, 41, 81]; // #152951 — card surface (dominant container / background base)
const PDF_CARD_BORDER: Rgb = [89, 120, 176]; // #5978B0 — subtle card stroke, matching COLORS.border
const PDF_ACCENT_MUSTARD: Rgb = [217, 159, 38]; // #D99F26 — brand heading + primary/bonified/broker accent
const PDF_ACCENT_NEUTRAL: Rgb = [185, 196, 220]; // #B9C4DC — non-bonified bank accent + tax/operation cards (neutral, not a "best value"/highlight section), matching COLORS.textSecondary
const PDF_TEXT: Rgb = [255, 255, 255]; // #FFFFFF — primary content text
const PDF_MUTED: Rgb = [185, 196, 220]; // #B9C4DC — stat labels / secondary text
const PDF_WARNING: Rgb = [252, 165, 165]; // #FCA5A5 — non-viability / non-financeable notices on the dark canvas (semantic, kept outside the brand palette)

const PATH_ACCENTS: Record<MortgagePathResult['channel'], Rgb> = {
  BANK_BONIFIED: PDF_ACCENT_MUSTARD,
  BANK_NON_BONIFIED: PDF_ACCENT_NEUTRAL,
  BROKER: PDF_ACCENT_MUSTARD,
};

/** A single label/value cell inside a stat-grid card. */
interface StatItem {
  label: string;
  value: string;
  /** Renders the value in the card's accent color and a larger size — for the one or two figures that matter most (e.g. the monthly quota). */
  highlight?: boolean;
}

/**
 * Thin wrapper over jsPDF that tracks a vertical cursor, paints every page
 * (including ones added mid-document) with the dark wealth-theme
 * background, and lays out content as rounded info-cards with a left
 * accent bar and a label/value stat grid — the PDF equivalent of the
 * on-screen SummaryTile grids — instead of a flat sequence of text lines.
 */
class PdfWriter {
  private cursorY = PAGE_MARGIN;

  constructor(private readonly doc: jsPDF) {
    this.paintPageBackground();
  }

  private paintPageBackground(): void {
    this.doc.setFillColor(...PDF_BACKGROUND);
    this.doc.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, 'F');
  }

  /** Starts a fresh page (repainting the background) if the given height wouldn't fit on the current one. */
  private ensureSpaceFor(height: number): void {
    if (this.cursorY + height > PAGE_HEIGHT - PAGE_MARGIN) {
      this.doc.addPage();
      this.paintPageBackground();
      this.cursorY = PAGE_MARGIN;
    }
  }

  /** The brand masthead / brand-colored section heading — bold glossy mustard. */
  brandHeading(text: string, fontSize = 22): void {
    this.ensureSpaceFor(fontSize * 0.5);
    this.doc.setTextColor(...PDF_ACCENT_MUSTARD);
    this.doc.setFont('helvetica', 'bold').setFontSize(fontSize);
    this.doc.text(text, PAGE_MARGIN, this.cursorY);
    this.cursorY += LINE_HEIGHT + 2;
  }

  subtitle(text: string): void {
    this.ensureSpaceFor(LINE_HEIGHT);
    this.doc.setTextColor(...PDF_TEXT);
    this.doc.setFont('helvetica', 'normal').setFontSize(10);
    this.doc.text(text, PAGE_MARGIN, this.cursorY);
    this.cursorY += LINE_HEIGHT + SECTION_GAP;
  }

  sectionHeading(text: string): void {
    this.ensureSpaceFor(LINE_HEIGHT + SECTION_GAP);
    this.doc.setTextColor(...PDF_TEXT);
    this.doc.setFont('helvetica', 'bold').setFontSize(13);
    this.doc.text(text, PAGE_MARGIN, this.cursorY);
    this.cursorY += LINE_HEIGHT + 1;
  }

  /**
   * A rounded info-card: a tinted container with a colored left accent bar,
   * a bold title, and the given stat items laid out in a fixed-column grid
   * (label in small muted text, value in bold — larger and accent-colored
   * for `highlight` items). Starts a new page first if the card wouldn't
   * fit in the remaining space on the current one.
   */
  card(title: string, items: StatItem[], accent: Rgb, columns: 2 | 3 = 3): void {
    const padding = 6;
    const rowHeight = items.some((item) => item.highlight) ? 16 : 14;
    const titleHeight = 11;
    const rows = Math.ceil(items.length / columns);
    const cardHeight = titleHeight + rows * rowHeight + padding * 1.6;

    this.ensureSpaceFor(cardHeight + SECTION_GAP);
    const x = PAGE_MARGIN;
    const y = this.cursorY;

    this.doc.setFillColor(...PDF_CARD_BG);
    this.doc.setDrawColor(...PDF_CARD_BORDER);
    this.doc.setLineWidth(0.3);
    this.doc.roundedRect(x, y, CONTENT_WIDTH, cardHeight, 2.5, 2.5, 'FD');

    this.doc.setFillColor(...accent);
    this.doc.roundedRect(x, y, 2.4, cardHeight, 1.2, 1.2, 'F');

    this.doc.setTextColor(...PDF_TEXT);
    this.doc.setFont('helvetica', 'bold').setFontSize(12);
    this.doc.text(title, x + padding, y + padding + 2.5);

    const colWidth = (CONTENT_WIDTH - padding * 2) / columns;
    items.forEach((item, index) => {
      const col = index % columns;
      const row = Math.floor(index / columns);
      const itemX = x + padding + col * colWidth;
      const itemY = y + padding + titleHeight + row * rowHeight + 3;

      this.doc.setTextColor(...PDF_MUTED);
      this.doc.setFont('helvetica', 'normal').setFontSize(7.5);
      this.doc.text(item.label, itemX, itemY, { maxWidth: colWidth - 3 });

      this.doc.setTextColor(...(item.highlight ? accent : PDF_TEXT));
      this.doc.setFont('helvetica', 'bold').setFontSize(item.highlight ? 12.5 : 10.5);
      this.doc.text(item.value, itemX, itemY + 6, { maxWidth: colWidth - 3 });
    });

    this.cursorY = y + cardHeight + SECTION_GAP;
  }

  /** A short note in a semantic color (e.g. a viability warning) below a card — wraps within the page width. */
  note(text: string, color: Rgb = PDF_MUTED): void {
    this.ensureSpaceFor(LINE_HEIGHT * 2);
    this.doc.setTextColor(...color);
    this.doc.setFont('helvetica', 'italic').setFontSize(9);
    const wrapped = this.doc.splitTextToSize(text, CONTENT_WIDTH) as string[];
    this.doc.text(wrapped, PAGE_MARGIN, this.cursorY);
    this.cursorY += LINE_HEIGHT * wrapped.length * 0.85 + 2;
  }

  /** Like note(), but in the normal (non-italic) content color and size — for longer closing prose. */
  paragraph(text: string): void {
    this.ensureSpaceFor(LINE_HEIGHT * 2);
    this.doc.setTextColor(...PDF_TEXT);
    this.doc.setFont('helvetica', 'normal').setFontSize(11);
    const wrapped = this.doc.splitTextToSize(text, CONTENT_WIDTH) as string[];
    this.doc.text(wrapped, PAGE_MARGIN, this.cursorY);
    this.cursorY += LINE_HEIGHT * wrapped.length;
  }

  /**
   * A bordered callout box for the VARIABLE-rate detail lines (index/
   * differential formula, TAE, reference index, caps/floors disclosure,
   * sensitivity disclaimer) — the PDF equivalent of the on-screen
   * `variableDetailStyle` box in OfferCardParts.tsx, so a VARIABLE-mortgage
   * simulation shows the exact same information in both places. `emphasize`
   * renders that one line (the TAE figure) larger/bold, matching the
   * on-screen `<strong>` treatment.
   */
  variableRateDetail(lines: string[], emphasizeIndex: number | undefined, accent: Rgb): void {
    const padding = 5;
    const bodyLineHeight = 4.6;
    const emphasisLineHeight = 6;
    const doc = this.doc;
    const maxTextWidth = CONTENT_WIDTH - padding * 2;

    doc.setFont('helvetica', 'normal').setFontSize(9);
    const wrappedGroups = lines.map((line, index) => {
      doc.setFont('helvetica', index === emphasizeIndex ? 'bold' : 'normal').setFontSize(index === emphasizeIndex ? 11 : 9);
      return doc.splitTextToSize(line, maxTextWidth) as string[];
    });
    const boxHeight =
      padding * 2 +
      wrappedGroups.reduce((sum, wrapped, index) => sum + wrapped.length * (index === emphasizeIndex ? emphasisLineHeight : bodyLineHeight), 0);

    this.ensureSpaceFor(boxHeight + SECTION_GAP);
    const x = PAGE_MARGIN;
    const y = this.cursorY;

    doc.setFillColor(...PDF_CARD_BG);
    doc.setDrawColor(...accent);
    doc.setLineWidth(0.35);
    doc.roundedRect(x, y, CONTENT_WIDTH, boxHeight, 2, 2, 'FD');

    let lineY = y + padding + 3;
    wrappedGroups.forEach((wrapped, index) => {
      const isEmphasis = index === emphasizeIndex;
      doc.setTextColor(...(isEmphasis ? accent : PDF_TEXT));
      doc.setFont('helvetica', isEmphasis ? 'bold' : 'normal').setFontSize(isEmphasis ? 11 : 9);
      doc.text(wrapped, x + padding, lineY, { maxWidth: maxTextWidth });
      lineY += wrapped.length * (isEmphasis ? emphasisLineHeight : bodyLineHeight);
    });

    this.cursorY = y + boxHeight + SECTION_GAP;
  }

  gap(): void {
    this.cursorY += SECTION_GAP;
  }
}

function formatRateStat(path: MortgagePathResult, t: Dictionary, f: Formatters): string {
  if (!path.rate.dataAvailable || path.rate.tin === null) {
    return t.pdf.notAvailable;
  }
  const tin = `${f.percent2.format(path.rate.tin)}%`;
  const tae =
    path.effectiveAnnualRate !== null ? ` / ${f.percent2.format(path.effectiveAnnualRate)}% ${t.common.taeAbbreviation}` : '';
  return tin + tae;
}

/**
 * Builds the VARIABLE-only detail lines for a path — mirrors
 * VariableRateDetail in OfferCardParts.tsx line for line (initial teaser
 * TIN/duration, post-initial Euríbor + differential formula, optional
 * sibling-channel contrast, TAE Variable, reference index/reset cadence,
 * caps/floors disclosure, sensitivity disclaimer) so the PDF and the
 * on-screen breakdown box never drift apart. Returns null under the exact
 * same conditions VariableRateDetail renders nothing (not VARIABLE, or the
 * initial-period data isn't available for this quote).
 */
function buildVariableRateLines(
  path: MortgagePathResult,
  siblingPath: MortgagePathResult | undefined,
  numberOfHolders: number,
  t: Dictionary,
  f: Formatters
): { lines: string[]; emphasizeIndex: number | undefined } | null {
  const rate = path.rate;
  if (!rate.dataAvailable || rate.initialPeriodTin === undefined || rate.postFixedDifferentialOverEuribor === undefined) {
    return null;
  }

  const months = rate.initialPeriodMonths ?? 12;
  const isBonified = path.channel === 'BANK_BONIFIED';
  const conditionLabel = isBonified ? t.offerCard.variableConditionMet : t.offerCard.variableConditionNotMet;
  const siblingDifferential = siblingPath?.rate.postFixedDifferentialOverEuribor;

  const lines: string[] = [
    t.offerCard.variableInitial(f.percent2.format(rate.initialPeriodTin), months),
    t.offerCard.variablePostInitial(f.percent2.format(rate.postFixedDifferentialOverEuribor), months + 1, conditionLabel),
  ];
  if (siblingDifferential !== undefined) {
    lines.push(t.offerCard.variableSiblingDifferential(f.percent2.format(siblingDifferential)));
  }
  let emphasizeIndex: number | undefined;
  if (rate.tae !== null) {
    emphasizeIndex = lines.length;
    lines.push(t.offerCard.variableTae(f.percent2.format(rate.tae)));
  }
  lines.push(t.offerCard.variableReferenceIndexNote());
  lines.push(t.offerCard.variableCapsFloorsNote());
  lines.push(t.offerCard.variableDisclaimer(numberOfHolders));

  return { lines, emphasizeIndex };
}

function writePathCard(
  writer: PdfWriter,
  path: MortgagePathResult,
  t: Dictionary,
  f: Formatters,
  mortgageType: SimulatorInput['mortgageType'],
  numberOfHolders: number,
  taxBreakdown: SimulatorOutput['taxBreakdown'],
  siblingPath?: MortgagePathResult
): void {
  const accent = PATH_ACCENTS[path.channel];
  const channelLabel = t.offerCard.pathLabels[path.channel];

  if (!path.rate.dataAvailable || path.rate.tin === null) {
    writer.card(channelLabel, [{ label: t.pdf.tinTaeLabel, value: t.pdf.marketDataUnavailable }], accent, 2);
    writer.note(t.pdf.quotaNotComputable);
    return;
  }

  const items: StatItem[] = [
    { label: t.pdf.tinTaeLabel, value: formatRateStat(path, t, f) },
    {
      label: t.pdf.ltvLabel,
      value:
        `${f.percent2.format(path.actualLtvPercentage)}%` +
        (path.ltv.wasCapped ? t.pdf.ltvCappedSuffix(f.percent1.format(path.ltv.requestedLtvPercentage)) : ''),
    },
    { label: t.pdf.loanAmountLabel, value: f.currency0.format(path.loanPrincipal) },
    { label: t.pdf.monthlyQuotaLabel, value: f.currency0.format(path.monthlyQuota ?? 0), highlight: true },
    { label: t.pdf.initialContributionLabel, value: f.currency0.format(path.initialContributionRequired) },
    { label: t.pdf.totalCostLabel, value: path.costOfCredit ? f.currency0.format(path.costOfCredit.totalCostOfCredit) : '—' },
  ];

  if (path.riskAssessment) {
    const { immediate, longTerm, reachesLongTermProfile, pendingDebtsRemainingMonths } = path.riskAssessment;
    const showDualProfile = pendingDebtsRemainingMonths > 0 && reachesLongTermProfile;
    items.push({
      label: showDualProfile ? t.pdf.dstiShortTermLabelDual : t.pdf.dstiShortTermLabel,
      value: `${f.percent1.format(immediate.dstiRatio * 100)}% — ${t.labels.riskProfile[immediate.riskProfile]}`,
    });
    if (showDualProfile) {
      items.push({
        label: t.pdf.dstiLongTermLabel,
        value: `${f.percent1.format(longTerm.dstiRatio * 100)}% — ${t.labels.riskProfile[longTerm.riskProfile]}`,
      });
    }
  }

  writer.card(channelLabel, items, accent, 3);

  // Mirrors Screen4BankOffers.tsx's BankPathCard exactly: the variable-rate
  // detail box is only ever shown for the two direct-bank channels (never
  // BROKER — the on-screen UI doesn't render it there either, and its
  // bonified/non-bonified condition wording wouldn't apply to that channel).
  if (mortgageType === 'VARIABLE' && path.channel !== 'BROKER') {
    const variableDetail = buildVariableRateLines(path, siblingPath, numberOfHolders, t, f);
    if (variableDetail) {
      writer.variableRateDetail(variableDetail.lines, variableDetail.emphasizeIndex, accent);
    }
  }

  // Mirrors InitialContributionCard.tsx's own ajdDataMissing check: AJD only
  // applies to NEW_BUILD purchases, and when the CCAA's rate hasn't been
  // sourced, initialContributionRequired silently omits that unknown amount
  // rather than treating it as a confirmed 0 — disclose that explicitly
  // instead of letting the PDF imply the total shown is complete.
  if (taxBreakdown.ajd.applicable && !taxBreakdown.ajd.dataAvailable) {
    writer.note(t.initialContribution.totalExcludesUnavailableTax, PDF_WARNING);
  }

  if (!path.isFullyFinanceable) {
    writer.note(t.pdf.notFullyFinanceableWarning, PDF_WARNING);
  }
  // Mirrors OfferCardParts.tsx's BankViabilityBanner exactly: when the offer above was
  // auto-adjusted down from the requested amount, explain why using the same
  // already-computed figures (this card's own actualLtvPercentage, the sourced
  // DSTI_GREEN_THRESHOLD) and the same 3-language justification copy as the on-screen UI.
  if (path.wasAutoAdjustedForViability && path.bankViability) {
    const adjustedLtvLabel = `${f.percent2.format(path.actualLtvPercentage)}%`;
    const dstiThresholdLabel = `${f.percent1.format(DSTI_GREEN_THRESHOLD * 100)}%`;
    const justification =
      path.bankViability.justificationReason === 'BOTH_EXCEEDED'
        ? t.offerCard.justificationBothExceeded(channelLabel, adjustedLtvLabel, dstiThresholdLabel)
        : path.bankViability.justificationReason === 'LTV_EXCEEDED'
          ? t.offerCard.justificationLtvExceeded(channelLabel, adjustedLtvLabel)
          : t.offerCard.justificationDstiExceeded(channelLabel, adjustedLtvLabel, dstiThresholdLabel);
    writer.note(justification, PDF_WARNING);
  }
}

/**
 * Builds and downloads a summary PDF for a computed three-way simulation:
 * net income, bank-bonified/non-bonified/broker comparison, regional tax
 * breakdown, formalization costs, and a closing acknowledgments block —
 * laid out as modular info-cards, in the requested `language`.
 */
export function generateSimulationPdf({ input, output, ccaaName, language = DEFAULT_LANGUAGE }: GenerateSimulationPdfParams): void {
  const t = getDictionary(language);
  const f = getFormatters(language);
  const doc = new jsPDF();
  const writer = new PdfWriter(doc);

  writer.brandHeading(t.common.brand);
  writer.subtitle(t.pdf.title);
  writer.subtitle(t.pdf.generatedOn(f.dateLong.format(new Date())));
  writer.subtitle(t.pdf.personalizedFor(input.numberOfHolders));

  writer.sectionHeading(t.pdf.section1Title);
  const profileItems: StatItem[] = [{ label: t.pdf.numberOfHoldersLabel, value: String(input.numberOfHolders) }];
  input.holderNames.forEach((name, index) => {
    const age = input.holderAges[index];
    const income = input.monthlyNetIncomes[index];
    const employmentType = input.employmentTypes[index];
    const employmentLabel =
      employmentType === 'OTHER'
        ? `${t.labels.employmentType[employmentType]} (${input.employmentOtherDetails[index]})`
        : t.labels.employmentType[employmentType];
    profileItems.push(
      { label: t.pdf.holderLine(index), value: `${name} — ${t.screen2.ageHint(age)}` },
      { label: t.pdf.employmentStatusLabel(name), value: employmentLabel },
      { label: t.pdf.incomeLabel(name), value: f.currency0.format(income) }
    );
  });
  profileItems.push(
    {
      label: t.pdf.totalIncomeLabel,
      value: f.currency0.format(input.monthlyNetIncomes.reduce((sum, income) => sum + income, 0)),
      highlight: true,
    },
    {
      label: t.pdf.pendingDebtsLabel,
      value:
        f.currency0.format(input.pendingDebts) +
        (input.pendingDebts > 0 ? t.pdf.pendingDebtsWithMonths(input.pendingDebtsRemainingMonths) : ''),
    },
    { label: t.pdf.savingsLabel, value: f.currency0.format(input.availableSavings) }
  );
  writer.card(t.pdf.profileCardTitle, profileItems, PDF_ACCENT_MUSTARD, 2);

  writer.sectionHeading(t.pdf.section2Title);
  writer.card(
    t.pdf.operationCardTitle,
    [
      { label: t.pdf.propertyTypeLabel, value: t.labels.propertyType[input.propertyType] },
      { label: t.pdf.propertyUsageLabel, value: t.labels.propertyUsage[input.propertyUsage] },
      { label: t.pdf.ccaaLabel, value: ccaaName },
      { label: t.pdf.appraisalValueLabel, value: f.currency0.format(input.appraisalValue) },
      { label: t.pdf.purchaseValueLabel, value: f.currency0.format(input.purchaseValue) },
      { label: t.pdf.mortgageTypeLabel, value: t.labels.mortgageType[input.mortgageType] },
      { label: t.pdf.durationLabel, value: t.pdf.durationYearsSuffix(input.durationYears) },
    ],
    PDF_ACCENT_NEUTRAL,
    3
  );

  writer.sectionHeading(t.pdf.section3Title);
  writePathCard(writer, output.bankBonified, t, f, input.mortgageType, input.numberOfHolders, output.taxBreakdown, output.bankNonBonified);
  writePathCard(writer, output.bankNonBonified, t, f, input.mortgageType, input.numberOfHolders, output.taxBreakdown);
  writePathCard(writer, output.broker, t, f, input.mortgageType, input.numberOfHolders, output.taxBreakdown);
  if (output.broker.rate.dataAvailable && output.broker.rate.tin !== null) {
    // Mirrors Screen5BrokerOffer.tsx's BrokerStrategyCard: same shared text builder, so UI and PDF always agree.
    const strategyText = buildBrokerStrategyText(output, t, f);
    writer.note(strategyText.title, PDF_ACCENT_NEUTRAL);
    strategyText.paragraphs.forEach((paragraph) => writer.note(paragraph));
    strategyText.conditions.forEach((condition) => writer.note(`• ${condition}`));
  }

  writer.sectionHeading(t.pdf.section4Title);
  const itpApplicable = output.taxBreakdown.itp.applicable;
  const ajdApplicable = output.taxBreakdown.ajd.applicable;
  const taxItems: StatItem[] = [{ label: t.pdf.taxableBaseLabel, value: f.currency0.format(output.taxBreakdown.taxableBase) }];
  if (itpApplicable) {
    const itpRateLabel = output.taxBreakdown.itp.usedProgressiveBrackets
      ? t.pdf.itpProgressiveBrackets
      : `${f.percent1.format(output.taxBreakdown.itp.ratePercentage ?? 0)}%`;
    taxItems.push({ label: t.pdf.itpLabel(itpRateLabel), value: f.currency0.format(output.taxBreakdown.itp.amount) });
  }
  if (ajdApplicable) {
    taxItems.push({
      label: output.taxBreakdown.ajd.dataAvailable
        ? t.pdf.ajdLabel(`${f.percent1.format(output.taxBreakdown.ajd.ratePercentage ?? 0)}%`)
        : t.pdf.ajdFallbackLabel,
      value: output.taxBreakdown.ajd.dataAvailable ? f.currency0.format(output.taxBreakdown.ajd.amount) : t.pdf.ajdUnavailable,
    });
  }
  // AJD applicable-but-unavailable (see the ajdFallbackLabel/ajdUnavailable
  // row above) means totalTaxAmount is really "0 known + 1 unknown", not a
  // confirmed zero — show "not available" for the total too, rather than
  // silently implying the AJD is 0.
  const taxTotalUnknown = ajdApplicable && !output.taxBreakdown.ajd.dataAvailable;
  taxItems.push(
    {
      label: t.pdf.totalTaxLabel,
      value: taxTotalUnknown ? t.pdf.notAvailable : f.currency0.format(output.taxBreakdown.totalTaxAmount),
    },
    { label: t.pdf.notaryPurchaseLabel, value: f.currency0.format(output.formalizationCosts.notaryFeePurchase.totalAmount) },
    { label: t.pdf.registryPurchaseLabel, value: f.currency0.format(output.formalizationCosts.registryFeePurchase) },
    { label: t.pdf.mortgageFormalizationLabel, value: t.pdf.mortgageFormalizationValue },
    { label: t.pdf.totalFormalizationLabel, value: f.currency0.format(output.formalizationCosts.totalAmount), highlight: true }
  );
  writer.card(t.pdf.taxCardTitle, taxItems, PDF_ACCENT_NEUTRAL, 2);

  writer.gap();
  writer.note(t.pdf.disclaimer);
  writer.gap();

  writer.brandHeading(t.pdf.thanksHeading, 14);
  writer.paragraph(t.pdf.thanksBody(input.numberOfHolders));

  const dateStamp = new Date().toISOString().slice(0, 10);
  doc.save(`informe-hipotecari-${dateStamp}.pdf`);
}
