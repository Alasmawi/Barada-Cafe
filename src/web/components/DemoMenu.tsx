import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPreviewMode, PREVIEW_MODES, setPreviewMode, type PreviewMode } from '../api/preview';
import { useDemoAccounts, useResetDemo } from '../api/queries';
import { useSession } from '../session';
import { Icon } from './Icon';
import { Sheet } from './Sheet';

const PREVIEW_LABELS: Record<PreviewMode, string> = {
  normal: 'Normal',
  slow: 'Slow',
  error: 'Error',
  empty: 'Empty',
};

function PreviewStates() {
  const queryClient = useQueryClient();
  const [mode, setMode] = useState(getPreviewMode);

  const choose = (next: PreviewMode) => {
    setPreviewMode(next);
    setMode(next);
    void queryClient.resetQueries();
  };

  return (
    <section className="sheet__section">
      <h3 className="group-label">Preview a state</h3>
      <div className="segmented" role="radiogroup" aria-label="Preview a state">
        {PREVIEW_MODES.map((option) => (
          <button
            key={option}
            className="segmented__option"
            type="button"
            role="radio"
            aria-checked={mode === option}
            onClick={() => choose(option)}
          >
            {PREVIEW_LABELS[option]}
          </button>
        ))}
      </div>
    </section>
  );
}

function ResetDemo() {
  const reset = useResetDemo();
  const accounts = useDemoAccounts();
  const { signOut } = useSession();
  const navigate = useNavigate();
  const [confirming, setConfirming] = useState(false);
  const lastResetAt = accounts.data?.lastResetAt;

  // A reset ends every session, so everyone starts again from the welcome screen.
  const confirm = () =>
    reset.mutate(undefined, {
      onSuccess: () => {
        signOut();
        navigate('/welcome');
      },
    });

  return (
    <section className="sheet__section">
      <h3 className="group-label">Demo data</h3>
      {confirming ? (
        <>
          <p className="note">This removes all changes and sign-ups, for everyone.</p>
          <div className="button-row">
            <button className="button" type="button" onClick={() => setConfirming(false)}>
              Keep it
            </button>
            <button
              className="button button--primary button--grow"
              type="button"
              onClick={confirm}
              disabled={reset.isPending}
            >
              {reset.isPending ? 'Resetting…' : 'Yes, reset'}
            </button>
          </div>
        </>
      ) : (
        <button className="button button--wide" type="button" onClick={() => setConfirming(true)}>
          Reset demo
        </button>
      )}
      {reset.isError && (
        <p className="form-error" role="alert">
          Reset didn't finish. Try again.
        </p>
      )}
      {lastResetAt && <p className="note">Last reset {new Date(lastResetAt).toLocaleString()}</p>}
    </section>
  );
}

export function DemoMenu() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        className="icon-button"
        type="button"
        aria-label="Demo tools"
        onClick={() => setOpen(true)}
      >
        <Icon name="more" />
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} title="Demo tools">
        <PreviewStates />
        <ResetDemo />
      </Sheet>
    </>
  );
}
