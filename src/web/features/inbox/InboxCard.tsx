import { useState } from 'react';
import type { Collab, InboxRequest } from '../../../shared/api';
import { detectPlatform, PLATFORM_LABELS } from '../../../shared/postLink';
import { useRequestAction } from '../../api/queries';
import { CupArt } from '../../components/CupArt';

function PendingActions({
  request,
  collab,
  onAccept,
}: {
  request: InboxRequest;
  collab: Collab;
  onAccept: () => void;
}) {
  const decline = useRequestAction(request.id, 'decline');
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <div className="inbox-card__confirm">
        <p className="inbox-card__note">Say no to {request.creatorName}? This can't be undone.</p>
        <div className="inbox-card__actions">
          <button className="button" type="button" onClick={() => setConfirming(false)}>
            Keep it
          </button>
          <button
            className="button button--grow"
            type="button"
            onClick={() => decline.mutate()}
            disabled={decline.isPending}
          >
            {decline.isPending ? 'Sending…' : 'Yes, not this time'}
          </button>
        </div>
        {decline.isError && (
          <p className="form-error" role="alert">
            Didn't go through. Try again.
          </p>
        )}
      </div>
    );
  }

  return (
    <>
      {collab.state === 'ended' && <p className="inbox-card__note">Closed — this collab ended.</p>}
      {collab.state === 'full' && <p className="inbox-card__note">All spots are taken.</p>}
      <div className="inbox-card__actions">
        <button className="button" type="button" onClick={() => setConfirming(true)}>
          Not this time
        </button>
        {collab.state === 'open' && (
          <button className="button button--primary button--grow" type="button" onClick={onAccept}>
            Accept
          </button>
        )}
      </div>
    </>
  );
}

function PostLink({ url }: { url: string }) {
  return (
    <a className="inbox-card__link" href={url} target="_blank" rel="noreferrer">
      {PLATFORM_LABELS[detectPlatform(url)]} ↗
    </a>
  );
}

function SubmittedActions({ request, onServed }: { request: InboxRequest; onServed: () => void }) {
  const complete = useRequestAction(request.id, 'complete');
  return (
    <>
      <div className="inbox-card__actions">
        <button
          className="button button--primary button--grow"
          type="button"
          onClick={() => complete.mutate(undefined, { onSuccess: onServed })}
          disabled={complete.isPending}
        >
          {complete.isPending ? 'Saving…' : 'Mark served'}
        </button>
      </div>
      {complete.isError && (
        <p className="form-error" role="alert">
          Didn't go through. Try again.
        </p>
      )}
    </>
  );
}

type Props = {
  request: InboxRequest;
  collab: Collab;
  onAccept: (requestId: string) => void;
  onServed: () => void;
};

export function InboxCard({ request, collab, onAccept, onServed }: Props) {
  const showsPass = request.status === 'accepted' || request.status === 'submitted';

  return (
    <li className="inbox-card">
      <div className="inbox-card__who">
        <CupArt seed={request.creatorAvatarSeed} size={40} />
        <span>
          <span className="inbox-card__name">{request.creatorName}</span>
          {request.creatorHandle && (
            <span className="inbox-card__handle">{request.creatorHandle}</span>
          )}
        </span>
      </div>
      <p className="inbox-card__pitch">{request.pitch}</p>

      {showsPass && request.passCode && (
        <p className="inbox-card__pass">
          Pass <strong>{request.passCode}</strong>
        </p>
      )}
      {request.postUrl && <PostLink url={request.postUrl} />}
      {request.status === 'accepted' && (
        <p className="inbox-card__note">Waiting for their visit and post.</p>
      )}
      {request.status === 'pending' && (
        <PendingActions
          request={request}
          collab={collab}
          onAccept={() => onAccept(request.id)}
        />
      )}
      {request.status === 'submitted' && (
        <SubmittedActions request={request} onServed={onServed} />
      )}
    </li>
  );
}
