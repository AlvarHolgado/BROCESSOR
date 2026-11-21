/**
 * Top-level render-error safety net. Without this, an uncaught exception
 * anywhere in the tree unmounts the whole app, leaving only the empty
 * <body> background visible — on this dark theme that reads as a blank
 * full-viewport dark-blue screen with nothing to scroll, since there is no
 * content left in the DOM at all. React error boundaries must be class
 * components; there is no hook equivalent.
 */

import { Component, type ErrorInfo, type ReactNode } from 'react';
import { COLORS } from '../styles/theme';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // eslint-disable-next-line no-console -- deliberate: the only surviving diagnostic once the tree has unmounted.
    console.error('BROSSESSOR: uncaught render error', error, errorInfo.componentStack);
  }

  private handleReload = (): void => {
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.error) {
      return (
        <div
          role="alert"
          style={{
            margin: '2rem',
            padding: '1.5rem',
            border: `1px solid ${COLORS.risk.RED.border}`,
            borderRadius: '0.5rem',
            backgroundColor: COLORS.risk.RED.background,
            color: COLORS.risk.RED.text,
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
            maxWidth: '640px',
          }}
        >
          <h2 style={{ margin: 0 }}>S’ha produït un error inesperat</h2>
          <p style={{ margin: 0 }}>
            La simulació no s’ha pogut mostrar. Prova de tornar a carregar la pàgina; si el problema persisteix,
            revisa els valors introduïts al formulari.
          </p>
          <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.85 }}>
            Detall tècnic: {this.state.error.message}
          </p>
          <button
            type="button"
            onClick={this.handleReload}
            style={{
              alignSelf: 'flex-start',
              padding: '0.5rem 1.2rem',
              borderRadius: '0.375rem',
              border: `1px solid ${COLORS.risk.RED.border}`,
              backgroundColor: 'transparent',
              color: COLORS.risk.RED.text,
              cursor: 'pointer',
            }}
          >
            Torna a carregar
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
