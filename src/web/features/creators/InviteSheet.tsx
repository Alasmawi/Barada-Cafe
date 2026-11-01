import { useState } from 'react';
import type { CreatorCard } from '../../../shared/api';
import { ApiError } from '../../api/client';
import { useBusinessCollabs, useInvite } from '../../api/queries';
import { Sheet } from '../../components/Sheet';

function inviteErrorMessage(error: unknown): string {
  if (error instanceof ApiError && error.code === 'COLLAB_FULL') {
    return 'This filled up, so no more creators can join.';
  }
  return "The invite didn't send. Try again.";
}

function InviteList({ creator, onSent }: { creator: CreatorCard; onSent: () => void }) {
  const collabs = useBusinessCollabs();
  const invite = useInvite(creator.id);
  const [failure, setFailure] = useState<string | null>(null);
  const open = collabs.data?.collabs.filter(({ state }) => state === 'open') ?? [];

  const send = (collabId: string) => {
    setFailure(null);
    invite.mutate(collabId, {
      onSuccess: onSent,
      onError: (error) => setFailure(inviteErrorMessage(error)),
    });
  };

  if (collabs.isPending) return <p className="note">Loading your posts…</p>;
  if (open.length === 0) {
    return <p className="note">You have no open posts. Post one to invite creators.</p>;
  }

  return (
    <>
      <p className="note">Which post should {creator.name} join?</p>
      <ul className="invite-list">
        {open.map((collab) => (
          <li key={collab.id}>
            <button
              className="invite-list__option"
              type="button"
              onClick={() => send(collab.id)}
              disabled={invite.isPending}
            >
              <span>{collab.title}</span>
              <span className="invite-list__spots">
                {collab.spotsLeft} {collab.spotsLeft === 1 ? 'spot' : 'spots'} left
              </span>
            </button>
          </li>
        ))}
      </ul>
      {failure && (
        <p className="form-error" role="alert">
          {failure}
        </p>
      )}
    </>
  );
}

type Props = { creator: CreatorCard; open: boolean; onClose: () => void; onSent: () => void };

export function InviteSheet({ creator, open, onClose, onSent }: Props) {
  return (
    <Sheet open={open} onClose={onClose} title={`Invite ${creator.name}`}>
      <InviteList creator={creator} onSent={onSent} />
    </Sheet>
  );
}
