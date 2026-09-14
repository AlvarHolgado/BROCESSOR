/**
 * SCREEN 3 of the wizard: property price/type/usage/region, and the desired
 * financing terms (LTV, term, mortgage type). Debtor-profile questions live
 * on Screen 2 instead. Text comes from the active language's Dictionary
 * (see /i18n) via useLanguage().
 */

import type { ChangeEvent, CSSProperties } from 'react';
import { CCAA_OPTIONS } from '../data/ccaaOptions';
import type { SimulatorFieldErrors, SimulatorFormState } from '../hooks/useSimulator';
import { COLORS } from '../styles/theme';
import type { MortgageType, PropertyType, PropertyUsage } from '../types/simulator';
import { blurNumberInputOnWheel } from '../utils/domEvents';
import { useLanguage } from '../i18n/LanguageContext';
import { getCcaaName } from '../i18n/ccaaNames';
import { CardOptionGroup, QuestionBlock, WizardField, wizardInputStyle } from './WizardFormControls';

export interface Screen3PropertyFinancingProps {
  values: SimulatorFormState;
  errors: SimulatorFieldErrors;
  numberOfHolders: number;
  setField: (field: keyof Omit<SimulatorFormState, 'holderNames' | 'holderAges' | 'employmentTypes' | 'employmentOtherDetails' | 'monthlyNetIncomes'>, value: string) => void;
}

const introStyle: CSSProperties = {
  color: COLORS.textSecondary,
  fontSize: '0.95rem',
  margin: '0 0 1.5rem 0',
};

export function Screen3PropertyFinancing({ values, errors, numberOfHolders, setField }: Screen3PropertyFinancingProps) {
  const { t, language, formatters } = useLanguage();

  const handleTextChange =
    (field: keyof Omit<SimulatorFormState, 'holderNames' | 'holderAges' | 'employmentTypes' | 'employmentOtherDetails' | 'monthlyNetIncomes'>) =>
    (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setField(field, event.target.value);
    };

  const introText = t.screen3.intro(numberOfHolders);

  return (
    <div>
      <p style={introStyle}>{introText}</p>

      <QuestionBlock heading={t.screen3.purchaseValueHeading}>
        <WizardField
          id="purchaseValue"
          label={t.screen3.purchaseValueLabel}
          error={errors.purchaseValue}
          hint={Number(values.purchaseValue) > 0 ? formatters.currency0.format(Number(values.purchaseValue)) : undefined}
        >
          <input
            id="purchaseValue"
            type="number"
            style={wizardInputStyle}
            value={values.purchaseValue}
            onChange={handleTextChange('purchaseValue')}
            onWheel={blurNumberInputOnWheel}
            aria-invalid={Boolean(errors.purchaseValue)}
          />
        </WizardField>
        <WizardField
          id="appraisalValue"
          label={t.screen3.appraisalValueLabel}
          error={errors.appraisalValue}
          hint={Number(values.appraisalValue) > 0 ? formatters.currency0.format(Number(values.appraisalValue)) : undefined}
        >
          <input
            id="appraisalValue"
            type="number"
            style={wizardInputStyle}
            value={values.appraisalValue}
            onChange={handleTextChange('appraisalValue')}
            onWheel={blurNumberInputOnWheel}
            aria-invalid={Boolean(errors.appraisalValue)}
          />
        </WizardField>
        <WizardField id="propertyType" wrapperId="propertyType" label={t.screen3.propertyTypeLabel} error={errors.propertyType}>
          <CardOptionGroup
            ariaLabel={t.screen3.propertyTypeLabel}
            options={(Object.keys(t.labels.propertyType) as PropertyType[]).map((option) => ({
              value: option,
              label: t.labels.propertyType[option],
            }))}
            selected={values.propertyType as PropertyType | ''}
            onSelect={(value) => setField('propertyType', value)}
          />
        </WizardField>
      </QuestionBlock>

      <QuestionBlock id="question-propertyUsage" heading={t.screen3.propertyUsageHeading}>
        <CardOptionGroup
          ariaLabel={t.screen3.propertyUsageHeading}
          options={(Object.keys(t.labels.propertyUsage) as PropertyUsage[]).map((option) => ({
            value: option,
            label: t.labels.propertyUsage[option],
          }))}
          selected={values.propertyUsage as PropertyUsage | ''}
          onSelect={(value) => setField('propertyUsage', value)}
        />
        {errors.propertyUsage && (
          <span role="alert" style={{ color: COLORS.error, fontSize: '0.8rem' }}>
            {errors.propertyUsage}
          </span>
        )}
      </QuestionBlock>

      <QuestionBlock heading={t.screen3.ccaaHeading} helper={t.screen3.ccaaHelper}>
        <WizardField id="ccaa" label={t.screen3.ccaaLabel} error={errors.ccaa}>
          <select
            id="ccaa"
            style={wizardInputStyle}
            value={values.ccaa}
            onChange={handleTextChange('ccaa')}
            aria-invalid={Boolean(errors.ccaa)}
          >
            <option value="">{t.screen2.selectPlaceholder}</option>
            {CCAA_OPTIONS.map((option) => (
              <option key={option.code} value={option.code}>
                {getCcaaName(option.code, language, option.name)}
              </option>
            ))}
          </select>
        </WizardField>
      </QuestionBlock>

      <QuestionBlock heading={t.screen3.ltvHeading} helper={t.screen3.ltvHelper}>
        <WizardField
          id="requestedLtvPercentage"
          label={t.screen3.ltvLabel}
          error={errors.requestedLtvPercentage}
          hint={Number(values.requestedLtvPercentage) > 0 ? t.screen3.ltvHint(Number(values.requestedLtvPercentage)) : undefined}
        >
          <input
            id="requestedLtvPercentage"
            type="number"
            style={wizardInputStyle}
            value={values.requestedLtvPercentage}
            onChange={handleTextChange('requestedLtvPercentage')}
            onWheel={blurNumberInputOnWheel}
            aria-invalid={Boolean(errors.requestedLtvPercentage)}
          />
        </WizardField>
      </QuestionBlock>

      <QuestionBlock heading={t.screen3.durationHeading}>
        <WizardField
          id="durationYears"
          label={t.screen3.durationLabel}
          error={errors.durationYears}
          hint={Number(values.durationYears) > 0 ? t.screen3.durationHint(Number(values.durationYears)) : undefined}
        >
          <input
            id="durationYears"
            type="number"
            style={wizardInputStyle}
            value={values.durationYears}
            onChange={handleTextChange('durationYears')}
            onWheel={blurNumberInputOnWheel}
            aria-invalid={Boolean(errors.durationYears)}
          />
        </WizardField>
      </QuestionBlock>

      <QuestionBlock heading={t.screen3.mortgageTypeHeading}>
        <WizardField id="mortgageType" wrapperId="mortgageType" label={t.screen3.mortgageTypeLabel} error={errors.mortgageType}>
          <CardOptionGroup
            ariaLabel={t.screen3.mortgageTypeLabel}
            options={(Object.keys(t.labels.mortgageType) as MortgageType[]).map((option) => ({
              value: option,
              label: t.labels.mortgageType[option],
              disabled: option === 'MIXED',
              note: option === 'MIXED' ? t.screen3.mortgageTypeComingSoon : undefined,
            }))}
            selected={values.mortgageType as MortgageType | ''}
            onSelect={(value) => setField('mortgageType', value)}
          />
        </WizardField>
      </QuestionBlock>
    </div>
  );
}
