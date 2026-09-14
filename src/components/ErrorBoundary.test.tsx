// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ErrorBoundary } from './ErrorBoundary';

function Bomb(): never {
  throw new Error('Forced test crash for ErrorBoundary verification');
}

describe('ErrorBoundary', () => {
  it('renders its children normally when nothing throws', () => {
    render(
      <ErrorBoundary>
        <p>Contingut normal</p>
      </ErrorBoundary>
    );
    expect(screen.getByText('Contingut normal')).toBeDefined();
  });

  it('renders a Catalan fallback instead of a blank page when a child throws during render', () => {
    // React logs the caught error to console.error by design; silence it for this test only.
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>
    );

    expect(screen.getByText("S'ha produït un error inesperat")).toBeDefined();
    expect(screen.getByText(/Forced test crash for ErrorBoundary verification/)).toBeDefined();
    expect(screen.getByRole('button', { name: 'Torna a carregar' })).toBeDefined();

    consoleErrorSpy.mockRestore();
  });
});
