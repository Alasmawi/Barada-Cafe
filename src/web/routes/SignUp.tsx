import { useState, type FormEvent, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import type { User } from '../../shared/api';
import { HOUSE_NAMES, HOUSES, type House } from '../../shared/houses';
import { SignUpInput } from '../../shared/schemas';
import type { Socials } from '../../shared/socials';
import { FORMATS, MAX_TAGS, NICHES, VIBES, type VibeTag } from '../../shared/tags';
import { ApiError } from '../api/client';
import { signUp } from '../api/queries';
import { HOME, NavBar } from '../components/Layout';
import { BrandMark } from '../components/BrandMark';
import { SocialFields } from '../features/creators/SocialFields';
import { Ring } from '../features/rings/Ring';
import { revealFirstError } from '../design/revealFirstError';
import { useSession } from '../session';

type Errors = Record<string, string | undefined>;

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <label className="field">
      <span className="field__label">{label}</span>
      {children}
      {error && (
        <span className="form-error" role="alert">
          {error}
        </span>
      )}
    </label>
  );
}

function Pill({ label, on, onPick }: { label: string; on: boolean; onPick: () => void }) {
  return (
    <button className="pill" type="button" aria-pressed={on} onClick={onPick}>
      {label}
    </button>
  );
}

/** Sends a sign-up and shows whatever is wrong beside the field it belongs to. */
function useSignUp() {
  const { signIn } = useSession();
  const navigate = useNavigate();
  const [errors, setErrors] = useState<Errors>({});
  const [failure, setFailure] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const enter = (user: User) => {
    signIn(user);
    navigate(HOME[user.role], { replace: true });
  };

  const send = async (input: unknown) => {
    const parsed = SignUpInput.safeParse(input);
    setFailure(null);
    if (!parsed.success) {
      const next: Errors = {};
      for (const issue of parsed.error.issues) next[String(issue.path[0])] ??= issue.message;
      setErrors(next);
      revealFirstError();
      return;
    }
    setErrors({});
    setSending(true);
    try {
      enter((await signUp(parsed.data)).user);
    } catch (error) {
      revealFirstError();
      if (error instanceof ApiError && error.fields) setErrors(error.fields);
      else setFailure("Couldn't create your account. Check your connection, then try again.");
    } finally {
      setSending(false);
    }
  };

  return { errors, failure, sending, send };
}

function Credentials({
  errors,
  username,
  password,
  onUsername,
  onPassword,
}: {
  errors: Errors;
  username: string;
  password: string;
  onUsername: (value: string) => void;
  onPassword: (value: string) => void;
}) {
  return (
    <>
      <Field label="Username" error={errors.username}>
        <input
          className="field__input"
          value={username}
          onChange={(event) => onUsername(event.target.value)}
          autoComplete="username"
          autoCapitalize="none"
        />
      </Field>
      <Field label="Password" error={errors.password}>
        <input
          className="field__input"
          type="password"
          value={password}
          onChange={(event) => onPassword(event.target.value)}
          autoComplete="new-password"
        />
      </Field>
    </>
  );
}

function CreatorForm() {
  const { errors, failure, sending, send } = useSignUp();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [handle, setHandle] = useState('@');
  const [signature, setSignature] = useState('');
  const [socials, setSocials] = useState<Socials>({});
  const [tags, setTags] = useState<string[]>(['Food', 'Reels']);
  const [vibe, setVibe] = useState<VibeTag>('Calm');
  const allTags = [...tags, vibe];

  const toggle = (tag: string) => {
    if (tags.includes(tag)) setTags(tags.filter((current) => current !== tag));
    else if (allTags.length < MAX_TAGS) setTags([...tags, tag]);
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    void send({ role: 'creator', username, password, name, handle, signature, socials, tags: allTags });
  };

  return (
    <form className="form" onSubmit={submit}>
      <div className="ring-preview">
        <Ring tags={allTags} size={132} />
        <div>
          <h1 className="section-heading">Your creator ring</h1>
          <p className="note">
            Each tag adds a ring, up to {MAX_TAGS}. You have {allTags.length}.
          </p>
        </div>
      </div>

      <fieldset className="pill-group">
        <legend className="pill-group__label">What you make</legend>
        {NICHES.map((tag) => (
          <Pill key={tag} label={tag} on={tags.includes(tag)} onPick={() => toggle(tag)} />
        ))}
      </fieldset>
      <fieldset className="pill-group">
        <legend className="pill-group__label">Your formats</legend>
        {FORMATS.map((tag) => (
          <Pill key={tag} label={tag} on={tags.includes(tag)} onPick={() => toggle(tag)} />
        ))}
      </fieldset>
      <fieldset className="pill-group">
        <legend className="pill-group__label">Your style</legend>
        {VIBES.map((tag) => (
          <Pill key={tag} label={tag} on={vibe === tag} onPick={() => setVibe(tag)} />
        ))}
      </fieldset>
      {errors.tags && (
        <p className="form-error" role="alert">
          {errors.tags}
        </p>
      )}

      <Field label="Your name" error={errors.name}>
        <input
          className="field__input"
          value={name}
          onChange={(event) => setName(event.target.value)}
          autoComplete="name"
        />
      </Field>
      <Field label="Your handle" error={errors.handle}>
        <input
          className="field__input"
          value={handle}
          onChange={(event) => setHandle(event.target.value)}
          autoCapitalize="none"
        />
      </Field>
      <Field label="One line about you" error={errors.signature}>
        <input
          className="field__input"
          value={signature}
          onChange={(event) => setSignature(event.target.value)}
          maxLength={60}
          placeholder="What your content is about"
        />
      </Field>
      <fieldset className="pill-group">
        <legend className="pill-group__label">Your socials (optional)</legend>
        <SocialFields socials={socials} onChange={setSocials} />
      </fieldset>
      {errors.socials && (
        <p className="form-error" role="alert">
          {errors.socials}
        </p>
      )}
      <Credentials
        errors={errors}
        username={username}
        password={password}
        onUsername={setUsername}
        onPassword={setPassword}
      />
      {failure && (
        <p className="form-error" role="alert">
          {failure}
        </p>
      )}
      <button className="button button--primary button--wide" type="submit" aria-busy={sending} disabled={sending}>
        {sending ? 'Creating…' : 'Create creator account'}
      </button>
    </form>
  );
}

function BusinessForm() {
  const { errors, failure, sending, send } = useSignUp();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [house, setHouse] = useState<House>('saffron');

  const submit = (event: FormEvent) => {
    event.preventDefault();
    void send({ role: 'business', username, password, businessName, house });
  };

  return (
    <form className="form" onSubmit={submit}>
      <div className="brand-preview">
        <BrandMark house={house} size={76} />
        <div>
          <p className="brand-preview__name">{businessName || 'Your business'}</p>
          <p className="note">Business account</p>
        </div>
      </div>

      <Field label="Business name" error={errors.businessName}>
        <input
          className="field__input"
          value={businessName}
          onChange={(event) => setBusinessName(event.target.value)}
          autoComplete="organization"
        />
      </Field>
      <fieldset className="house-picker">
        <legend className="pill-group__label">Your brand mark</legend>
        {HOUSE_NAMES.map((name) => (
          <button
            key={name}
            className="house-picker__option"
            type="button"
            aria-pressed={house === name}
            aria-label={HOUSES[name].label}
            onClick={() => setHouse(name)}
          >
            <BrandMark house={name} size={52} />
          </button>
        ))}
      </fieldset>

      <Credentials
        errors={errors}
        username={username}
        password={password}
        onUsername={setUsername}
        onPassword={setPassword}
      />
      {failure && (
        <p className="form-error" role="alert">
          {failure}
        </p>
      )}
      <button className="button button--primary button--wide" type="submit" aria-busy={sending} disabled={sending}>
        {sending ? 'Creating…' : 'Create business account'}
      </button>
    </form>
  );
}

export function CreatorSignUpScreen() {
  return (
    <>
      <NavBar to="/welcome" title="Creator account" />
      <main className="page page--plain">
        <CreatorForm />
      </main>
    </>
  );
}

export function BusinessSignUpScreen() {
  return (
    <>
      <NavBar to="/welcome" title="Business account" />
      <main className="page page--plain">
        <BusinessForm />
      </main>
    </>
  );
}
