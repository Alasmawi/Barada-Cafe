import { useCallback, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { Collab } from '../../shared/api';
import { bahrainToday, endsLabel } from '../../shared/dates';
import { STATUS_LABELS, type RequestStatus } from '../../shared/status';
import { ApiError } from '../api/client';
import { useAcceptRequest, useCollab, useInbox } from '../api/queries';
import { NavBar } from '../components/Layout';
import { MessageState } from '../components/MessageState';
import { ScreenState } from '../components/ScreenState';
import { Skeleton } from '../components/Skeleton';
import { Toast } from '../components/Toast';
import { KindBadge, SpotsBar, spotsLabel } from '../features/collabs/CollabShared';
import { InboxCard } from '../features/inbox/InboxCard';

const TAB_ORDER: RequestStatus[] = ['pending', 'invited', 'accepted', 'submitted', 'done', 'declined'];

const TAB_LABELS: Record<RequestStatus, string> = { ...STATUS_LABELS, pending: 'New' };

function acceptErrorMessage(error: Error): string {
  if (error instanceof ApiError && error.code === 'COLLAB_FULL') {
    return 'That last spot was just taken by a teammate.';
  }
  if (error instanceof ApiError && error.code === 'COLLAB_ENDED') {
    return 'This post has ended, so no more creators can join.';
  }
  if (error instanceof ApiError && error.code === 'INVALID_TRANSITION') {
    return 'A teammate already answered this application.';
  }
  return "That didn't go through. Try again.";
}

function NotYours() {
  return (
    <MessageState
      art="empty"
      title="This post isn't yours."
      action={
        <Link className="button" to="/business/collabs">
          Back to My posts
        </Link>
      }
    />
  );
}

function Requests({ collab }: { collab: Collab }) {
  const inbox = useInbox(collab.id);
  // Null until staff choose or act, so the inbox opens where the work is.
  const [chosenTab, setChosenTab] = useState<RequestStatus | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const clearToast = useCallback(() => setToast(null), []);
  const accept = useAcceptRequest(collab.id, (error) => setNotice(acceptErrorMessage(error)));

  return (
    <ScreenState
      query={inbox}
      errorTitle="Couldn't load the applicants."
      skeleton={<Skeleton className="skeleton--card" count={3} />}
      notFound={<NotYours />}
      isEmpty={({ requests }) => requests.length === 0}
      empty={
        <MessageState
          art="empty"
          title="No applicants yet"
          body="Creators can see this on Browse. You can also invite them from Creators."
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
            <div className="filter-row" role="tablist" aria-label="Applicants by status">
              {tabs.map((status) => (
                <button
                  key={status}
                  className="pill"
                  type="button"
                  role="tab"
                  aria-selected={tab === status}
                  aria-pressed={tab === status}
                  onClick={() => setChosenTab(status)}
                >
                  {TAB_LABELS[status]} {countOf(status)}
                </button>
              ))}
            </div>
            {notice && (
              <p className="notice" role="alert">
                {notice}
              </p>
            )}
            {inTab.length === 0 && <p className="note note--centre">Nothing here right now.</p>}
            <ul className="post-list">
              {inTab.map((request) => (
                <InboxCard
                  key={request.id}
                  request={request}
                  collab={collab}
                  onAccept={(requestId) => {
                    setNotice(null);
                    setChosenTab(tab);
                    accept.mutate(requestId);
                  }}
                  onCompleted={() => {
                    setChosenTab(tab);
                    setToast('Marked complete');
                  }}
                />
              ))}
            </ul>
            {toast && <Toast message={toast} onDone={clearToast} />}
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
      <NavBar
        to="/business/collabs"
        title="Applicants"
        action={
          <Link className="nav-bar__link" to={`/business/collabs/${id}/edit`}>
            Edit
          </Link>
        }
      />
      <main className="page page--plain">
        <ScreenState
          query={collab}
          errorTitle="Couldn't load this post."
          skeleton={<Skeleton className="skeleton--card" count={3} />}
          notFound={<NotYours />}
        >
          {({ collab: detail }) => (
            <>
              <section className="group group--padded inbox-summary">
                <KindBadge kind={detail.kind} />
                <h1 className="inbox-summary__title">{detail.title}</h1>
                <p className="note">
                  {spotsLabel(detail)} · {endsLabel(detail.endsOn, bahrainToday())}
                </p>
                <SpotsBar collab={detail} />
              </section>
              <Requests collab={detail} />
            </>
          )}
        </ScreenState>
      </main>
    </>
  );
}
