/**
 * Save the current simulation as a named scenario, and compare up to
 * several saved scenarios side by side. Pure presentational wrapper around
 * useSavedSimulations (see /hooks) — no calculation happens here.
 */

import { useState, type CSSProperties } from 'react';
import type { SavedSimulation } from '../hooks/useSavedSimulations';
import { COLORS } from '../styles/theme';
import { useLanguage } from '../i18n/LanguageContext';

export interface SavedScenariosPanelProps {
  onSaveCurrent: (name: string) => void;
  savedSimulations: SavedSimulation[];
  selectedIds: string[];
  onToggleSelected: (id: string) => void;
  onDelete: (id: string) => void;
  onClearSelection: () => void;
  comparedSimulations: SavedSimulation[];
}

const sectionStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem',
  border: `1px solid ${COLORS.border}33`,
  borderRadius: '0.9rem',
  padding: '1.25rem 1.4rem',
  backgroundColor: COLORS.surface,
};

const legendStyle: CSSProperties = {
  color: COLORS.textPrimary,
  fontWeight: 700,
  padding: '0 0.2rem',
  fontSize: '1.05rem',
};

const fieldGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: '1rem',
};

const fieldStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.3rem',
};

const labelStyle: CSSProperties = {
  color: COLORS.textPrimary,
  fontSize: '0.875rem',
  fontWeight: 600,
};

const inputStyle: CSSProperties = {
  padding: '0.6rem 0.75rem',
  borderRadius: '0.6rem',
  border: `1.5px solid ${COLORS.border}55`,
  backgroundColor: COLORS.surface,
  color: COLORS.textPrimary,
  fontSize: '1rem',
};

// Visual treatment comes from the shared .btn-pill-outline class in global.css.
const secondaryButtonStyle: CSSProperties = {
  padding: '0.6rem 1.4rem',
};

const savedRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
  padding: '0.4rem 0',
  borderBottom: `1px solid ${COLORS.border}22`,
};

const deleteButtonStyle: CSSProperties = {
  marginLeft: 'auto',
  padding: '0.3rem 0.7rem',
  borderRadius: '0.5rem',
  border: `1px solid ${COLORS.risk.RED.border}`,
  backgroundColor: 'transparent',
  color: COLORS.risk.RED.text,
  cursor: 'pointer',
};

const savedTableStyle: CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: '0.875rem',
};

const savedThStyle: CSSProperties = {
  textAlign: 'left',
  padding: '0.4rem 0.6rem',
  borderBottom: `1px solid ${COLORS.border}55`,
};

const savedTdStyle: CSSProperties = {
  padding: '0.4rem 0.6rem',
  borderBottom: `1px solid ${COLORS.border}22`,
};

export function SavedScenariosPanel({
  onSaveCurrent,
  savedSimulations,
  selectedIds,
  onToggleSelected,
  onDelete,
  onClearSelection,
  comparedSimulations,
}: SavedScenariosPanelProps) {
  const { t, formatters } = useLanguage();
  const [scenarioName, setScenarioName] = useState('');

  const handleSave = () => {
    const trimmedName = scenarioName.trim();
    if (!trimmedName) {
      return;
    }
    onSaveCurrent(trimmedName);
    setScenarioName('');
  };

  return (
    <fieldset style={sectionStyle}>
      <legend style={legendStyle}>{t.savedScenarios.legend}</legend>

      <div style={fieldGridStyle}>
        <div style={fieldStyle}>
          <label htmlFor="scenarioName" style={labelStyle}>
            {t.savedScenarios.nameLabel}
          </label>
          <input
            id="scenarioName"
            type="text"
            style={inputStyle}
            value={scenarioName}
            onChange={(event) => setScenarioName(event.target.value)}
            placeholder={t.savedScenarios.namePlaceholder}
          />
        </div>
        <button
          type="button"
          className="btn-pill-outline"
          style={{ ...secondaryButtonStyle, alignSelf: 'flex-end' }}
          onClick={handleSave}
          disabled={scenarioName.trim() === ''}
        >
          {t.savedScenarios.saveCta}
        </button>
      </div>

      {savedSimulations.length === 0 && (
        <p style={{ color: COLORS.textSecondary, fontSize: '0.875rem' }}>{t.savedScenarios.emptyState}</p>
      )}

      {savedSimulations.map((simulation) => (
        <div key={simulation.id} style={savedRowStyle}>
          <input
            type="checkbox"
            checked={selectedIds.includes(simulation.id)}
            onChange={() => onToggleSelected(simulation.id)}
            aria-label={t.savedScenarios.selectForCompareAria(simulation.name)}
          />
          <div>
            <strong>{simulation.name}</strong>
            <div style={{ color: COLORS.textSecondary, fontSize: '0.8rem' }}>
              {t.savedScenarios.savedOn(formatters.dateMedium.format(new Date(simulation.savedAt)))} ·{' '}
              {simulation.output.bankBonified.monthlyQuota !== null
                ? t.savedScenarios.quotaSuffix(formatters.currency0.format(simulation.output.bankBonified.monthlyQuota))
                : t.savedScenarios.quotaUnavailable}
            </div>
          </div>
          <button type="button" style={deleteButtonStyle} onClick={() => onDelete(simulation.id)}>
            {t.savedScenarios.deleteCta}
          </button>
        </div>
      ))}

      {comparedSimulations.length >= 2 && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h4 style={{ color: COLORS.textPrimary, margin: '0.5rem 0' }}>{t.savedScenarios.comparisonHeading}</h4>
            <button type="button" className="btn-pill-outline" style={secondaryButtonStyle} onClick={onClearSelection}>
              {t.savedScenarios.clearSelectionCta}
            </button>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={savedTableStyle}>
              <thead>
                <tr>
                  <th style={savedThStyle}>{t.savedScenarios.metricHeader}</th>
                  {comparedSimulations.map((simulation) => (
                    <th key={simulation.id} style={savedThStyle}>
                      {simulation.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={savedTdStyle}>{t.savedScenarios.monthlyQuotaMetric}</td>
                  {comparedSimulations.map((simulation) => (
                    <td key={simulation.id} style={savedTdStyle}>
                      {simulation.output.bankBonified.monthlyQuota !== null
                        ? formatters.currency0.format(simulation.output.bankBonified.monthlyQuota)
                        : t.savedScenarios.notAvailable}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td style={savedTdStyle}>{t.savedScenarios.ltvMetric}</td>
                  {comparedSimulations.map((simulation) => (
                    <td key={simulation.id} style={savedTdStyle}>
                      {formatters.dstiPercent.format(simulation.output.bankBonified.actualLtvPercentage / 100)}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td style={savedTdStyle}>{t.savedScenarios.dstiMetric}</td>
                  {comparedSimulations.map((simulation) => (
                    <td key={simulation.id} style={savedTdStyle}>
                      {simulation.output.bankBonified.riskAssessment
                        ? formatters.dstiPercent.format(simulation.output.bankBonified.riskAssessment.immediate.dstiRatio)
                        : t.savedScenarios.notAvailable}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td style={savedTdStyle}>{t.savedScenarios.riskProfileMetric}</td>
                  {comparedSimulations.map((simulation) => (
                    <td key={simulation.id} style={savedTdStyle}>
                      {simulation.output.bankBonified.riskAssessment
                        ? t.labels.riskProfile[simulation.output.bankBonified.riskAssessment.immediate.riskProfile]
                        : t.savedScenarios.notAvailable}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </fieldset>
  );
}
