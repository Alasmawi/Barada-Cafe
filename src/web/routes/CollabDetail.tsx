import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CupStack } from '../components/CupStack';
import type { Collab, CollabRequest } from '../../shared/api';
import { bahrainToday, endsLabel, shortDate } from '../../shared/dates';
import { useCollab } from '../api/queries';
import { BackHeader } from '../components/Layout';
import { MessageState } from '../components/MessageState';
import { ScreenState } from '../components/ScreenState';
import { Skeleton } from '../components/Skeleton';
import { StatusChip } from '../components/StatusChip';
import { spotsLabel } from '../features/collabs/CollabShelf';
import { PitchSheet } from '../features/requests/PitchSheet';

const WAITING_NOTES: Partial<Record<CollabRequest['status'], string>> = {
  pending: 'The café will read your pitch soon.',
  declined: 'The café went another way on this one.',
};

function RequestBar({ request, justSent }: { request: CollabRequest; justSent: boolean }) {
  return (
    <div className={`action-bar action-bar--split ${justSent ? 'action-bar--arrived' : ''}`}>
      <div className="action-bar__status">
        <StatusChip status={request.status} />
        {WAITING_NOTES[request.status] && (
          <p className="action-bar__note">{WAITING_NOTES[request.status]}</p>
        )}
      </div>
      {request.passCode && (
        <Link className="button button--primary" to={`/me/passes/${request.id}`}>
          See my pass
        </Link>
      )}
      {justSent && (
        <Link className="button" to="/me">
          My collabs
        </Link>
      )}
    </div>
  );
}

function ActionBar({ collab, request }: { collab: Collab; request: CollabRequest | null }) {
  const [asking, setAsking] = useState(false);
  const [justSent, setJustSent] = useState(false);

  return (
    <>
      {request && <RequestBar request={request} justSent={justSent} />}
      {!request && collab.state === 'open' && (
        <div className="action-bar">
          <button
            className="button button--primary button--wide"
            type="button"
            onClick={() => setAsking(true)}
          >
            Ask to join
          </button>
        </div>
      )}
      {!request && collab.state !== 'open' && (
        <div className="action-bar">
          <p className="action-bar__note">
            {collab.state === 'full' ? 'All spots are taken.' : 'This collab has ended.'}
          </p>
        </div>
      )}
      {/* Outside the branches above: if the collab fills mid-pitch, the sheet must stay to say so. */}
      <PitchSheet
        collabId={collab.id}
        open={asking}
        onClose={() => setAsking(false)}
        onSent={() => setJustSent(true)}
      />
    </>
  );
}

function DetailSkeleton() {
  return (
    <>
      <Skeleton className="skeleton--heading" />
      <Skeleton className="skeleton--stack" />
      <Skeleton className="skeleton--line" count={3} />
    </>
  );
}

export function CollabDetail() {
  const { id = '' } = useParams();
  const collab = useCollab(id);

  return (
    <>
      <BackHeader to="/" label="Collabs" />
      <main className="page page--bar">
        <ScreenState
          query={collab}
          errorTitle="Couldn't load this collab."
          skeleton={<DetailSkeleton />}
          notFound={
            <MessageState
              art="empty"
              title="This collab has been removed."
              action={
                <Link className="button" to="/">
                  Back to the feed
                </Link>
              }
            />
          }
        >
          {({ collab: detail, myRequest }) => (
            <>
              <p className="detail__cafe">
                {detail.cafeName} · {detail.cafeArea}
              </p>
              <h1 className="detail__offer">{detail.offer}</h1>
              <div className="detail__tray">
                <CupStack
                  spots={detail.spots}
                  taken={detail.spotsTaken}
                  seed={detail.id}
                  width={180}
                />
                <p className="detail__spots">{spotsLabel(detail)}</p>
              </div>
              <dl className="facts">
                <div className="facts__row">
                  <dt>The collab</dt>
                  <dd>{detail.title}</dd>
                </div>
                <div className="facts__row">
                  <dt>What to post</dt>
                  <dd>{detail.deliverable}</dd>
                </div>
                <div className="facts__row">
                  <dt>Last day</dt>
                  <dd>
                    {shortDate(detail.endsOn)} · {endsLabel(detail.endsOn, bahrainToday())}
                  </dd>
                </div>
              </dl>
              <ActionBar collab={detail} request={myRequest} />
            </>
          )}
        </ScreenState>
      </main>
    </>
  );
}
