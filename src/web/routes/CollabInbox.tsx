import { useCallback, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CupStack } from '../components/CupStack';
import { bahrainToday, endsLabel } from '../../shared/dates';
import { STATUS_LABELS, type RequestStatus } from '../../shared/status';
import { ApiError } from '../api/client';
import { useAcceptRequest, useCollab, useInbox } from '../api/queries';
import { BackHeader } from '../components/Layout';
import { MessageState } from '../components/MessageState';
import { ScreenState } from '../components/ScreenState';
import { Skeleton } from '../components/Skeleton';
import { spotsLabel } from '../features/collabs/CollabShelf';
import { NotYourCollab } from '../features/collabs/NotYourCollab';
import { InboxCard } from '../features/inbox/InboxCard';
import { ServedMoment } from '../features/moments/ServedMoment';

/** The order work moves through the café, with declined out of the way at the end. */
const TAB_ORDER: RequestStatus[] = ['pending', 'accepted', 'submitted', 'done', 'declined'];

/** The status labels speak to the creator. Staff working an inbox get the plain names. */
const TAB_LABELS: Record<RequestStatus, string> = {
  ...STATUS_LABELS,
  pending: 'New',
  accepted: 'Accepted',
  declined: 'Declined',
};

function acceptErrorMessage(error: Error): string {
  if (error instanceof ApiError && error.code === 'COLLAB_FULL') {
    return 'That last spot was just taken by a teammate.';
  }
  if (error instanceof ApiError && error.code === 'COLLAB_ENDED') {
    return 'This collab has ended, so no more creators can join.';
  }
  if (error instanceof ApiError && error.code === 'INVALID_TRANSITION') {
    return 'A teammate already answered this pitch.';
  }
  return "Didn't go through. Try again.";
}

function InboxSkeleton() {
  return <Skeleton className="skeleton--pitch" count={3} />;
}

function Requests({ collabId }: { collabId: string }) {
  const collab = useCollab(collabId);
  const inbox = useInbox(collabId);
  // Null until staff choose or act, so the inbox opens where the work is.
  const [chosenTab, setChosenTab] = useState<RequestStatus | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [served, setServed] = useState<string | null>(null);
  const clearServed = useCallback(() => setServed(null), []);
  const accept = useAcceptRequest(collabId, (error) => setNotice(acceptErrorMessage(error)));

  const detail = collab.data?.collab;

  return (
    <ScreenState
      query={inbox}
      errorTitle="The inbox didn't load."
      skeleton={<InboxSkeleton />}
      notFound={<NotYourCollab />}
      isEmpty={({ requests }) => requests.length === 0}
      empty={
        <MessageState
          art="empty"
          title="No pitches yet."
          body="Creators see this collab in their feed — they usually arrive within a day."
        />
      }
    >
      {({ requests }) => {
        const countOf = (status: RequestStatus) =>
          requests.filter((request) => request.status === status).length;
        const tab = chosenTab ?? TAB_ORDER.find((status) => countOf(status) > 0) ?? 'pending';
        const tabs = TAB_ORDER.filter((status) => countOf(status) > 0 || status === tab);
        const inTab = requests.filter(({ status }) => status === tab);
        return (
          <>
            <div className="inbox-tabs" role="tablist" aria-label="Pitches by status">
              {tabs.map((status) => (
                <button
                  key={status}
                  className="inbox-tabs__tab"
                  type="button"
                  role="tab"
                  aria-selected={tab === status}
                  onClick={() => setChosenTab(status)}
                >
                  {TAB_LABELS[status]}{' '}
                  <span className="inbox-tabs__count">{countOf(status)}</span>
                </button>
              ))}
            </div>
            {notice && (
              <p className="inbox-notice" role="alert">
                {notice}
              </p>
            )}
            {inTab.length === 0 && (
              <p className="inbox-tab-empty">Nothing in {TAB_LABELS[tab]} right now.</p>
            )}
            {detail && (
              <ul className="inbox-list">
                {inTab.map((request) => (
                  <InboxCard
                    key={request.id}
                    request={request}
                    collab={detail}
                    onAccept={(requestId) => {
                      setNotice(null);
                      setChosenTab(tab);
                      accept.mutate(requestId);
                    }}
                    onServed={() => {
                      setChosenTab(tab);
                      setServed(request.creatorName);
                    }}
                  />
                ))}
              </ul>
            )}
            {served && <ServedMoment creatorName={served} onDone={clearServed} />}
          </>
        );
      }}
    </ScreenState>
  );
}

export function CollabInbox() {
  const { id = '' } = useParams();
  const collab = useCollab(id);

  return (
    <>
      <BackHeader to="/cafe" label="Your collabs" />
      <main className="page">
        <ScreenState
          query={collab}
          errorTitle="The inbox didn't load."
          skeleton={<InboxSkeleton />}
          notFound={<NotYourCollab />}
        >
          {({ collab: detail }) => (
            <>
              <div className="inbox-head">
                <div className="inbox-head__text">
                  <h1 className="inbox-head__title">{detail.title}</h1>
                  <p className="inbox-head__meta">
                    {spotsLabel(detail)} · {endsLabel(detail.endsOn, bahrainToday())}
                  </p>
                  <Link className="inbox-head__edit" to={`/cafe/collabs/${id}/edit`}>
                    Edit collab
                  </Link>
                </div>
                <CupStack
                  spots={detail.spots}
                  taken={detail.spotsTaken}
                  seed={detail.id}
                  width={132}
                />
              </div>
              <Requests collabId={id} />
            </>
          )}
        </ScreenState>
      </main>
    </>
  );
}
