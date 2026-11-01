import { useState, type FormEvent } from 'react';
import { PITCH_MAX, PitchInput } from '../../../shared/schemas';
import { ApiError } from '../../api/client';
import { useAskToJoin } from '../../api/queries';
import { Sheet } from '../../components/Sheet';

/** The count turns warn here, as a warning before the limit. */
const PITCH_WARNING_AT = 120;

const STARTERS = ['I create content about', 'My followers love', 'This fits my series on'];

function sendErrorMessage(error: unknown): string {
  if (error instanceof ApiError && error.code === 'COLLAB_FULL') {
    return 'All spots were filled while you were writing.';
  }
  if (error instanceof ApiError && error.code === 'COLLAB_ENDED') {
    return 'This ended while you were writing.';
  }
  return "Didn't send. Your message is still here. Try again.";
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
    <form className="form" onSubmit={send}>
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
        {ask.isPending ? 'Sending…' : 'Send application'}
      </button>
    </form>
  );
}

type Props = { collabId: string; open: boolean; onClose: () => void; onSent: () => void };

export function PitchSheet({ collabId, open, onClose, onSent }: Props) {
  const finish = () => {
    onSent();
    onClose();
  };

  return (
    <Sheet open={open} onClose={onClose} title="Apply">
      <PitchForm collabId={collabId} onSent={finish} />
    </Sheet>
  );
}
