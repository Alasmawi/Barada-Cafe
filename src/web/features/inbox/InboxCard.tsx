import { useState } from 'react';
import type { Collab, InboxRequest } from '../../../shared/api';
import { detectPlatform, PLATFORM_LABELS } from '../../../shared/postLink';
import { useRequestAction } from '../../api/queries';
import { Ring } from '../rings/Ring';

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
        <p className="note">Decline {request.creatorName}? This can't be undone.</p>
        <div className="button-row">
          <button className="button" type="button" onClick={() => setConfirming(false)}>
            Keep it
          </button>
          <button
            className="button button--grow"
            type="button"
            onClick={() => decline.mutate()}
            disabled={decline.isPending}
          >
            {decline.isPending ? 'Declining…' : 'Yes, decline'}
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
      {collab.state === 'ended' && <p className="note">Closed. This post has ended.</p>}
      {collab.state === 'full' && <p className="note">All spots are filled.</p>}
      <div className="button-row">
        <button className="button" type="button" onClick={() => setConfirming(true)}>
          Decline
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

function SubmittedActions({ request, onCompleted }: { request: InboxRequest; onCompleted: () => void }) {
  const complete = useRequestAction(request.id, 'complete');
  return (
    <>
      <div className="button-row">
        <button
          className="button button--primary button--grow"
          type="button"
          onClick={() => complete.mutate(undefined, { onSuccess: onCompleted })}
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
  onCompleted: () => void;
};

export function InboxCard({ request, collab, onAccept, onCompleted }: Props) {
  const showsPass = request.status === 'accepted' || request.status === 'submitted';

  return (
    <li className="inbox-card">
      <div className="inbox-card__who">
        <Ring tags={request.creatorTags} size={52} name={request.creatorName} />
        <span>
          <span className="inbox-card__name">{request.creatorName}</span>
          {request.creatorHandle && (
            <span className="inbox-card__handle">{request.creatorHandle}</span>
          )}
        </span>
      </div>
      {request.creatorSignature && (
        <p className="creator-line">{request.creatorSignature}</p>
      )}
      {request.status === 'invited' ? (
        <p className="note">Invited. Waiting for their answer.</p>
      ) : (
        <p className="inbox-card__pitch">{request.pitch}</p>
      )}

      {showsPass && request.passCode && (
        <p className="inbox-card__pass">
          Pass <strong>{request.passCode}</strong>
        </p>
      )}
      {request.postUrl && <PostLink url={request.postUrl} />}
      {request.status === 'accepted' && (
        <p className="note">Waiting for their post.</p>
      )}
      {request.status === 'pending' && (
        <PendingActions
          request={request}
          collab={collab}
          onAccept={() => onAccept(request.id)}
        />
      )}
      {request.status === 'submitted' && (
        <SubmittedActions request={request} onCompleted={onCompleted} />
      )}
    </li>
  );
}
