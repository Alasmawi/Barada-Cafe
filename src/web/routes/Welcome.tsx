import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ApiError } from '../api/client';
import { logIn } from '../api/queries';
import { AccountMenu, DEMO_PASSWORD } from '../components/AccountMenu';
import { Icon } from '../components/Icon';
import { HOME } from '../components/Layout';
import { useSession } from '../session';

const STEPS = [
  { title: 'Businesses post', detail: 'Free stays, meals and products' },
  { title: 'Creators apply', detail: 'With a short message' },
  { title: 'Businesses accept', detail: 'Then the creator posts' },
];

function LoginForm() {
  const { signIn } = useSession();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [failure, setFailure] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const send = async (event: FormEvent) => {
    event.preventDefault();
    setSending(true);
    setFailure(null);
    try {
      const { user } = await logIn({ username, password });
      signIn(user);
      navigate(HOME[user.role], { replace: true });
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
          autoCorrect="off"
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
        aria-busy={sending}
        disabled={sending || !username || !password}
      >
        {sending ? 'Logging in…' : 'Log in'}
      </button>
    </form>
  );
}

export function Welcome() {
  return (
    <main className="page welcome">
      <section className="welcome__intro-panel">
        <img src="/icon.svg" alt="" width={60} height={60} />
        <h1 className="welcome__title">Collab Board</h1>
        <p className="welcome__intro">
          Where businesses and creators find each other to collab.
        </p>
        <ol className="how-it-works">
          {STEPS.map((step, index) => (
            <li key={step.title} className="how-it-works__step">
              <span className="how-it-works__number">{index + 1}</span>
              <span className="list-row__text">
                <span className="list-row__title">{step.title}</span>
                <span className="list-row__detail">{step.detail}</span>
              </span>
            </li>
          ))}
        </ol>
      </section>

      <section className="welcome__actions">
        <h2 className="welcome__heading">Log in</h2>
        <div className="group group--padded">
          <LoginForm />
        </div>

        <h2 className="welcome__heading">New here?</h2>
        <div className="choice-list">
          <Link className="choice-card" to="/signup/business">
            <span className="choice-card__mark choice-card__mark--business" />
            <span className="list-row__text">
              <span className="list-row__title">I'm a business</span>
              <span className="list-row__detail">Post collabs</span>
            </span>
            <Icon name="chevron" size={18} />
          </Link>
          <Link className="choice-card" to="/signup/creator">
            <span className="choice-card__mark choice-card__mark--creator" />
            <span className="list-row__text">
              <span className="list-row__title">I'm a creator</span>
              <span className="list-row__detail">Browse and apply</span>
            </span>
            <Icon name="chevron" size={18} />
          </Link>
        </div>

        <h2 className="welcome__heading">Just looking?</h2>
        <AccountMenu label="Try a demo account" />
        <p className="note note--centre">Demo password: {DEMO_PASSWORD}</p>
      </section>
    </main>
  );
}
