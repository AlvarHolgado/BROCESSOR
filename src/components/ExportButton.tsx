/**
 * Triggers the PDF summary report download for a computed simulation, in
 * the currently active UI language (see /i18n).
 */

import { useState, type CSSProperties } from 'react';
import { generateSimulationPdf } from '../utils/exportPdf';
import type { SimulatorOutput } from '../engine/simulate';
import { COLORS } from '../styles/theme';
import type { SimulatorInput } from '../types/simulator';
import { useLanguage } from '../i18n/LanguageContext';

export interface ExportButtonProps {
  input: SimulatorInput;
  output: SimulatorOutput;
  ccaaName: string;
}

// Visual treatment comes from the shared .btn-pill class in global.css.
const buttonStyle: CSSProperties = {
  padding: '0.6rem 1.4rem',
  fontWeight: 700,
  alignSelf: 'flex-start',
};

export function ExportButton({ input, output, ccaaName }: ExportButtonProps) {
  const { t, language } = useLanguage();
  const [error, setError] = useState<string | null>(null);

  const handleClick = () => {
    try {
      setError(null);
      generateSimulationPdf({ input, output, ccaaName, language });
    } catch {
      setError(t.exportButton.errorMessage);
    }
  };

  return (
    <div>
      <button type="button" className="btn-pill" style={buttonStyle} onClick={handleClick}>
        {t.exportButton.downloadCta}
      </button>
      {error && (
        <p role="alert" style={{ color: COLORS.error, fontSize: '0.85rem' }}>
          {error}
        </p>
      )}
    </div>
  );
}
