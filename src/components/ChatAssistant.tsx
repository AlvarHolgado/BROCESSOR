/**
 * Floating, minimizable chat assistant ("Àlvar") that guides the user
 * through the simulator's data-entry fields conversationally. Deliberately
 * takes NO local copy of the form data — it receives the exact same
 * `values` + setter callbacks useSimulator() hands to Screen2DebtorData/
 * Screen3PropertyFinancing, so a value captured here or typed directly
 * into a form field is the same single source of truth either way. Entity
 * extraction (/chat/extraction.ts) and the question sequence
 * (/chat/conversationEngine.ts) are pure and unit-tested; this component
 * wires that logic to message bubbles, a typing-delay animation, the
 * shared setters, wizard-step navigation (so the active screen follows
 * along with the question Àlvar is currently asking), and — once every
 * field is filled — a yes/no PDF-download confirmation before signing off.
 */

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import type { SimulatorFormState } from '../hooks/useSimulator';
import type { SimulatorInput } from '../types/simulator';
import type { SimulatorOutput } from '../engine/simulate';
import { CCAA_OPTIONS } from '../data/ccaaOptions';
import { COLORS } from '../styles/theme';
import { useLanguage } from '../i18n/LanguageContext';
import { getCcaaName } from '../i18n/ccaaNames';
import { generateSimulationPdf } from '../utils/exportPdf';
import { ChatSummary } from './ChatSummary';
import { extractYesNo } from '../chat/extraction';
import { detectGlossaryTopic } from '../chat/glossary';
import {
  applyAnswerToValues,
  buildQuestionText,
  getNextQuestion,
  getQuestionStep,
  getScrollTargetId,
  questionKey,
  resolveAnswer,
  resolveNumberOfHolders,
  type CcaaCandidate,
  type ChatQuestion,
} from '../chat/conversationEngine';

export interface ChatAssistantProps {
  values: SimulatorFormState;
  setField: (field: keyof Omit<SimulatorFormState, 'holderNames' | 'holderAges' | 'employmentTypes' | 'employmentOtherDetails' | 'monthlyNetIncomes'>, value: string) => void;
  setNumberOfHolders: (count: number) => void;
  setHolderName: (index: number, value: string) => void;
  setHolderAge: (index: number, value: string) => void;
  setEmploymentType: (index: number, value: string) => void;
  setEmploymentOtherDetail: (index: number, value: string) => void;
  setHolderIncome: (index: number, value: string) => void;
  /** The wizard's currently active step, so Àlvar only auto-navigates while the user is still in the data-entry screens (2-3) — never yanks them back from a results screen they've already moved on to. */
  currentStep: number;
  /** Switches the wizard to the given data-entry step (2/3), or to the amortization breakdown screen (6) once the user asks to see it before the PDF prompt. */
  onNavigateToStep: (step: 2 | 3 | 6) => void;
  /** Non-null once the whole form validates — required to actually generate the PDF once the user confirms. */
  input: SimulatorInput | null;
  output: SimulatorOutput | null;
  ccaaName: string;
}

/**
 * How a message is presented, so the conversation reads with a clear
 * hierarchy: 'question' is what Àlvar is asking right now (the thing to
 * answer), 'ack' is a brief confirmation of the previous answer, 'info' is an
 * explanation or notice, 'plain' is everything else (greetings, farewells,
 * the user's own messages). `lead` is an optional lead-in sentence rendered
 * above a question's body (e.g. "Passem a la següent pregunta.").
 */
type MessageKind = 'plain' | 'ack' | 'question' | 'info';

interface ChatMessage {
  id: number;
  sender: 'assistant' | 'user';
  text: string;
  kind: MessageKind;
  lead?: string;
}

/**
 * Once every field question is answered, Àlvar first asks whether to see
 * the detailed conditions/amortization breakdown (CONFIRM_BREAKDOWN), then
 * whether to download the PDF (CONFIRM_PDF) before signing off (CLOSED) —
 * these extra states live only here (client UI session state), since
 * getNextQuestion/ChatQuestion stay a pure function of the FORM data alone.
 */
type ChatPhase = 'FIELDS' | 'CONFIRM_BREAKDOWN' | 'CONFIRM_PDF' | 'CLOSED';

function pickRandom<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

const PANEL_WIDTH = 340;
const HIGHLIGHT_CLASS = 'chat-highlight-target';

// Visual treatment (glossy gradient, gold border/glow) comes from the shared
// .btn-pill class in global.css — border-radius:999px on an equal
// width/height element still renders as a perfect circle.
const launcherStyle: CSSProperties = {
  position: 'fixed',
  bottom: '1.5rem',
  right: '1.5rem',
  zIndex: 40,
  width: '3.5rem',
  height: '3.5rem',
  fontSize: '1.5rem',
};

// Full-screen variant of the panel below: same colours, border-less and edge to edge.
const expandedPanelStyle: CSSProperties = {
  position: 'fixed',
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
  zIndex: 60,
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  backgroundColor: COLORS.hero.backgroundFrom,
};

// Keeps the reading column centred and at a comfortable width in full screen (a full-width line of chat text is hard to read).
const EXPANDED_CONTENT_PADDING = 'max(1rem, calc((100% - 820px) / 2))';

const panelStyle: CSSProperties = {
  position: 'fixed',
  bottom: '1.5rem',
  right: '1.5rem',
  zIndex: 40,
  width: `${PANEL_WIDTH}px`,
  maxWidth: 'calc(100vw - 2rem)',
  height: '32rem',
  maxHeight: 'calc(100vh - 3rem)',
  display: 'flex',
  flexDirection: 'column',
  borderRadius: '1rem',
  overflow: 'hidden',
  backgroundColor: COLORS.hero.backgroundFrom,
  boxShadow: '0 20px 45px rgba(14, 27, 56, 0.55)',
  border: `1px solid ${COLORS.hero.subtitleText}22`,
};

const headerStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '0.9rem 1rem',
  backgroundColor: COLORS.hero.backgroundTo,
  borderBottom: `1px solid ${COLORS.hero.subtitleText}22`,
};

const headerTitleStyle: CSSProperties = {
  margin: 0,
  color: '#FFFFFF',
  fontSize: '0.95rem',
  fontWeight: 700,
};

const headerButtonStyle: CSSProperties = {
  background: 'none',
  border: 'none',
  color: COLORS.hero.subtitleText,
  cursor: 'pointer',
  fontSize: '1.1rem',
  lineHeight: 1,
  padding: '0.2rem 0.4rem',
};

const messagesStyle: CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  padding: '1rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.6rem',
};

function bubbleStyle(sender: ChatMessage['sender'], kind: MessageKind = 'plain', expanded = false): CSSProperties {
  const isAssistant = sender === 'assistant';
  const isAck = kind === 'ack';
  const isQuestion = kind === 'question';
  return {
    maxWidth: '100%',
    padding: isAck ? '0.4rem 0.75rem' : expanded ? '0.8rem 1.05rem' : '0.6rem 0.85rem',
    borderRadius: isAssistant ? '0.9rem 0.9rem 0.9rem 0.2rem' : '0.9rem 0.9rem 0.2rem 0.9rem',
    backgroundColor: isAssistant ? 'rgba(255,255,255,0.08)' : COLORS.brand.mustard,
    color: isAssistant ? COLORS.brand.white : COLORS.brand.navyTrim,
    fontSize: isAck ? (expanded ? '0.88rem' : '0.8rem') : expanded ? '1rem' : '0.88rem',
    lineHeight: expanded ? 1.55 : 1.4,
    whiteSpace: 'pre-wrap',
    opacity: isAck ? 0.85 : 1,
    // A question carries a gold accent bar so the thing to answer stands out from acknowledgments and explanations.
    borderLeft: isQuestion && isAssistant ? `3px solid ${COLORS.brand.mustard}` : undefined,
  };
}

// One message "row": optional speaker caption + the bubble, aligned to its side.
function messageRowStyle(sender: ChatMessage['sender'], expanded: boolean): CSSProperties {
  return {
    alignSelf: sender === 'assistant' ? 'flex-start' : 'flex-end',
    alignItems: sender === 'assistant' ? 'flex-start' : 'flex-end',
    maxWidth: expanded ? '78%' : '85%',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.2rem',
  };
}

const speakerLabelStyle: CSSProperties = {
  color: COLORS.hero.subtitleText,
  fontSize: '0.7rem',
  fontWeight: 600,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  padding: '0 0.35rem',
};

const leadStyle: CSSProperties = {
  display: 'block',
  color: COLORS.hero.subtitleText,
  fontSize: '0.78em',
  marginBottom: '0.25rem',
};

const typingBubbleStyle: CSSProperties = {
  ...bubbleStyle('assistant'),
  color: COLORS.hero.subtitleText,
  fontStyle: 'italic',
  fontSize: '0.8rem',
};

const hintStyle: CSSProperties = {
  color: COLORS.hero.subtitleText,
  fontSize: '0.72rem',
  padding: '0 1rem 0.5rem',
  margin: 0,
};

const inputRowStyle: CSSProperties = {
  display: 'flex',
  gap: '0.5rem',
  padding: '0.75rem',
  borderTop: `1px solid ${COLORS.hero.subtitleText}22`,
  backgroundColor: COLORS.hero.backgroundTo,
};

const inputStyle: CSSProperties = {
  flex: 1,
  padding: '0.6rem 0.75rem',
  borderRadius: '0.65rem',
  border: `1px solid ${COLORS.hero.subtitleText}44`,
  backgroundColor: 'rgba(255,255,255,0.06)',
  color: '#FFFFFF',
  fontSize: '0.88rem',
};

// Visual treatment comes from the shared .btn-pill class in global.css.
const sendButtonStyle: CSSProperties = {
  padding: '0.6rem 1.1rem',
  fontWeight: 700,
  fontSize: '0.85rem',
};

// Body wrapper: a single column in the small chat; message column + summary sidebar side by side in full screen
// (global.css collapses the two columns into one on narrow screens via .chat-body-expanded).
function chatBodyStyle(expanded: boolean): CSSProperties {
  return expanded
    ? { flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px' }
    : { flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' };
}

const chatMainColumnStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  minHeight: 0,
  minWidth: 0,
};

const hintRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  padding: '0.1rem 1rem 0.4rem',
};

const summaryToggleStyle: CSSProperties = {
  background: 'none',
  border: 'none',
  color: COLORS.brand.mustard,
  cursor: 'pointer',
  fontSize: '0.72rem',
  fontWeight: 700,
  padding: 0,
  textDecoration: 'underline',
};

const compactSummaryStyle: CSSProperties = {
  maxHeight: '11rem',
  overflowY: 'auto',
  padding: '0.75rem 1rem',
  margin: '0 0.75rem 0.5rem',
  borderRadius: '0.65rem',
  backgroundColor: 'rgba(255,255,255,0.05)',
};

const summaryAsideStyle: CSSProperties = {
  overflowY: 'auto',
  padding: '1.25rem 1.25rem 1.5rem',
  backgroundColor: COLORS.hero.backgroundTo,
  borderLeft: `1px solid ${COLORS.hero.subtitleText}22`,
};

export function ChatAssistant({
  values,
  setField,
  setNumberOfHolders,
  setHolderName,
  setHolderAge,
  setEmploymentType,
  setEmploymentOtherDetail,
  setHolderIncome,
  currentStep,
  onNavigateToStep,
  input,
  output,
  ccaaName,
}: ChatAssistantProps) {
  const { t, language } = useLanguage();
  const [isOpen, setIsOpen] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [inputText, setInputText] = useState('');
  const [phase, setPhase] = useState<ChatPhase>('FIELDS');
  const [isExpanded, setIsExpanded] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const nextMessageId = useRef(0);
  const lastQuestionKeyRef = useRef<string | null>(null);
  const selfTriggeredRef = useRef(false);
  const hasGreetedRef = useRef(false);
  const isMountedRef = useRef(true);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const currentStepRef = useRef(currentStep);
  currentStepRef.current = currentStep;
  /**
   * FIFO queue backing simulateTypingThen — see its own comment below for
   * why a shared queue (rather than one independent setTimeout per call) is
   * required: two call sites can each schedule a "typing" response for the
   * SAME user turn (e.g. handleSend's own acknowledgment for the just-answered
   * field, immediately followed by the values-watching effect's follow-up
   * question once the field completes the form) — with independent
   * randomized delays, the second call could resolve before the first,
   * rendering Àlvar's reply to something that hasn't been acknowledged yet.
   */
  const responseQueueRef = useRef<Array<() => void>>([]);
  const isProcessingResponseRef = useRef(false);

  const numberOfHolders = useMemo(() => resolveNumberOfHolders(values), [values]);

  const ccaaCandidates = useMemo<CcaaCandidate[]>(
    () =>
      CCAA_OPTIONS.map((option) => ({
        code: option.code,
        names: [option.name, getCcaaName(option.code, 'ca', option.name), getCcaaName(option.code, 'es', option.name), getCcaaName(option.code, 'en', option.name)],
      })),
    []
  );

  const pushMessage = useCallback((sender: ChatMessage['sender'], text: string, kind: MessageKind = 'plain', lead?: string) => {
    // Capture the id into a local BEFORE calling setMessages: the updater
    // below runs later (React queues state updaters rather than invoking
    // them immediately), so two pushMessage calls made back-to-back (e.g.
    // an acknowledgment immediately followed by the next question) would
    // otherwise both close over the SAME final value of the mutable ref —
    // it only gets read once both increments have already happened.
    nextMessageId.current += 1;
    const id = nextMessageId.current;
    setMessages((previous) => [...previous, { id, sender, text, kind, lead }]);
  }, []);

  // Drains responseQueueRef one entry at a time: only schedules the NEXT
  // entry's typing delay once the current one's callback has fully run, so
  // messages queued from different call sites for the same turn (handleSend
  // vs. the values-watching effect) always render in the order they were
  // enqueued, never racing on their independent random delays. Deliberately
  // does NOT cancel the pending timeout on effect cleanup: with StrictMode's
  // dev-only mount->cleanup->mount double-invoke, a clearTimeout-on-cleanup
  // would cancel the very timeout just scheduled by the first (real) mount,
  // permanently stalling the queue (the guarded second mount pass then
  // no-ops and never reschedules it). The isMountedRef guard below achieves
  // the same "don't touch state after a REAL unmount" safety without that
  // failure mode. Each callback runs inside a try/catch: an exception here
  // (e.g. an edge case the pending question/state validation didn't
  // anticipate) would otherwise leave the conversation silently stuck with
  // no assistant reply — instead we surface a graceful fallback message and
  // keep draining the queue.
  const processResponseQueue = useCallback(() => {
    if (isProcessingResponseRef.current) {
      return;
    }
    const next = responseQueueRef.current.shift();
    if (!next) {
      setIsTyping(false);
      return;
    }
    isProcessingResponseRef.current = true;
    setIsTyping(true);
    const delay = 450 + Math.random() * 650;
    window.setTimeout(() => {
      isProcessingResponseRef.current = false;
      if (!isMountedRef.current) {
        return;
      }
      try {
        next();
      } catch {
        pushMessage('assistant', t.chat.fallbackErrorMessage(), 'info');
      }
      processResponseQueue();
    }, delay);
  }, [pushMessage, t]);

  const simulateTypingThen = useCallback(
    (callback: () => void) => {
      responseQueueRef.current.push(callback);
      processResponseQueue();
    },
    [processResponseQueue]
  );

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Defensive watchdog: a scheduled response normally resolves within
  // ~450-1100ms (simulateTypingThen's own delay). If "escrivint..." is still
  // showing well past that (e.g. a background-tab timer throttling or any
  // other state-synchronization lag), auto-recover with a fallback message
  // instead of leaving the assistant looking permanently frozen. Also drops
  // whatever was mid-flight in the response queue and clears the
  // in-progress flag, so a stuck entry can never permanently deadlock
  // processResponseQueue's "only one in flight at a time" guard.
  useEffect(() => {
    if (!isTyping) {
      return;
    }
    const watchdog = window.setTimeout(() => {
      if (!isMountedRef.current) {
        return;
      }
      responseQueueRef.current = [];
      isProcessingResponseRef.current = false;
      setIsTyping(false);
      pushMessage('assistant', t.chat.fallbackErrorMessage(), 'info');
    }, 8000);
    return () => window.clearTimeout(watchdog);
  }, [isTyping, pushMessage, t]);

  /**
   * Keeps the main wizard view aligned with whatever Àlvar is currently
   * asking about (requirement: step-by-step UI sync): switches the active
   * screen when the question lives on the other data-entry step, then
   * scrolls the matching field into view and gives it a brief highlight
   * pulse (see .chat-highlight-target in global.css). Only auto-navigates
   * while the user is actually on one of the two data-entry screens —
   * never yanks them back from a results screen they've already reached.
   */
  const focusQuestion = useCallback(
    (question: ChatQuestion) => {
      const targetStep = getQuestionStep(question);
      const onDataEntryScreen = currentStepRef.current === 2 || currentStepRef.current === 3;
      const isSwitchingStep = targetStep !== null && onDataEntryScreen && currentStepRef.current !== targetStep;
      if (isSwitchingStep) {
        onNavigateToStep(targetStep as 2 | 3);
      }
      const targetId = getScrollTargetId(question);
      if (!targetId) {
        return;
      }
      window.setTimeout(
        () => {
          const element = document.getElementById(targetId);
          if (!element) {
            return;
          }
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          element.classList.add(HIGHLIGHT_CLASS);
          window.setTimeout(() => element.classList.remove(HIGHLIGHT_CLASS), 1600);
        },
        isSwitchingStep ? 350 : 60
      );
    },
    [onNavigateToStep]
  );

  // One-time greeting + first question, run once on mount regardless of language changes afterward.
  useEffect(() => {
    if (hasGreetedRef.current) {
      return;
    }
    hasGreetedRef.current = true;
    const firstQuestion = getNextQuestion(values);
    lastQuestionKeyRef.current = questionKey(firstQuestion);
    pushMessage('assistant', pickRandom(t.chat.greetings)(numberOfHolders));
    if (firstQuestion.kind !== 'done') {
      simulateTypingThen(() => pushMessage('assistant', buildQuestionText(firstQuestion, values, t), 'question'));
      focusQuestion(firstQuestion);
    } else if (output && input) {
      simulateTypingThen(() => pushMessage('assistant', t.chat.askViewBreakdown(numberOfHolders), 'question'));
      setPhase('CONFIRM_BREAKDOWN');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reacts to ANY change in the shared form state — whether it came from
  // this component's own handleSend (selfTriggeredRef true, already
  // messaged synchronously below) or a manual edit typed directly into a
  // form field (selfTriggeredRef false — the only case that should react
  // here).
  useEffect(() => {
    if (!hasGreetedRef.current) {
      return;
    }
    const nextQuestion = getNextQuestion(values);
    const nextKey = questionKey(nextQuestion);

    if (nextQuestion.kind !== 'done') {
      if (nextKey === lastQuestionKeyRef.current && phase === 'FIELDS') {
        return;
      }
      lastQuestionKeyRef.current = nextKey;
      if (selfTriggeredRef.current) {
        // handleSend already called focusQuestion synchronously for this
        // same transition — calling it again here would double-schedule
        // the scroll/highlight timeout.
        selfTriggeredRef.current = false;
        if (phase !== 'FIELDS') {
          setPhase('FIELDS');
        }
        return;
      }
      focusQuestion(nextQuestion);
      if (phase !== 'FIELDS') {
        setPhase('FIELDS');
      }
      simulateTypingThen(() => {
        pushMessage('assistant', pickRandom(t.chat.manualEditNotices)(numberOfHolders), 'ack');
        pushMessage('assistant', buildQuestionText(nextQuestion, values, t), 'question');
      });
      return;
    }

    // Every chat-tracked field is filled. Only offer the post-collection
    // breakdown/PDF flow once the whole schema actually validates
    // (output/input non-null) — a field can look "filled" to getNextQuestion
    // (non-empty) while still failing a range check (e.g. an out-of-bounds
    // age), in which case we wait silently for the user to fix it (the
    // form's own inline error already flags it).
    if (phase !== 'FIELDS') {
      return;
    }
    lastQuestionKeyRef.current = 'done';
    // NOTE: this "done" transition is ALWAYS finished here, in the effect —
    // never assumed already-handled by handleSend, even when self-triggered.
    // Reason: `output`/`input` are computed from the PREVIOUS render's
    // `values` (useSimulator's useMemo hasn't re-run yet at the moment
    // handleSend's synchronous closure captured them), so right after the
    // very last field is answered via chat, handleSend still sees them as
    // null even though the form is now actually complete — only this
    // effect, running after React re-renders with fresh props, can
    // reliably tell whether the whole schema validates.
    const cameFromChat = selfTriggeredRef.current;
    selfTriggeredRef.current = false;
    if (!output || !input) {
      // A field can look "filled" to getNextQuestion (non-empty) while still
      // failing a range check (e.g. an out-of-bounds age) — the form's own
      // inline error already flags it, so only chime in when the user
      // wasn't just mid-conversation with Àlvar (who already acknowledged
      // their last answer) to avoid talking over that acknowledgment.
      if (!cameFromChat) {
        simulateTypingThen(() => pushMessage('assistant', t.chat.needsReviewMessage(), 'info'));
      }
      return;
    }
    simulateTypingThen(() => {
      if (!cameFromChat) {
        pushMessage('assistant', pickRandom(t.chat.manualEditNotices)(numberOfHolders), 'ack');
      }
      pushMessage('assistant', t.chat.askViewBreakdown(numberOfHolders), 'question');
    });
    setPhase('CONFIRM_BREAKDOWN');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values, output, input]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, isTyping]);

  // Full-screen mode: Esc returns to the normal view, the page behind stops scrolling, and the input gets focus.
  useEffect(() => {
    if (!isExpanded) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsExpanded(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    inputRef.current?.focus();
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isExpanded]);

  const applyAnswer = useCallback(
    (answer: Extract<ReturnType<typeof resolveAnswer>, { success: true }>) => {
      switch (answer.kind) {
        case 'numberOfHolders':
          setNumberOfHolders(answer.count);
          break;
        case 'holderName':
          setHolderName(answer.index, answer.value);
          break;
        case 'holderAge':
          setHolderAge(answer.index, String(answer.value));
          break;
        case 'employmentType':
          setEmploymentType(answer.index, answer.value);
          break;
        case 'employmentOtherDetail':
          setEmploymentOtherDetail(answer.index, answer.value);
          break;
        case 'holderIncome':
          setHolderIncome(answer.index, String(answer.value));
          break;
        case 'pendingDebts':
          setField('pendingDebts', String(answer.value));
          break;
        case 'pendingDebtsRemainingMonths':
          setField('pendingDebtsRemainingMonths', String(answer.value));
          break;
        case 'availableSavings':
          setField('availableSavings', String(answer.value));
          break;
        case 'purchaseValue':
          setField('purchaseValue', String(answer.value));
          break;
        case 'appraisalValue':
          setField('appraisalValue', String(answer.value));
          break;
        case 'propertyType':
          setField('propertyType', answer.value);
          break;
        case 'propertyUsage':
          setField('propertyUsage', answer.value);
          break;
        case 'ccaa':
          setField('ccaa', answer.value);
          break;
        case 'requestedLtvPercentage':
          setField('requestedLtvPercentage', String(answer.value));
          break;
        case 'durationYears':
          setField('durationYears', String(answer.value));
          break;
        case 'mortgageType':
          setField('mortgageType', answer.value);
          break;
      }
    },
    [setField, setNumberOfHolders, setHolderName, setHolderAge, setEmploymentType, setEmploymentOtherDetail, setHolderIncome]
  );

  const handleSend = useCallback(() => {
    const trimmed = inputText.trim();
    // isTyping is also checked here (on top of disabling the input/button
    // while it's true) as a second line of defense against a rapid
    // double-send racing two overlapping simulateTypingThen timers, which
    // could otherwise deliver Àlvar's replies out of order.
    if (!trimmed || isTyping) {
      return;
    }
    pushMessage('user', trimmed);
    setInputText('');

    if (phase === 'CONFIRM_BREAKDOWN') {
      const wantsBreakdown = extractYesNo(trimmed, language);
      if (wantsBreakdown === null) {
        simulateTypingThen(() => pushMessage('assistant', pickRandom(t.chat.clarifications)(numberOfHolders), 'info'));
        return;
      }
      if (wantsBreakdown) {
        onNavigateToStep(6);
      }
      simulateTypingThen(() => {
        if (wantsBreakdown) {
          pushMessage('assistant', t.chat.breakdownShown(), 'info');
        }
        pushMessage('assistant', t.chat.askDownloadPdf(numberOfHolders), 'question');
      });
      setPhase('CONFIRM_PDF');
      return;
    }

    if (phase === 'CONFIRM_PDF') {
      const wantsPdf = extractYesNo(trimmed, language);
      if (wantsPdf === null) {
        simulateTypingThen(() => pushMessage('assistant', pickRandom(t.chat.clarifications)(numberOfHolders), 'info'));
        return;
      }
      if (wantsPdf && output && input) {
        simulateTypingThen(() => {
          try {
            generateSimulationPdf({ input, output, ccaaName, language });
          } catch {
            // Best-effort: still close out warmly even if generation fails for some reason.
          }
          pushMessage('assistant', t.chat.pdfDownloadStarted(), 'info');
          simulateTypingThen(() => pushMessage('assistant', t.chat.closingThanks(numberOfHolders)));
        });
      } else {
        simulateTypingThen(() => {
          pushMessage('assistant', t.chat.pdfDeclined(), 'info');
          simulateTypingThen(() => pushMessage('assistant', t.chat.closingThanks(numberOfHolders)));
        });
      }
      setPhase('CLOSED');
      return;
    }

    if (phase === 'CLOSED') {
      simulateTypingThen(() => pushMessage('assistant', t.chat.closingThanks(numberOfHolders)));
      return;
    }

    const currentQuestion = getNextQuestion(values);
    if (currentQuestion.kind === 'done') {
      // Reachable only if output/input are still null (schema not yet valid) despite every chat-tracked field looking filled.
      simulateTypingThen(() => pushMessage('assistant', t.chat.needsReviewMessage(), 'info'));
      return;
    }

    // Checked BEFORE resolveAnswer, not only as a fallback after it fails:
    // resolveAnswer's mortgageType matching is a generic substring check on
    // "fix"/"variable", so a side question like "what's the difference
    // between fixed and variable?" would otherwise be silently
    // (mis)interpreted as a real answer. detectGlossaryTopic only fires
    // here when a real question cue is present for that kind of ambiguous
    // topic (see glossary.ts), so a plain one-word answer like "variable"
    // still flows through to resolveAnswer exactly as before. Answering the
    // side question and then re-asking the SAME pending question — without
    // touching lastQuestionKeyRef or any form state — lets Àlvar resolve the
    // interruption and resume exactly where the conversation left off.
    const glossaryTopic = detectGlossaryTopic(trimmed, language);
    if (glossaryTopic) {
      simulateTypingThen(() => {
        pushMessage('assistant', t.chat.glossary[glossaryTopic](), 'info');
        pushMessage('assistant', buildQuestionText(currentQuestion, values, t), 'question', t.chat.glossary.resumeBridge());
      });
      return;
    }

    const answer = resolveAnswer(currentQuestion, trimmed, language, ccaaCandidates);
    if (!answer.success) {
      simulateTypingThen(() => pushMessage('assistant', pickRandom(t.chat.clarifications)(numberOfHolders), 'info'));
      return;
    }

    selfTriggeredRef.current = true;
    applyAnswer(answer);

    const hypotheticalValues = applyAnswerToValues(values, answer);
    const nextQuestion = getNextQuestion(hypotheticalValues);
    lastQuestionKeyRef.current = questionKey(nextQuestion);
    focusQuestion(nextQuestion);

    simulateTypingThen(() => {
      pushMessage('assistant', pickRandom(t.chat.acknowledgments), 'ack');
      if (nextQuestion.kind !== 'done') {
        pushMessage('assistant', buildQuestionText(nextQuestion, hypotheticalValues, t), 'question', pickRandom(t.chat.transitions));
      }
      // else: this was the last field — the values-watching effect (which
      // sees the FRESH output/input props once React re-renders, unlike
      // this closure's stale ones) follows up with the PDF question, or a
      // review notice if the now-complete-looking form still fails
      // validation. `selfTriggeredRef` is left true so that effect knows
      // this came from the chat, not a manual edit.
    });
  }, [
    inputText,
    isTyping,
    values,
    language,
    ccaaCandidates,
    applyAnswer,
    pushMessage,
    simulateTypingThen,
    t,
    phase,
    numberOfHolders,
    output,
    input,
    ccaaName,
    focusQuestion,
    onNavigateToStep,
  ]);

  if (!isOpen) {
    return (
      <button type="button" className="btn-pill" style={launcherStyle} onClick={() => setIsOpen(true)} aria-label={t.chat.launcherAria}>
        💬
      </button>
    );
  }

  const summaryVisible = isExpanded || summaryOpen;
  const messagesPadding = isExpanded ? { padding: `1.25rem ${EXPANDED_CONTENT_PADDING}` } : undefined;

  return (
    <div style={isExpanded ? expandedPanelStyle : panelStyle} role="dialog" aria-modal={isExpanded} aria-label={t.chat.headerTitle}>
      <div style={headerStyle}>
        <p style={headerTitleStyle}>{t.chat.headerTitle}</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          {isExpanded ? (
            <>
              <span style={{ ...hintStyle, padding: '0 0.5rem 0 0' }}>{t.chat.fullscreenHint}</span>
              <button type="button" style={headerButtonStyle} onClick={() => setIsExpanded(false)} aria-label={t.chat.collapseAria} title={t.chat.collapseAria}>
                ✕
              </button>
            </>
          ) : (
            <>
              <button type="button" style={headerButtonStyle} onClick={() => setIsExpanded(true)} aria-label={t.chat.expandAria} title={t.chat.expandAria}>
                ⤢
              </button>
              <button type="button" style={headerButtonStyle} onClick={() => setIsOpen(false)} aria-label={t.chat.minimizeAria} title={t.chat.minimizeAria}>
                −
              </button>
            </>
          )}
        </div>
      </div>

      <div className={isExpanded ? 'chat-body chat-body-expanded' : 'chat-body'} style={chatBodyStyle(isExpanded)}>
        <div style={chatMainColumnStyle}>
          <div style={isExpanded ? { ...hintRowStyle, padding: `0.5rem ${EXPANDED_CONTENT_PADDING}` } : hintRowStyle}>
            <p style={{ ...hintStyle, padding: 0, flex: 1 }}>{t.chat.restartHint(numberOfHolders)}</p>
            {!isExpanded && (
              <button type="button" style={summaryToggleStyle} onClick={() => setSummaryOpen((open) => !open)} aria-expanded={summaryOpen}>
                {summaryOpen ? t.chat.summaryHide : t.chat.summaryShow}
              </button>
            )}
          </div>

          {summaryVisible && !isExpanded && (
            <div style={compactSummaryStyle}>
              <ChatSummary values={values} output={output} ccaaName={ccaaName} />
            </div>
          )}

          <div style={{ ...messagesStyle, ...messagesPadding, gap: isExpanded ? '0.85rem' : messagesStyle.gap }}>
            {messages.map((message, index) => {
              const showSpeaker = index === 0 || messages[index - 1].sender !== message.sender;
              return (
                <div key={message.id} style={messageRowStyle(message.sender, isExpanded)}>
                  {showSpeaker && (
                    <span style={speakerLabelStyle}>{message.sender === 'assistant' ? t.chat.assistantName : t.chat.userLabel}</span>
                  )}
                  <div style={bubbleStyle(message.sender, message.kind, isExpanded)}>
                    {message.lead && <span style={leadStyle}>{message.lead}</span>}
                    <span style={message.kind === 'question' && message.sender === 'assistant' ? { fontWeight: 600 } : undefined}>{message.text}</span>
                  </div>
                </div>
              );
            })}
            {isTyping && <div style={{ ...typingBubbleStyle, alignSelf: 'flex-start' }}>{t.chat.typingLabel}</div>}
            <div ref={messagesEndRef} />
          </div>

          <div style={isExpanded ? { ...inputRowStyle, padding: `0.9rem ${EXPANDED_CONTENT_PADDING}` } : inputRowStyle}>
            <input
              ref={inputRef}
              type="text"
              style={{ ...inputStyle, opacity: isTyping ? 0.6 : 1, fontSize: isExpanded ? '1rem' : inputStyle.fontSize }}
              value={inputText}
              onChange={(event) => setInputText(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  handleSend();
                }
              }}
              placeholder={t.chat.inputPlaceholder}
              aria-label={t.chat.inputAriaLabel}
              disabled={isTyping}
            />
            <button
              type="button"
              className="btn-pill"
              style={{ ...sendButtonStyle, opacity: isTyping ? 0.6 : 1 }}
              onClick={handleSend}
              disabled={isTyping}
            >
              {t.chat.sendCta}
            </button>
          </div>
        </div>

        {isExpanded && (
          <aside className="chat-summary-aside" style={summaryAsideStyle} aria-label={t.chat.summary.title}>
            <ChatSummary values={values} output={output} ccaaName={ccaaName} />
          </aside>
        )}
      </div>
    </div>
  );
}
