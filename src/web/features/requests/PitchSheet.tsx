import { useState, type FormEvent } from 'react';
import { PITCH_MAX, PitchInput } from '../../../shared/schemas';
import { ApiError } from '../../api/client';
import { useAskToJoin } from '../../api/queries';
import { Sheet } from '../../components/Sheet';

/** The count turns qahwa here, as a warning before the limit. */
const PITCH_WARNING_AT = 120;

const STARTERS = ['I film slow pours for', 'My followers ask me about', 'This fits my series on'];

function sendErrorMessage(error: unknown): string {
  if (error instanceof ApiError && error.code === 'COLLAB_FULL') {
    return 'All cups are taken — this one filled up while you were writing.';
  }
  if (error instanceof ApiError && error.code === 'COLLAB_ENDED') {
    return 'This collab ended while you were writing.';
  }
  return "Didn't send — your pitch is still here. Try again.";
}

function PitchForm({ collabId, onSent }: { collabId: string; onSent: () => void }) {
  const ask = useAskToJoin(collabId);
  const [pitch, setPitch] = useState('');
  const valid = PitchInput.safeParse({ pitch }).success;

  const send = (event: FormEvent) => {
    event.preventDefault();
    if (valid) ask.mutate(pitch, { onSuccess: onSent });
  };

  return (
    <form className="sheet__form" onSubmit={send}>
      <label className="field">
        <span className="field__label">Why you, in one line</span>
        <input
          className="field__input"
          value={pitch}
          onChange={(event) => setPitch(event.target.value)}
          maxLength={PITCH_MAX}
          enterKeyHint="send"
          autoComplete="off"
        />
      </label>
      <div className="pitch-tools">
        <div className="starter-list">
          {pitch === '' &&
            STARTERS.map((starter) => (
              <button
                key={starter}
                className="starter"
                type="button"
                onClick={() => setPitch(`${starter} `)}
              >
                {starter}…
              </button>
            ))}
        </div>
        <span
          className={`pitch-count ${pitch.length >= PITCH_WARNING_AT ? 'pitch-count--near' : ''}`}
        >
          {pitch.length}/{PITCH_MAX}
        </span>
      </div>
      {ask.isError && (
        <p className="form-error" role="alert">
          {sendErrorMessage(ask.error)}
        </p>
      )}
      <button
        className="button button--primary button--wide"
        type="submit"
        disabled={!valid || ask.isPending}
      >
        {ask.isPending ? 'Pouring…' : 'Send my pitch'}
      </button>
    </form>
  );
}

type Props = { collabId: string; open: boolean; onClose: () => void };

export function PitchSheet({ collabId, open, onClose }: Props) {
  return (
    <Sheet open={open} onClose={onClose} title="Ask to join">
      <PitchForm collabId={collabId} onSent={onClose} />
    </Sheet>
  );
}
