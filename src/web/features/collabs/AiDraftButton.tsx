import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import type { CollabDraft } from '../../../shared/api';
import { DraftRequest, SENTENCE_MAX, type CollabInput } from '../../../shared/schemas';
import { requestDraft } from '../../api/queries';
import { Icon } from '../../components/Icon';
import { Sheet } from '../../components/Sheet';
import { Toast } from '../../components/Toast';

const FIELD_NAMES: Partial<Record<keyof CollabInput, string>> = {
  title: 'the title',
  offer: 'the offer',
  deliverable: 'what to post',
  spots: 'the spots',
  endsOn: 'the last day',
};

const NO_HELP = "AI couldn't help this time. The form is all yours.";

function outcomeMessage({ unfilled }: CollabDraft): string {
  if (unfilled.length === 0) return 'Filled in. Check it before you publish.';
  return `Filled in. Please check ${unfilled.map((field) => FIELD_NAMES[field]).join(', ')}.`;
}

type Props = { onDraft: (draft: CollabDraft['draft']) => void };

/** Fills the form and nothing else: publishing stays with the business. */
export function AiDraftButton({ onDraft }: Props) {
  const [open, setOpen] = useState(false);
  const [sentence, setSentence] = useState('');
  const [reading, setReading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const request = useRef<AbortController | null>(null);
  const clearToast = useCallback(() => setToast(null), []);

  useEffect(() => () => request.current?.abort(), []);

  const close = () => {
    request.current?.abort();
    setReading(false);
    setOpen(false);
  };

  const draft = async (event: FormEvent) => {
    event.preventDefault();
    const controller = new AbortController();
    request.current = controller;
    setReading(true);
    setFailed(false);
    try {
      const result = await requestDraft(sentence, controller.signal);
      if (result.warning) {
        setFailed(true);
      } else {
        onDraft(result.draft);
        setToast(outcomeMessage(result));
        setOpen(false);
      }
    } catch {
      if (!controller.signal.aborted) setFailed(true);
    } finally {
      setReading(false);
    }
  };

  return (
    <>
      <button
        className="icon-button icon-button--soft"
        type="button"
        aria-label="Draft with AI"
        onClick={() => setOpen(true)}
      >
        <Icon name="sparkle" />
      </button>
      <Sheet open={open} onClose={close} title="Draft with AI">
        <form className="form" onSubmit={draft}>
          <label className="field">
            <span className="field__label">Describe your post in a sentence or two</span>
            <textarea
              className="field__input field__input--area"
              rows={3}
              value={sentence}
              onChange={(event) => setSentence(event.target.value)}
              maxLength={SENTENCE_MAX}
              placeholder="Three creators get a free meal this month for one Reel"
              disabled={reading}
            />
          </label>
          {reading && (
            <p className="note" role="status">
              Reading what you wrote…
            </p>
          )}
          {failed && (
            <p className="form-error" role="alert">
              {NO_HELP}
            </p>
          )}
          <button
            className="button button--primary button--wide"
            type="submit"
            disabled={reading || !DraftRequest.safeParse({ sentence }).success}
          >
            <Icon name="sparkle" size={20} /> Fill the form
          </button>
          <button className="button button--wide" type="button" onClick={close}>
            Skip, I'll type it
          </button>
        </form>
      </Sheet>
      {toast && <Toast message={toast} onDone={clearToast} />}
    </>
  );
}
