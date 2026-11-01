import { useCallback, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { RequestWithCollab } from '../../shared/api';
import { bahrainToday, shortDate } from '../../shared/dates';
import { detectPlatform, PLATFORM_LABELS } from '../../shared/postLink';
import { nextStep } from '../../shared/requestSteps';
import { useRequest } from '../api/queries';
import { CupArt } from '../components/CupArt';
import { BackHeader } from '../components/Layout';
import { MessageState } from '../components/MessageState';
import { ScreenState } from '../components/ScreenState';
import { Skeleton } from '../components/Skeleton';
import { AcceptedMoment } from '../features/moments/AcceptedMoment';
import { Journey } from '../features/pass/Journey';
import { hasSeen, markSeen, prefersReducedMotion } from '../features/moments/motion';
import { SubmitSheet } from '../features/pass/SubmitSheet';
import { TiltCard } from '../features/pass/TiltCard';

function PassActions({ request }: { request: RequestWithCollab }) {
  const [adding, setAdding] = useState(false);
  const label = request.status === 'submitted' ? 'Change my link' : "I've posted — add link";

  if (request.status === 'done') {
    return (
      <div className="action-bar">
        <Link className="button button--primary button--wide" to="/">
          Find your next collab
        </Link>
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
  // Once the visit is behind them the code is only a reference, so it stops asking for attention.
  const visiting = request.status === 'accepted';
  return (
    <TiltCard>
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
        {visiting && (
          <div className="facts__row">
            <dt>Visit by</dt>
            <dd>{shortDate(collab.endsOn)}</dd>
          </div>
        )}
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
        <p className="pass__hint">{visiting ? 'Show this at the counter' : 'Pass code'}</p>
        <p className={`pass__code ${visiting ? '' : 'pass__code--used'}`}>{request.passCode}</p>
      </div>
    </TiltCard>
  );
}

function PassView({ request }: { request: RequestWithCollab }) {
  const [moment, setMoment] = useState(
    () => request.status === 'accepted' && !hasSeen(request.id) && !prefersReducedMotion(),
  );
  const finishMoment = useCallback(() => {
    markSeen(request.id);
    setMoment(false);
  }, [request.id]);

  if (moment) return <AcceptedMoment onDone={finishMoment} />;

  return (
    <div className="pass-view">
      <Journey status={request.status} />
      <p className="pass__next">
        {nextStep(request.status, request.collab.endsOn, bahrainToday())}
      </p>
      <PassCard request={request} />
      <PassActions request={request} />
    </div>
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
              title="This pass has been removed."
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
              title="This pass isn't ready yet."
              body="It appears here when the café accepts you."
              action={
                <Link className="button" to="/me">
                  Back to my collabs
                </Link>
              }
            />
          }
        >
          {({ request: current }) => <PassView request={current} />}
        </ScreenState>
      </main>
    </>
  );
}
