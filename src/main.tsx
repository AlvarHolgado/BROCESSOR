/**
 * Minimal dev-preview entry point, for running the component library in a
 * browser via `npm run dev`. Not part of the production wizard app shell —
 * just mounts the 5-screen MortgageWizard so it can be exercised end to end.
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ErrorBoundary } from './components/ErrorBoundary';
import { MortgageWizard } from './components/MortgageWizard';
import './styles/global.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found.');
}

createRoot(rootElement).render(
  <StrictMode>
    <ErrorBoundary>
      <MortgageWizard />
    </ErrorBoundary>
  </StrictMode>
);
