/**
 * Shared presentational building blocks for the wizard's Screen 1 data-entry
 * form: the CaixaBank-style split-layout question block (bold heading on the
 * left, interactive controls on the right), rounded card-selector buttons
 * with an active border state, and a labeled text/number field with inline
 * Catalan validation feedback. Purely presentational — no validation logic
 * lives here, only the visual pattern reused across every question.
 */

import type { CSSProperties, ReactNode } from 'react';
import { COLORS } from '../styles/theme';

const questionBlockStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(220px, 1fr) minmax(260px, 1.4fr)',
  gap: '1.5rem',
  padding: '1.75rem 0',
  borderBottom: `1px solid ${COLORS.border}33`,
  alignItems: 'start',
};

const questionHeadingColumnStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
};

const questionHeadingStyle: CSSProperties = {
  fontSize: '1.4rem',
  fontWeight: 800,
  color: COLORS.textPrimary,
  margin: 0,
  lineHeight: 1.25,
};

const questionHelperStyle: CSSProperties = {
  color: COLORS.textSecondary,
  fontSize: '0.9rem',
  margin: 0,
};

const questionControlsColumnStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem',
};

export interface QuestionBlockProps {
  /** Optional DOM id for the wrapping block — lets the chat assistant scroll a card-selector question (which has no single input element) into view. */
  id?: string;
  heading: string;
  helper?: string;
  children: ReactNode;
}

/** Split layout: a large bold question on the left, its controls on the right — collapses to a single column on narrow viewports via the wizard's own media query in global.css. */
export function QuestionBlock({ id, heading, helper, children }: QuestionBlockProps) {
  return (
    <div id={id} style={questionBlockStyle} className="wizard-question-block">
      <div style={questionHeadingColumnStyle}>
        <h3 style={questionHeadingStyle}>{heading}</h3>
        {helper && <p style={questionHelperStyle}>{helper}</p>}
      </div>
      <div style={questionControlsColumnStyle}>{children}</div>
    </div>
  );
}

const cardOptionGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
  gap: '0.75rem',
};

function cardOptionStyle(active: boolean, disabled: boolean): CSSProperties {
  return {
    padding: '0.9rem 1rem',
    borderRadius: '0.75rem',
    border: `2px solid ${active ? COLORS.brand.mustard : COLORS.border}${active ? '' : '55'}`,
    backgroundColor: active ? COLORS.brand.mustardTint : COLORS.surface,
    color: disabled ? COLORS.textSecondary : COLORS.textPrimary,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.6 : 1,
    fontWeight: active ? 700 : 500,
    textAlign: 'left',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.15rem',
    boxShadow: active ? '0 1px 2px rgba(217, 159, 38, 0.35)' : 'none',
  };
}

const cardOptionNoteStyle: CSSProperties = {
  fontSize: '0.75rem',
  color: COLORS.textSecondary,
  fontWeight: 400,
};

export interface CardOption<T extends string> {
  value: T;
  label: string;
  disabled?: boolean;
  /** Small secondary line under the label, e.g. "Properament" for a disabled option. */
  note?: string;
}

export interface CardOptionGroupProps<T extends string> {
  options: Array<CardOption<T>>;
  selected: T | '';
  onSelect: (value: T) => void;
  ariaLabel: string;
}

/** Rounded card-selector buttons with an active border/tint state, replacing plain <select> dropdowns for small enumerated choices. */
export function CardOptionGroup<T extends string>({ options, selected, onSelect, ariaLabel }: CardOptionGroupProps<T>) {
  return (
    <div role="group" aria-label={ariaLabel} style={cardOptionGridStyle}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          style={cardOptionStyle(selected === option.value, Boolean(option.disabled))}
          disabled={option.disabled}
          aria-pressed={selected === option.value}
          onClick={() => onSelect(option.value)}
        >
          <span>{option.label}</span>
          {option.note && <span style={cardOptionNoteStyle}>{option.note}</span>}
        </button>
      ))}
    </div>
  );
}

const fieldStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.35rem',
};

const labelStyle: CSSProperties = {
  color: COLORS.textPrimary,
  fontSize: '0.875rem',
  fontWeight: 600,
};

export const wizardInputStyle: CSSProperties = {
  padding: '0.7rem 0.85rem',
  borderRadius: '0.65rem',
  border: `1.5px solid ${COLORS.border}55`,
  backgroundColor: COLORS.surface,
  color: COLORS.textPrimary,
  fontSize: '1rem',
};

const errorStyle: CSSProperties = {
  color: COLORS.error,
  fontSize: '0.8rem',
};

const hintStyle: CSSProperties = {
  color: COLORS.brand.mustard,
  fontSize: '0.95rem',
  fontWeight: 700,
};

export interface WizardFieldProps {
  id: string;
  /**
   * DOM id for the wrapping div, ONLY for fields whose children have no
   * focusable input of their own to scroll to (a CardOptionGroup) — e.g.
   * propertyType/mortgageType. Omit for ordinary input/select fields, since
   * those already carry `id` on the input itself; setting the same id on
   * both would create a duplicate-id collision in the DOM.
   */
  wrapperId?: string;
  label: string;
  error?: string;
  /** Formatted echo of the field's current parsed value (e.g. "1.200 €"), shown directly under the input — see Screen2DebtorData/Screen3PropertyFinancing for usage. */
  hint?: ReactNode;
  children: ReactNode;
}

/** Labeled input wrapper with inline Catalan error feedback, styled as a rounded card input. */
export function WizardField({ id, wrapperId, label, error, hint, children }: WizardFieldProps) {
  return (
    <div id={wrapperId} style={fieldStyle}>
      <label htmlFor={id} style={labelStyle}>
        {label}
      </label>
      {children}
      {hint && <span style={hintStyle}>{hint}</span>}
      {error && (
        <span id={`${id}-error`} role="alert" style={errorStyle}>
          {error}
        </span>
      )}
    </div>
  );
}
