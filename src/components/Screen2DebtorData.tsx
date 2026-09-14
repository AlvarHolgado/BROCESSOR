/**
 * SCREEN 2 of the wizard: holder count, per-holder identity (name + age)
 * collected BEFORE financial income, then per-holder employment status,
 * income, and existing debts. Property/financing questions live on Screen 3
 * instead (Screen3PropertyFinancing.tsx). Text comes from the active
 * language's Dictionary (see /i18n) via useLanguage().
 */

import type { ChangeEvent, CSSProperties } from 'react';
import type { SimulatorFieldErrors, SimulatorFormState } from '../hooks/useSimulator';
import { COLORS } from '../styles/theme';
import { MAX_MORTGAGE_HOLDERS, type EmploymentType } from '../types/simulator';
import { blurNumberInputOnWheel } from '../utils/domEvents';
import { buildAddressLabel } from '../utils/grammar';
import { useLanguage } from '../i18n/LanguageContext';
import { CardOptionGroup, QuestionBlock, WizardField, wizardInputStyle } from './WizardFormControls';

type NonHolderField = 'holderNames' | 'holderAges' | 'employmentTypes' | 'employmentOtherDetails' | 'monthlyNetIncomes';

export interface Screen2DebtorDataProps {
  values: SimulatorFormState;
  errors: SimulatorFieldErrors;
  setField: (field: keyof Omit<SimulatorFormState, NonHolderField>, value: string) => void;
  setNumberOfHolders: (count: number) => void;
  setHolderName: (index: number, value: string) => void;
  setHolderAge: (index: number, value: string) => void;
  setEmploymentType: (index: number, value: string) => void;
  setEmploymentOtherDetail: (index: number, value: string) => void;
  setHolderIncome: (index: number, value: string) => void;
}

const introStyle: CSSProperties = {
  color: COLORS.textSecondary,
  fontSize: '0.95rem',
  margin: '0 0 1.5rem 0',
};

const holderCountGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: '0.75rem',
};

const holderBlockStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.75rem',
};

const holderPairGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)',
  gap: '0.75rem',
};

const holderTotalStyle: CSSProperties = {
  fontWeight: 700,
  color: COLORS.textPrimary,
  fontSize: '0.95rem',
};

function capitalizeFirst(text: string): string {
  return text.length > 0 ? text[0].toUpperCase() + text.slice(1) : text;
}

export function Screen2DebtorData({
  values,
  errors,
  setField,
  setNumberOfHolders,
  setHolderName,
  setHolderAge,
  setEmploymentType,
  setEmploymentOtherDetail,
  setHolderIncome,
}: Screen2DebtorDataProps) {
  const { t, formatters } = useLanguage();

  const handleTextChange =
    (field: keyof Omit<SimulatorFormState, NonHolderField>) => (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setField(field, event.target.value);
    };

  const numberOfHolders = Number(values.numberOfHolders) || 0;
  const holderCountCategory: '1' | '2' | 'MORE' | '' =
    values.numberOfHolders === '1' ? '1' : values.numberOfHolders === '2' ? '2' : numberOfHolders > 2 ? 'MORE' : '';

  const totalMonthlyIncome = values.monthlyNetIncomes.reduce((sum, income) => sum + (Number(income) || 0), 0);
  const addressLabel = buildAddressLabel(values.holderNames, numberOfHolders, t.common.conjunction);
  const vocative = addressLabel ? `${addressLabel}, ` : '';

  const holderLabel = (name: string | undefined, index: number): string => name?.trim() || t.screen2.holderFallbackLabel(index);

  const introText = t.screen2.intro(numberOfHolders, vocative);
  const employmentHeading = t.screen2.employmentHeading(numberOfHolders);
  const debtsHeading = t.screen2.debtsHeading(numberOfHolders, vocative);
  const savingsHeading = t.screen2.savingsHeading(numberOfHolders, vocative);

  const HOLDER_COUNT_OPTIONS: Array<{ value: '1' | '2' | 'MORE'; label: string }> = [
    { value: '1', label: t.screen2.holderCountOne },
    { value: '2', label: t.screen2.holderCountTwo },
    { value: 'MORE', label: t.screen2.holderCountMore },
  ];

  const EMPLOYMENT_TYPE_OPTIONS = Object.keys(t.labels.employmentType) as EmploymentType[];

  return (
    <div>
      <p style={introStyle}>{capitalizeFirst(introText)}</p>

      <QuestionBlock id="question-numberOfHolders" heading={t.screen2.numberOfHoldersHeading}>
        <div style={holderCountGridStyle}>
          <CardOptionGroup
            ariaLabel={t.screen2.numberOfHoldersHeading}
            options={HOLDER_COUNT_OPTIONS}
            selected={holderCountCategory}
            onSelect={(value) => {
              if (value === '1') setNumberOfHolders(1);
              else if (value === '2') setNumberOfHolders(2);
              else if (numberOfHolders <= 2) setNumberOfHolders(3);
            }}
          />
        </div>
        {holderCountCategory === 'MORE' && (
          <WizardField id="numberOfHolders" label={t.screen2.exactHolderCountLabel} error={errors.numberOfHolders}>
            <input
              id="numberOfHolders"
              type="number"
              min={3}
              max={MAX_MORTGAGE_HOLDERS}
              style={wizardInputStyle}
              value={values.numberOfHolders}
              onChange={(event) => setNumberOfHolders(Number(event.target.value) || 3)}
              onWheel={blurNumberInputOnWheel}
            />
          </WizardField>
        )}
      </QuestionBlock>

      {numberOfHolders > 0 && (
        <QuestionBlock heading={t.screen2.whoAreYouHeading} helper={t.screen2.whoAreYouHelper}>
          <div style={holderBlockStyle}>
            {Array.from({ length: numberOfHolders }, (_, index) => (
              <div key={index} style={holderPairGridStyle}>
                <WizardField id={`holderName-${index}`} label={t.screen2.holderNameLabel(index)}>
                  <input
                    id={`holderName-${index}`}
                    type="text"
                    style={wizardInputStyle}
                    value={values.holderNames[index] ?? ''}
                    onChange={(event) => setHolderName(index, event.target.value)}
                  />
                </WizardField>
                <WizardField
                  id={`holderAge-${index}`}
                  label={t.screen2.holderAgeLabel(index)}
                  hint={Number(values.holderAges[index]) > 0 ? t.screen2.ageHint(Number(values.holderAges[index])) : undefined}
                >
                  <input
                    id={`holderAge-${index}`}
                    type="number"
                    style={wizardInputStyle}
                    value={values.holderAges[index] ?? ''}
                    onChange={(event) => setHolderAge(index, event.target.value)}
                    onWheel={blurNumberInputOnWheel}
                  />
                </WizardField>
              </div>
            ))}
            {errors.holderNames && (
              <span role="alert" style={{ color: COLORS.error, fontSize: '0.8rem' }}>
                {errors.holderNames}
              </span>
            )}
            {errors.holderAges && (
              <span role="alert" style={{ color: COLORS.error, fontSize: '0.8rem' }}>
                {errors.holderAges}
              </span>
            )}
          </div>
        </QuestionBlock>
      )}

      {numberOfHolders > 0 && (
        <QuestionBlock heading={employmentHeading}>
          <div style={holderBlockStyle}>
            {Array.from({ length: numberOfHolders }, (_, index) => (
              <div key={index} style={holderBlockStyle}>
                <WizardField id={`employmentType-${index}`} label={t.screen2.employmentTypeLabel(holderLabel(values.holderNames[index], index))}>
                  <select
                    id={`employmentType-${index}`}
                    style={wizardInputStyle}
                    value={values.employmentTypes[index] ?? ''}
                    onChange={(event) => setEmploymentType(index, event.target.value)}
                  >
                    <option value="">{t.screen2.selectPlaceholder}</option>
                    {EMPLOYMENT_TYPE_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {t.labels.employmentType[option]}
                      </option>
                    ))}
                  </select>
                </WizardField>
                {values.employmentTypes[index] === 'OTHER' && (
                  <WizardField
                    id={`employmentOtherDetail-${index}`}
                    label={t.screen2.employmentOtherLabel(holderLabel(values.holderNames[index], index))}
                  >
                    <input
                      id={`employmentOtherDetail-${index}`}
                      type="text"
                      style={wizardInputStyle}
                      value={values.employmentOtherDetails[index] ?? ''}
                      onChange={(event) => setEmploymentOtherDetail(index, event.target.value)}
                      placeholder={t.screen2.employmentOtherPlaceholder}
                    />
                  </WizardField>
                )}
              </div>
            ))}
            {errors.employmentTypes && (
              <span role="alert" style={{ color: COLORS.error, fontSize: '0.8rem' }}>
                {errors.employmentTypes}
              </span>
            )}
            {errors.employmentOtherDetails && (
              <span role="alert" style={{ color: COLORS.error, fontSize: '0.8rem' }}>
                {errors.employmentOtherDetails}
              </span>
            )}
          </div>
        </QuestionBlock>
      )}

      {numberOfHolders > 0 && (
        <QuestionBlock heading={t.screen2.incomeHeading} helper={t.screen2.incomeHelper}>
          <div style={holderBlockStyle}>
            {Array.from({ length: numberOfHolders }, (_, index) => (
              <WizardField
                key={index}
                id={`holderIncome-${index}`}
                label={t.screen2.incomeFieldLabel(holderLabel(values.holderNames[index], index))}
                hint={
                  Number(values.monthlyNetIncomes[index]) > 0
                    ? formatters.currency0.format(Number(values.monthlyNetIncomes[index]))
                    : undefined
                }
              >
                <input
                  id={`holderIncome-${index}`}
                  type="number"
                  style={wizardInputStyle}
                  value={values.monthlyNetIncomes[index] ?? ''}
                  onChange={(event) => setHolderIncome(index, event.target.value)}
                  onWheel={blurNumberInputOnWheel}
                />
              </WizardField>
            ))}
            {errors.monthlyNetIncomes && (
              <span role="alert" style={{ color: COLORS.error, fontSize: '0.8rem' }}>
                {errors.monthlyNetIncomes}
              </span>
            )}
            <span style={holderTotalStyle}>
              {t.screen2.totalIncomeLabel}: {formatters.currency0.format(totalMonthlyIncome)}
            </span>
          </div>
        </QuestionBlock>
      )}

      <QuestionBlock heading={capitalizeFirst(debtsHeading)}>
        <WizardField
          id="pendingDebts"
          label={t.screen2.pendingDebtsLabel}
          error={errors.pendingDebts}
          hint={Number(values.pendingDebts) > 0 ? formatters.currency0.format(Number(values.pendingDebts)) : undefined}
        >
          <input
            id="pendingDebts"
            type="number"
            style={wizardInputStyle}
            value={values.pendingDebts}
            onChange={handleTextChange('pendingDebts')}
            onWheel={blurNumberInputOnWheel}
            aria-invalid={Boolean(errors.pendingDebts)}
          />
        </WizardField>
        {Number(values.pendingDebts) > 0 && (
          <WizardField
            id="pendingDebtsRemainingMonths"
            label={t.screen2.pendingDebtsRemainingLabel}
            error={errors.pendingDebtsRemainingMonths}
            hint={
              Number(values.pendingDebtsRemainingMonths) > 0
                ? t.screen2.monthsHint(Number(values.pendingDebtsRemainingMonths))
                : undefined
            }
          >
            <input
              id="pendingDebtsRemainingMonths"
              type="number"
              style={wizardInputStyle}
              value={values.pendingDebtsRemainingMonths}
              onChange={handleTextChange('pendingDebtsRemainingMonths')}
              onWheel={blurNumberInputOnWheel}
              aria-invalid={Boolean(errors.pendingDebtsRemainingMonths)}
            />
          </WizardField>
        )}
      </QuestionBlock>

      <QuestionBlock heading={capitalizeFirst(savingsHeading)}>
        <WizardField
          id="availableSavings"
          label={t.screen2.savingsLabel}
          error={errors.availableSavings}
          hint={Number(values.availableSavings) > 0 ? formatters.currency0.format(Number(values.availableSavings)) : undefined}
        >
          <input
            id="availableSavings"
            type="number"
            style={wizardInputStyle}
            value={values.availableSavings}
            onChange={handleTextChange('availableSavings')}
            onWheel={blurNumberInputOnWheel}
            aria-invalid={Boolean(errors.availableSavings)}
          />
        </WizardField>
      </QuestionBlock>
    </div>
  );
}
