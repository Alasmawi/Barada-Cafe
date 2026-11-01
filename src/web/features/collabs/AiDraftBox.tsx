import { useEffect, useRef, useState } from 'react';
import type { CollabDraft } from '../../../shared/api';
import { DraftRequest, SENTENCE_MAX, type CollabInput } from '../../../shared/schemas';
import { requestDraft } from '../../api/queries';

const FIELD_NAMES: Record<keyof CollabInput, string> = {
  title: 'the title',
  offer: 'the offer',
  deliverable: 'what to post',
  spots: 'the spots',
  endsOn: 'the last day',
};

const NO_HELP = "The AI couldn't help this time — the form is all yours.";

function outcomeMessage({ unfilled }: CollabDraft): string {
  if (unfilled.length === 0) return 'Drafted. Check it over, then publish.';
  const missing = unfilled.map((field) => FIELD_NAMES[field]).join(', ');
  return `Drafted what we could. Please check ${missing}.`;
}

type Props = { onDraft: (draft: CollabDraft['draft']) => void };

/** Fills the form and nothing else: publishing stays with the café. It can always be skipped. */
export function AiDraftBox({ onDraft }: Props) {
  const [sentence, setSentence] = useState('');
  const [reading, setReading] = useState(false);
  const [skipped, setSkipped] = useState(false);
  const [message, setMessage] = useState<{ text: string; failed: boolean } | null>(null);
  const request = useRef<AbortController | null>(null);

  useEffect(() => () => request.current?.abort(), []);

  const draft = async () => {
    const controller = new AbortController();
    request.current = controller;
    setReading(true);
    setMessage(null);
    try {
      const result = await requestDraft(sentence, controller.signal);
      onDraft(result.draft);
      setMessage(
        result.warning
          ? { text: NO_HELP, failed: true }
          : { text: outcomeMessage(result), failed: false },
      );
    } catch {
      if (!controller.signal.aborted) setMessage({ text: NO_HELP, failed: true });
    } finally {
      setReading(false);
    }
  };

  const skip = () => {
    request.current?.abort();
    setSkipped(true);
  };

  if (skipped) return null;

  return (
    <section className="ai-box">
      <label className="field">
        <span className="field__label">Describe your collab in one sentence</span>
        <textarea
          className="field__input field__input--area"
          rows={2}
          value={sentence}
          onChange={(event) => setSentence(event.target.value)}
          maxLength={SENTENCE_MAX}
          placeholder="Three creators get a free brunch this month for one Reel"
          disabled={reading}
        />
      </label>
      {reading && (
        <p className="ai-box__note" role="status">
          Reading your sentence…
        </p>
      )}
      {message && (
        <p className={message.failed ? 'form-error' : 'ai-box__note'} role="status">
          {message.text}
        </p>
      )}
      <div className="ai-box__actions">
        <button
          className="button button--grow"
          type="button"
          onClick={draft}
          disabled={reading || !DraftRequest.safeParse({ sentence }).success}
        >
          Fill the form for me
        </button>
        <button className="ai-box__skip" type="button" onClick={skip}>
          Skip, I'll type it
        </button>
      </div>
    </section>
  );
}
