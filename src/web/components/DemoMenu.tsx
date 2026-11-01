import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPreviewMode, PREVIEW_MODES, setPreviewMode, type PreviewMode } from '../api/preview';
import { useResetDemo, useUsers } from '../api/queries';
import { useSession } from '../session';
import { Sheet } from './Sheet';

const PREVIEW_LABELS: Record<PreviewMode, string> = {
  normal: 'Normal',
  slow: 'Slow (3s)',
  error: 'Error',
  empty: 'Empty',
};

function minutesAgo(iso: string): string {
  const minutes = Math.round((Date.now() - Date.parse(iso)) / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  return hours < 24 ? `${hours} h ago` : `${Math.round(hours / 24)} d ago`;
}

function ResetDemo() {
  const reset = useResetDemo();
  const users = useUsers();
  const [confirming, setConfirming] = useState(false);
  const lastResetAt = users.data?.lastResetAt;

  const confirm = () => reset.mutate(undefined, { onSuccess: () => setConfirming(false) });

  return (
    <section className="demo-menu__section">
      <h3 className="demo-menu__label">Demo data</h3>
      {confirming ? (
        <>
          <p className="demo-menu__note">This puts everything back for everyone testing now.</p>
          <div className="demo-menu__actions">
            <button className="button" type="button" onClick={() => setConfirming(false)}>
              Keep it
            </button>
            <button
              className="button button--primary"
              type="button"
              onClick={confirm}
              disabled={reset.isPending}
            >
              {reset.isPending ? 'Resetting…' : 'Yes, reset'}
            </button>
          </div>
        </>
      ) : (
        <button className="button" type="button" onClick={() => setConfirming(true)}>
          Reset demo
        </button>
      )}
      {reset.isError && (
        <p className="form-error" role="alert">
          Reset didn't finish. Try again.
        </p>
      )}
      {lastResetAt && <p className="demo-menu__note">Last reset {minutesAgo(lastResetAt)}</p>}
    </section>
  );
}

function PreviewStates() {
  const queryClient = useQueryClient();
  const [mode, setMode] = useState(getPreviewMode);

  const choose = (next: PreviewMode) => {
    setPreviewMode(next);
    setMode(next);
    void queryClient.resetQueries();
  };

  return (
    <section className="demo-menu__section">
      <h3 className="demo-menu__label">Preview states</h3>
      <div className="segmented" role="radiogroup" aria-label="Preview states">
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

export function DemoMenu() {
  const { user } = useSession();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const switchUser = () => {
    setOpen(false);
    navigate('/welcome');
  };

  return (
    <>
      <button className="role-chip" type="button" onClick={() => setOpen(true)}>
        {user?.name ?? 'Demo'} <span aria-hidden>▾</span>
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} title="Demo menu">
        {user && (
          <section className="demo-menu__section">
            <h3 className="demo-menu__label">Testing as</h3>
            <div className="demo-menu__user">
              <span>
                {user.name}
                {user.handle && <span className="demo-menu__handle"> {user.handle}</span>}
              </span>
              <button className="button" type="button" onClick={switchUser}>
                Switch
              </button>
            </div>
          </section>
        )}
        <PreviewStates />
        <ResetDemo />
      </Sheet>
    </>
  );
}
