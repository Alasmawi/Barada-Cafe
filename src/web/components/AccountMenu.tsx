import { useQueryClient } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Role, User } from '../../shared/api';
import { getPreviewMode, PREVIEW_MODES, setPreviewMode, type PreviewMode } from '../api/preview';
import { logIn, logOut, useDemoAccounts, useResetDemo } from '../api/queries';
import { Ring } from '../features/rings/Ring';
import { useSession } from '../session';
import { BrandMark } from './BrandMark';
import { Icon } from './Icon';
import { HOME } from './Layout';
import { Sheet } from './Sheet';

export const DEMO_PASSWORD = 'demo-password';

const PREVIEW_LABELS: Record<PreviewMode, string> = {
  normal: 'Off',
  slow: 'Slow',
  error: 'Error',
  empty: 'Empty',
};

const SIDES: { role: Role; label: string }[] = [
  { role: 'business', label: 'Businesses' },
  { role: 'creator', label: 'Creators' },
];

function AccountMark({ account, size }: { account: User; size: number }) {
  return account.businessHouse ? (
    <BrandMark house={account.businessHouse} size={size} />
  ) : (
    <Ring tags={account.tags} size={size} name={account.name} />
  );
}

const accountTitle = (account: User) => account.businessName ?? account.name;
const accountDetail = (account: User) =>
  account.role === 'business' ? `Business · ${account.username}` : `Creator · ${account.handle}`;

/** Moves to another account in one tap, without passing through the login page. */
function AccountList({ onDone }: { onDone: () => void }) {
  const { user, signIn } = useSession();
  const navigate = useNavigate();
  const accounts = useDemoAccounts();
  const [side, setSide] = useState<Role>(user?.role ?? 'business');
  const [switching, setSwitching] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  const open = async (account: User) => {
    setSwitching(account.id);
    setFailed(false);
    try {
      if (user) await logOut();
      const { user: next } = await logIn({ username: account.username, password: DEMO_PASSWORD });
      signIn(next);
      onDone();
      navigate(HOME[next.role], { replace: true });
    } catch {
      setFailed(true);
    } finally {
      setSwitching(null);
    }
  };

  const listed = accounts.data?.accounts.filter(
    (account) => account.role === side && account.id !== user?.id,
  );

  return (
    <>
      <div className="segmented" role="radiogroup" aria-label="Account type">
        {SIDES.map(({ role, label }) => (
          <button
            key={role}
            className="segmented__option"
            type="button"
            role="radio"
            aria-checked={side === role}
            onClick={() => setSide(role)}
          >
            {label}
          </button>
        ))}
      </div>
      {accounts.isPending && <div className="skeleton skeleton--row" />}
      {accounts.isError && <p className="form-error">Couldn't load the demo accounts.</p>}
      {failed && (
        <p className="form-error" role="alert">
          Couldn't switch account. Check your connection, then try again.
        </p>
      )}
      <ul className="group group--bordered">
        {listed?.map((account) => (
          <li key={account.id}>
            <button
              className="list-row"
              type="button"
              onClick={() => void open(account)}
              disabled={switching !== null}
            >
              <AccountMark account={account} size={40} />
              <span className="list-row__text">
                <span className="list-row__title">{accountTitle(account)}</span>
                <span className="list-row__detail">{accountDetail(account)}</span>
              </span>
              {switching === account.id ? <span className="spinner spinner--on" /> : <Icon name="chevron" size={18} />}
            </button>
          </li>
        ))}
      </ul>
    </>
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
  );
}

function ResetDemo() {
  const reset = useResetDemo();
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <button className="button button--wide" type="button" onClick={() => setConfirming(true)}>
        Reset demo data
      </button>
    );
  }

  return (
    <>
      <p className="note">
        This restores the sample data and removes anyone who signed up. Demo accounts stay logged in.
      </p>
      <div className="button-row">
        <button className="button" type="button" onClick={() => setConfirming(false)}>
          Keep it
        </button>
        <button
          className="button button--primary button--grow"
          type="button"
          onClick={() => reset.mutate(undefined, { onSuccess: () => setConfirming(false) })}
          aria-busy={reset.isPending}
          disabled={reset.isPending}
        >
          {reset.isPending ? 'Resetting…' : 'Yes, reset'}
        </button>
      </div>
      {reset.isError && (
        <p className="form-error" role="alert">
          Reset didn't finish. Try again.
        </p>
      )}
    </>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="sheet__section">
      <h3 className="group-label">{title}</h3>
      {children}
    </section>
  );
}

/** Everything about who you are, and the demo tools, in one place. */
function AccountSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user, signOut } = useSession();
  const navigate = useNavigate();

  const leave = async () => {
    await logOut().catch(() => undefined);
    signOut();
    onClose();
    navigate('/welcome', { replace: true });
  };

  return (
    <Sheet open={open} onClose={onClose} title={user ? 'Account' : 'Demo accounts'}>
      {user && (
        <div className="current-account">
          <AccountMark account={user} size={52} />
          <span className="list-row__text">
            <span className="list-row__detail">Logged in as</span>
            <span className="list-row__title">{accountTitle(user)}</span>
            <span className="list-row__detail">{accountDetail(user)}</span>
          </span>
        </div>
      )}
      <Section title={user ? 'Switch to another demo account' : 'Choose an account to try'}>
        <AccountList onDone={onClose} />
      </Section>
      <Section title="Preview a screen state">
        <PreviewStates />
      </Section>
      <Section title="Demo data">
        <ResetDemo />
      </Section>
      {user && (
        <button className="button button--wide" type="button" onClick={() => void leave()}>
          Log out
        </button>
      )}
    </Sheet>
  );
}

/** The button that opens it. `label` shows text, as on the welcome screen. */
export function AccountMenu({ label }: { label?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {label ? (
        <button className="button button--wide" type="button" onClick={() => setOpen(true)}>
          {label}
        </button>
      ) : (
        <button
          className="icon-button icon-button--account"
          type="button"
          aria-label="Account and switching"
          onClick={() => setOpen(true)}
        >
          <Icon name="profile" />
        </button>
      )}
      <AccountSheet open={open} onClose={() => setOpen(false)} />
    </>
  );
}
