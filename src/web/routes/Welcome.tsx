import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { User } from '../../shared/api';
import { ApiError } from '../api/client';
import { logIn, useDemoAccounts, useResetDemo } from '../api/queries';
import { BrandMark } from '../components/BrandMark';
import { DemoMenu } from '../components/DemoMenu';
import { Icon } from '../components/Icon';
import { HOME } from '../components/Layout';
import { MessageState } from '../components/MessageState';
import { ScreenState } from '../components/ScreenState';
import { Skeleton } from '../components/Skeleton';
import { Ring } from '../features/rings/Ring';
import { useSession } from '../session';

/** Shown on this screen on purpose: every demo account shares it. */
const DEMO_PASSWORD = 'demo-password';

function useEnter() {
  const { signIn } = useSession();
  const navigate = useNavigate();
  return (user: User) => {
    signIn(user);
    navigate(HOME[user.role], { replace: true });
  };
}

function LoginSheetForm() {
  const enter = useEnter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [failure, setFailure] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const send = async (event: FormEvent) => {
    event.preventDefault();
    setSending(true);
    setFailure(null);
    try {
      enter((await logIn({ username, password })).user);
    } catch (error) {
      setFailure(
        error instanceof ApiError && error.code === 'WRONG_LOGIN'
          ? error.message
          : "Couldn't log in. Check your connection, then try again.",
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <form className="form" onSubmit={send}>
      <label className="field">
        <span className="field__label">Username</span>
        <input
          className="field__input"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          autoComplete="username"
          autoCapitalize="none"
        />
      </label>
      <label className="field">
        <span className="field__label">Password</span>
        <input
          className="field__input"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
        />
      </label>
      {failure && (
        <p className="form-error" role="alert">
          {failure}
        </p>
      )}
      <button
        className="button button--primary button--wide"
        type="submit"
        disabled={sending || !username || !password}
      >
        {sending ? 'Logging in…' : 'Log in'}
      </button>
    </form>
  );
}

function DemoAccount({ account }: { account: User }) {
  const enter = useEnter();
  const open = async () =>
    enter((await logIn({ username: account.username, password: DEMO_PASSWORD })).user);

  return (
    <li>
      <button className="list-row" type="button" onClick={open}>
        {account.businessHouse ? (
          <BrandMark house={account.businessHouse} size={40} />
        ) : (
          <Ring tags={account.tags} size={40} name={account.name} />
        )}
        <span className="list-row__text">
          <span className="list-row__title">{account.businessName ?? account.name}</span>
          <span className="list-row__detail">{account.handle ?? `${account.name}, staff`}</span>
        </span>
        <Icon name="chevron" size={18} />
      </button>
    </li>
  );
}

function EmptyDemo() {
  const reset = useResetDemo();
  return (
    <MessageState
      art="empty"
      title="No demo accounts yet"
      body="Reset the demo to bring back the sample businesses and creators."
      action={
        <button
          className="button button--primary"
          type="button"
          onClick={() => reset.mutate()}
          disabled={reset.isPending}
        >
          {reset.isPending ? 'Resetting…' : 'Reset demo'}
        </button>
      }
    />
  );
}

export function Welcome() {
  const accounts = useDemoAccounts();

  return (
    <main className="page welcome">
      <div className="welcome__top">
        <img src="/icon.svg" alt="" width={56} height={56} />
        <DemoMenu />
      </div>
      <h1 className="welcome__title">Collab Board</h1>
      <p className="welcome__intro">Businesses post collabs and offers. Creators apply.</p>

      <div className="choice-list">
        <Link className="choice-card" to="/signup/business">
          <span className="choice-card__mark choice-card__mark--business" />
          <span className="list-row__text">
            <span className="list-row__title">I'm a business</span>
            <span className="list-row__detail">Post collabs and offers, and choose your creators</span>
          </span>
          <Icon name="chevron" size={18} />
        </Link>
        <Link className="choice-card" to="/signup/creator">
          <span className="choice-card__mark choice-card__mark--creator" />
          <span className="list-row__text">
            <span className="list-row__title">I'm a creator</span>
            <span className="list-row__detail">Browse collabs and offers, and apply</span>
          </span>
          <Icon name="chevron" size={18} />
        </Link>
      </div>

      <h2 className="group-label">Already have an account?</h2>
      <section className="group group--padded">
        <LoginSheetForm />
      </section>

      <h2 className="group-label">Try the demo</h2>
      <p className="note note--inset">Tap an account. The password for all of them is {DEMO_PASSWORD}.</p>
      <ScreenState
        query={accounts}
        errorTitle="Couldn't load the demo accounts."
        skeleton={<Skeleton className="skeleton--row" count={3} />}
        isEmpty={(data) => data.accounts.length === 0}
        empty={<EmptyDemo />}
      >
        {(data) => (
          <>
            <h3 className="group-label">Businesses</h3>
            <ul className="group">
              {data.accounts
                .filter(({ role }) => role === 'business')
                .map((account) => (
                  <DemoAccount key={account.id} account={account} />
                ))}
            </ul>
            <h3 className="group-label">Creators</h3>
            <ul className="group">
              {data.accounts
                .filter(({ role }) => role === 'creator')
                .map((account) => (
                  <DemoAccount key={account.id} account={account} />
                ))}
            </ul>
          </>
        )}
      </ScreenState>
    </main>
  );
}
