/**
 * SCREEN 7 of the wizard: "Descàrrega PDF" — a clean layout focused on
 * generating and downloading the official PDF report. Deliberately has no
 * key-metrics summary block (that was Screen5Summary's old "Resum" card,
 * removed per the 8-screen redesign) — saving/comparing scenarios is kept
 * as a secondary, visually de-emphasized utility below the main CTA.
 */

import type { CSSProperties } from 'react';
import type { SimulatorOutput } from '../engine/simulate';
import type { SimulatorInput } from '../types/simulator';
import { COLORS } from '../styles/theme';
import { useLanguage } from '../i18n/LanguageContext';
import { ExportButton } from './ExportButton';
import { SavedScenariosPanel, type SavedScenariosPanelProps } from './SavedScenariosPanel';

export interface Screen7PdfDownloadProps {
  input: SimulatorInput;
  output: SimulatorOutput;
  ccaaName: string;
  savedScenariosProps: SavedScenariosPanelProps;
}

const downloadSectionStyle: CSSProperties = {
  textAlign: 'center',
  padding: '2.5rem 1.5rem',
  borderRadius: '0.9rem',
  border: `2px solid ${COLORS.brand.mustard}`,
  backgroundColor: COLORS.brand.mustardTint,
  marginBottom: '2rem',
};

const downloadTitleStyle: CSSProperties = {
  margin: '0 0 0.4rem 0',
  fontSize: '1.3rem',
  color: COLORS.textPrimary,
};

const downloadHelperStyle: CSSProperties = {
  color: COLORS.textSecondary,
  fontSize: '0.95rem',
  margin: '0 0 1.5rem 0',
};

const secondarySectionLabelStyle: CSSProperties = {
  color: COLORS.textSecondary,
  fontSize: '0.85rem',
  fontWeight: 700,
  margin: '0 0 0.75rem 0',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
};

export function Screen7PdfDownload({ input, output, ccaaName, savedScenariosProps }: Screen7PdfDownloadProps) {
  const { t } = useLanguage();
  const downloadHelperText = t.screen7.intro(input.numberOfHolders);

  return (
    <div>
      <div style={downloadSectionStyle}>
        <h3 style={downloadTitleStyle}>{t.screen7.downloadTitle}</h3>
        <p style={downloadHelperStyle}>{downloadHelperText}</p>
        <ExportButton input={input} output={output} ccaaName={ccaaName} />
      </div>

      <p style={secondarySectionLabelStyle}>{t.screen7.optionalLabel}</p>
      <SavedScenariosPanel {...savedScenariosProps} />
    </div>
  );
}
