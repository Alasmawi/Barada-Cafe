import { useState, type FormEvent } from 'react';
import { detectPlatform, isHttpsUrl, PLATFORM_LABELS } from '../../../shared/postLink';
import { SubmissionInput } from '../../../shared/schemas';
import { useSubmitLink } from '../../api/queries';
import { Sheet } from '../../components/Sheet';

type FormProps = { requestId: string; currentUrl: string | null; onSent: () => void };

function SubmitForm({ requestId, currentUrl, onSent }: FormProps) {
  const submit = useSubmitLink(requestId);
  const [postUrl, setPostUrl] = useState(currentUrl ?? '');
  const [invalid, setInvalid] = useState<string | null>(null);
  const trimmed = postUrl.trim();

  const send = (event: FormEvent) => {
    event.preventDefault();
    const parsed = SubmissionInput.safeParse({ postUrl: trimmed });
    if (!parsed.success) {
      setInvalid(parsed.error.issues[0]?.message ?? null);
      return;
    }
    setInvalid(null);
    submit.mutate(parsed.data.postUrl, { onSuccess: onSent });
  };

  return (
    <form className="form" onSubmit={send} noValidate>
      <label className="field">
        <span className="field__label">Link to your post</span>
        <input
          className="field__input"
          type="url"
          inputMode="url"
          value={postUrl}
          onChange={(event) => {
            setPostUrl(event.target.value);
            setInvalid(null);
          }}
          placeholder="https://"
          autoComplete="off"
          autoCapitalize="none"
          enterKeyHint="send"
          aria-invalid={invalid !== null}
        />
      </label>
      {isHttpsUrl(trimmed) && (
        <p className="platform-chip">{PLATFORM_LABELS[detectPlatform(trimmed)]} ✓</p>
      )}
      {invalid && (
        <p className="form-error" role="alert">
          {invalid}
        </p>
      )}
      {submit.isError && (
        <p className="form-error" role="alert">
          Didn't send. Try again.
        </p>
      )}
      <button
        className="button button--primary button--wide"
        type="submit"
        aria-busy={submit.isPending}
            disabled={submit.isPending}
      >
        {submit.isPending ? 'Sending…' : 'Send link'}
      </button>
    </form>
  );
}

type Props = Omit<FormProps, 'onSent'> & { open: boolean; onClose: () => void };

export function SubmitSheet({ open, onClose, ...form }: Props) {
  return (
    <Sheet open={open} onClose={onClose} title="Add your post link">
      <SubmitForm {...form} onSent={onClose} />
    </Sheet>
  );
}
