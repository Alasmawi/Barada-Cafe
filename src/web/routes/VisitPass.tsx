import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { RequestWithCollab } from '../../shared/api';
import { shortDate } from '../../shared/dates';
import { detectPlatform, PLATFORM_LABELS } from '../../shared/postLink';
import { useRequest } from '../api/queries';
import { CupArt } from '../components/CupArt';
import { BackHeader } from '../components/Layout';
import { MessageState } from '../components/MessageState';
import { ScreenState } from '../components/ScreenState';
import { Skeleton } from '../components/Skeleton';
import { StatusChip } from '../components/StatusChip';
import { SubmitSheet } from '../features/pass/SubmitSheet';

function PassActions({ request }: { request: RequestWithCollab }) {
  const [adding, setAdding] = useState(false);
  const label = request.status === 'submitted' ? 'Change my link' : "I've posted — add link";

  if (request.status === 'done') {
    return (
      <div className="action-bar">
        <p className="action-bar__note">Served. Thank you for visiting.</p>
      </div>
    );
  }

  return (
    <div className="action-bar">
      <button
        className="button button--primary button--wide"
        type="button"
        onClick={() => setAdding(true)}
      >
        {label}
      </button>
      <SubmitSheet
        requestId={request.id}
        currentUrl={request.postUrl}
        open={adding}
        onClose={() => setAdding(false)}
      />
    </div>
  );
}

function PassCard({ request }: { request: RequestWithCollab }) {
  const { collab } = request;
  return (
    <article className="pass">
      <div className="pass__top">
        <CupArt seed={collab.id} fill={0.85} size={112} />
        <p className="pass__cafe">
          {collab.cafeName} · {collab.cafeArea}
        </p>
        <h1 className="pass__offer">{collab.offer}</h1>
      </div>
      <dl className="facts">
        <div className="facts__row">
          <dt>What to post</dt>
          <dd>{collab.deliverable}</dd>
        </div>
        <div className="facts__row">
          <dt>Visit by</dt>
          <dd>{shortDate(collab.endsOn)}</dd>
        </div>
        {request.postUrl && (
          <div className="facts__row">
            <dt>Your link</dt>
            <dd>
              <a href={request.postUrl} target="_blank" rel="noreferrer">
                {PLATFORM_LABELS[detectPlatform(request.postUrl)]}
              </a>
            </dd>
          </div>
        )}
      </dl>
      <div className="pass__stub">
        <p className="pass__hint">Show this at the counter</p>
        <p className="pass__code">{request.passCode}</p>
      </div>
    </article>
  );
}

function PassSkeleton() {
  return <Skeleton className="skeleton--pass" />;
}

export function VisitPass() {
  const { id = '' } = useParams();
  const request = useRequest(id);

  return (
    <>
      <BackHeader to="/me" label="My collabs" />
      <main className="page page--bar">
        <ScreenState
          query={request}
          errorTitle="The pass didn't load."
          skeleton={<PassSkeleton />}
          notFound={
            <MessageState
              art="empty"
              title="This pass has been cleared away."
              action={
                <Link className="button" to="/me">
                  Back to my collabs
                </Link>
              }
            />
          }
          isEmpty={({ request: current }) => current.passCode === null}
          empty={
            <MessageState
              art="empty"
              title="This pass is still brewing."
              body="We'll pour it when the café says yes."
              action={
                <Link className="button" to="/me">
                  Back to my collabs
                </Link>
              }
            />
          }
        >
          {({ request: current }) => (
            <>
              <div className="pass__status">
                <StatusChip status={current.status} />
              </div>
              <PassCard request={current} />
              <PassActions request={current} />
            </>
          )}
        </ScreenState>
      </main>
    </>
  );
}
