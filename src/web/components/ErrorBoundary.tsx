import { Component, type ReactNode } from 'react';
import { MessageState } from './MessageState';

/** The last line of defence: a crash shows a way forward instead of a blank page. */
export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <main className="page">
        <MessageState
          art="error"
          title="Something spilled."
          body="Reload the page to pick up where you left off."
          action={
            <button className="button" type="button" onClick={() => window.location.reload()}>
              Reload
            </button>
          }
        />
      </main>
    );
  }
}
