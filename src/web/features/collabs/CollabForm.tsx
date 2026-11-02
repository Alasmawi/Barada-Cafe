import { useState, type FormEvent, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import type { CollabDraft } from '../../../shared/api';
import { addDays, bahrainToday } from '../../../shared/dates';
import { COLLAB_KINDS, CollabInput, SPOTS_MAX, SPOTS_MIN } from '../../../shared/schemas';
import { ApiError } from '../../api/client';
import { useSaveCollab } from '../../api/queries';
import { revealFirstError } from '../../design/revealFirstError';
import { AiDraftButton } from './AiDraftButton';
import { KIND_LABELS } from './CollabShared';

const DEFAULT_RUN_DAYS = 7;

type Draft = Omit<CollabInput, 'spots'> & { spots: string };
type FieldErrors = Partial<Record<keyof CollabInput, string>>;

const blankDraft = (): Draft => ({
  kind: 'collab',
  title: '',
  offer: '',
  deliverable: '',
  details: '',
  requirements: '',
  location: '',
  spots: '3',
  endsOn: addDays(bahrainToday(), DEFAULT_RUN_DAYS),
});

function fieldErrors(error: { issues: { path: PropertyKey[]; message: string }[] }): FieldErrors {
  const errors: FieldErrors = {};
  for (const issue of error.issues) {
    const field = issue.path[0] as keyof CollabInput;
    errors[field] ??= issue.message;
  }
  return errors;
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
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

type Props = {
  /** Present when editing. */
  collabId?: string;
  initial?: CollabInput;
  onSaved: (collabId: string) => void;
};

export function CollabForm({ collabId, initial, onSaved }: Props) {
  const navigate = useNavigate();
  const save = useSaveCollab(collabId);
  const [draft, setDraft] = useState<Draft>(() =>
    initial ? { ...initial, spots: String(initial.spots) } : blankDraft(),
  );
  const [errors, setErrors] = useState<FieldErrors>({});
  const [failure, setFailure] = useState<string | null>(null);

  const update = (field: keyof Draft, value: string) => {
    setDraft((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const applyDraft = ({ spots, ...text }: CollabDraft['draft']) => {
    setDraft((current) => ({
      ...current,
      ...text,
      ...(spots === undefined ? {} : { spots: String(spots) }),
    }));
    setErrors({});
  };

  const stepSpots = (change: number) => {
    const next = (Number(draft.spots) || 0) + change;
    update('spots', String(Math.min(Math.max(next, SPOTS_MIN), SPOTS_MAX)));
  };

  const showServerError = (error: unknown) => {
    revealFirstError();
    if (error instanceof ApiError && error.code === 'SPOTS_BELOW_TAKEN') {
      setErrors({ spots: error.message });
    } else if (error instanceof ApiError && error.fields) {
      setErrors(error.fields);
    } else {
      setFailure("Didn't save — your changes are still here. Try again.");
    }
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setFailure(null);
    const parsed = CollabInput.safeParse({ ...draft, spots: Number(draft.spots) });
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      revealFirstError();
      return;
    }
    setErrors({});
    save.mutate(parsed.data, {
      onSuccess: ({ collab }) => onSaved(collab.id),
      onError: showServerError,
    });
  };

  const idleLabel = collabId ? 'Save changes' : 'Publish';

  return (
    <>
      {/* Outside the form: the AI sheet holds a form of its own, and forms can't nest. */}
      <div className="form__top">
        <div className="segmented segmented--two" role="radiogroup" aria-label="What are you posting?">
          {COLLAB_KINDS.map((kind) => (
            <button
              key={kind}
              className="segmented__option"
              type="button"
              role="radio"
              aria-checked={draft.kind === kind}
              onClick={() => update('kind', kind)}
            >
              {KIND_LABELS[kind]}
            </button>
          ))}
        </div>
          {!collabId && <AiDraftButton onDraft={applyDraft} />}
        </div>
      <form className="form" onSubmit={submit} noValidate>
        <Field label="Title" error={errors.title}>
          <input
            className="field__input"
            value={draft.title}
            onChange={(event) => update('title', event.target.value)}
            placeholder="New menu launch"
            aria-invalid={errors.title !== undefined}
          />
        </Field>
        <Field label="What you're offering" error={errors.offer}>
          <textarea
            className="field__input field__input--area"
            rows={4}
            value={draft.offer}
            onChange={(event) => update('offer', event.target.value)}
            placeholder="A free meal for two"
            aria-invalid={errors.offer !== undefined}
          />
        </Field>
        <Field label="What to post" error={errors.deliverable}>
          <textarea
            className="field__input field__input--area"
            rows={4}
            value={draft.deliverable}
            onChange={(event) => update('deliverable', event.target.value)}
            placeholder="One Reel tagging us"
            aria-invalid={errors.deliverable !== undefined}
          />
        </Field>
        <Field label="About this post (optional)" error={errors.details}>
          <textarea
            className="field__input field__input--area field__input--tall"
            rows={6}
            value={draft.details}
            onChange={(event) => update('details', event.target.value)}
            placeholder="The story behind it, when to come, and what makes it worth doing"
            aria-invalid={errors.details !== undefined}
          />
        </Field>
        <Field label="Who you're looking for (optional)" error={errors.requirements}>
          <textarea
            className="field__input field__input--area"
            rows={4}
            value={draft.requirements}
            onChange={(event) => update('requirements', event.target.value)}
            placeholder="The kind of creator, their area, or their style"
            aria-invalid={errors.requirements !== undefined}
          />
        </Field>
        <Field label="Location (optional)" error={errors.location}>
          <input
            className="field__input"
            value={draft.location}
            onChange={(event) => update('location', event.target.value)}
            placeholder="Your branch or address"
            aria-invalid={errors.location !== undefined}
          />
        </Field>
        <div className="collab-form__row">
          <Field label="Spots" error={errors.spots}>
            <span className="stepper">
              <button
                className="stepper__button"
                type="button"
                onClick={() => stepSpots(-1)}
                aria-label="One spot fewer"
              >
                −
              </button>
              <input
                className="stepper__value"
                inputMode="numeric"
                value={draft.spots}
                onChange={(event) => update('spots', event.target.value)}
                aria-invalid={errors.spots !== undefined}
              />
              <button
                className="stepper__button"
                type="button"
                onClick={() => stepSpots(1)}
                aria-label="One spot more"
              >
                +
              </button>
            </span>
          </Field>
          <Field label="Last day" error={errors.endsOn}>
            <input
              className="field__input"
              type="date"
              value={draft.endsOn}
              min={bahrainToday()}
              onChange={(event) => update('endsOn', event.target.value)}
              aria-invalid={errors.endsOn !== undefined}
            />
          </Field>
        </div>
        {failure && (
          <p className="form-error" role="alert">
            {failure}
          </p>
        )}
        <div className="action-bar action-bar--split">
          <button className="button" type="button" onClick={() => navigate(-1)}>
            Cancel
          </button>
          <button
            className="button button--primary button--grow"
            type="submit"
            aria-busy={save.isPending}
            disabled={save.isPending}
          >
            {save.isPending ? 'Saving…' : idleLabel}
          </button>
        </div>
      </form>
    </>
  );
}
