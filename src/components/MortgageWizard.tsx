/**
 * Root component of the 8-screen mortgage wizard, preceded by an
 * introductory language selector (Screen0LanguageSelect):
 *   0. Language selector             — Screen0LanguageSelect (no progress chrome)
 *   1. Welcome                       — Screen1Welcome (no progress chrome)
 *   2. Debtor data                   — Screen2DebtorData
 *   3. Property & financing data     — Screen3PropertyFinancing
 *   4. Direct bank results           — Screen4BankOffers
 *   5. Negotiated broker option      — Screen5BrokerOffer (always reachable)
 *   6. Amortization schedule         — Screen6Amortization
 *   7. PDF download                  — Screen7PdfDownload
 *   8. Closing screen                — Screen8Closing (no progress chrome)
 * Owns the current step and the channel selected for the amortization
 * detail (carried from Screen 6 into Screen 7's PDF export). All form state
 * and engine derivation stay delegated to useSimulator/useSavedSimulations.
 * The active language lives in LanguageContext, read via useLanguage() by
 * this component and by every screen/sub-component that needs translated
 * text — see /i18n.
 */

import { useState, type ReactNode } from 'react';
import { useSavedSimulations } from '../hooks/useSavedSimulations';
import { useSimulator, type SimulatorFormState } from '../hooks/useSimulator';
import type { MortgagePathResult } from '../engine/simulate';
import { LanguageProvider, useLanguage } from '../i18n/LanguageContext';
import { getCcaaName } from '../i18n/ccaaNames';
import { CCAA_OPTIONS } from '../data/ccaaOptions';
import { ChatAssistant } from './ChatAssistant';
import { Screen0LanguageSelect } from './Screen0LanguageSelect';
import { Screen1Welcome } from './Screen1Welcome';
import { Screen2DebtorData } from './Screen2DebtorData';
import { Screen3PropertyFinancing } from './Screen3PropertyFinancing';
import { Screen4BankOffers } from './Screen4BankOffers';
import { Screen5BrokerOffer } from './Screen5BrokerOffer';
import { Screen6Amortization } from './Screen6Amortization';
import { Screen7PdfDownload } from './Screen7PdfDownload';
import { Screen8Closing } from './Screen8Closing';
import { WizardShell } from './WizardShell';

type WizardStep = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

/**
 * Fields collected on Screen 2. Used only as a step-completion heuristic:
 * simulatorInputSchema validates the WHOLE input at once, so before Screen 3
 * is filled in, `isValid` is always false even if every Screen 2 field is
 * correct. Checking "none of these fields currently has a validation error"
 * is an accurate proxy for "Screen 2 is locally complete", since an empty
 * required field always produces its own error under the same key.
 */
const SCREEN_2_FIELDS: Array<keyof SimulatorFormState> = [
  'numberOfHolders',
  'holderNames',
  'holderAges',
  'employmentTypes',
  'employmentOtherDetails',
  'monthlyNetIncomes',
  'pendingDebts',
  'pendingDebtsRemainingMonths',
  'availableSavings',
];

export function MortgageWizard() {
  return (
    <LanguageProvider>
      <MortgageWizardSteps />
    </LanguageProvider>
  );
}

function MortgageWizardSteps() {
  const { language, t } = useLanguage();
  const [step, setStep] = useState<WizardStep>(0);
  const [amortizationChannel, setAmortizationChannel] = useState<MortgagePathResult['channel']>('BANK_BONIFIED');

  const {
    values,
    errors,
    isValid,
    input,
    output,
    setField,
    setNumberOfHolders,
    setHolderName,
    setHolderAge,
    setEmploymentType,
    setEmploymentOtherDetail,
    setHolderIncome,
    reset,
  } = useSimulator({}, language);
  const {
    savedSimulations,
    saveSimulation,
    deleteSimulation,
    selectedIds,
    toggleSelected,
    clearSelection,
    comparedSimulations,
  } = useSavedSimulations();

  const selectedCcaaOption = CCAA_OPTIONS.find((option) => option.code === values.ccaa);
  const selectedCcaaName = selectedCcaaOption ? getCcaaName(selectedCcaaOption.code, language, selectedCcaaOption.name) : '';
  const numberOfHolders = input?.numberOfHolders ?? (Number(values.numberOfHolders) || 1);
  const screen2LocallyValid = SCREEN_2_FIELDS.every((field) => !errors[field]);

  const goBack = () => setStep((current) => (current > 1 ? ((current - 1) as WizardStep) : current));
  const goForward = () => setStep((current) => (current < 8 ? ((current + 1) as WizardStep) : current));
  const restart = () => {
    reset();
    setAmortizationChannel('BANK_BONIFIED');
    setStep(1);
  };

  let content: ReactNode;

  if (step === 0) {
    content = <Screen0LanguageSelect onContinue={goForward} />;
  } else if (step === 1) {
    content = <Screen1Welcome onStart={goForward} />;
  } else if (step === 2) {
    content = (
      <WizardShell
        step={2}
        onBack={goBack}
        onContinue={goForward}
        continueLabel={t.common.continueDefault}
        continueDisabled={!screen2LocallyValid}
      >
        <Screen2DebtorData
          values={values}
          errors={errors}
          setField={setField}
          setNumberOfHolders={setNumberOfHolders}
          setHolderName={setHolderName}
          setHolderAge={setHolderAge}
          setEmploymentType={setEmploymentType}
          setEmploymentOtherDetail={setEmploymentOtherDetail}
          setHolderIncome={setHolderIncome}
        />
      </WizardShell>
    );
  } else if (step === 3) {
    content = (
      <WizardShell step={3} onBack={goBack} onContinue={goForward} continueLabel={t.common.continueDefault} continueDisabled={!isValid}>
        <Screen3PropertyFinancing values={values} errors={errors} numberOfHolders={numberOfHolders} setField={setField} />
      </WizardShell>
    );
  } else if (!input || !output) {
    // Screens 4-8 all require a computed output — Screen3's own Continuar button is
    // already gated on isValid, so this should always hold once step > 3, but the
    // guard keeps the render pure/type-safe if state is ever reached unexpectedly.
    content = (
      <WizardShell step={step} onBack={goBack}>
        <p>{t.common.completePreviousSteps}</p>
      </WizardShell>
    );
  } else if (step === 4) {
    content = (
      <WizardShell step={4} onBack={goBack} onContinue={goForward} continueLabel={t.screen4.continueCta}>
        <Screen4BankOffers input={input} output={output} />
      </WizardShell>
    );
  } else if (step === 5) {
    content = (
      <WizardShell step={5} onBack={goBack} onContinue={goForward} continueLabel={t.screen5.continueCta}>
        <Screen5BrokerOffer input={input} output={output} />
      </WizardShell>
    );
  } else if (step === 6) {
    content = (
      <WizardShell step={6} onBack={goBack} onContinue={goForward} continueLabel={t.screen6.continueCta}>
        <Screen6Amortization
          output={output}
          numberOfHolders={numberOfHolders}
          selectedChannel={amortizationChannel}
          onSelectChannel={setAmortizationChannel}
        />
      </WizardShell>
    );
  } else if (step === 7) {
    content = (
      <WizardShell step={7} onBack={goBack} onContinue={goForward} continueLabel={t.screen7.continueCta}>
        <Screen7PdfDownload
          input={input}
          output={output}
          ccaaName={selectedCcaaName}
          savedScenariosProps={{
            onSaveCurrent: (name) => saveSimulation(name, input, output),
            savedSimulations,
            selectedIds,
            onToggleSelected: toggleSelected,
            onDelete: deleteSimulation,
            onClearSelection: clearSelection,
            comparedSimulations,
          }}
        />
      </WizardShell>
    );
  } else {
    content = <Screen8Closing numberOfHolders={numberOfHolders} onRestart={restart} />;
  }

  // Mounted continuously across the data-entry steps (2-3) and the results
  // steps that follow (4-7) so its message history survives step
  // navigation — only unmounts outside that range, where there's nothing
  // left for it to help fill in.
  const showChatAssistant = step >= 2 && step <= 7;

  return (
    <>
      {content}
      {showChatAssistant && (
        <ChatAssistant
          values={values}
          setField={setField}
          setNumberOfHolders={setNumberOfHolders}
          setHolderName={setHolderName}
          setHolderAge={setHolderAge}
          setEmploymentType={setEmploymentType}
          setEmploymentOtherDetail={setEmploymentOtherDetail}
          setHolderIncome={setHolderIncome}
          currentStep={step}
          onNavigateToStep={(targetStep: 2 | 3 | 6) => setStep(targetStep)}
          input={input}
          output={output}
          ccaaName={selectedCcaaName}
        />
      )}
    </>
  );
}
