import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { RequestWithCollab } from '../../shared/api';
import { bahrainToday, shortDate } from '../../shared/dates';
import { detectPlatform, PLATFORM_LABELS } from '../../shared/postLink';
import { nextStep } from '../../shared/requestSteps';
import { useRequest } from '../api/queries';
import { BrandMark } from '../components/BrandMark';
import { NavBar } from '../components/Layout';
import { MessageState } from '../components/MessageState';
import { ScreenState } from '../components/ScreenState';
import { Skeleton } from '../components/Skeleton';
import { Journey } from '../features/pass/Journey';
import { SubmitSheet } from '../features/pass/SubmitSheet';

function PassActions({ request }: { request: RequestWithCollab }) {
  const [adding, setAdding] = useState(false);

  if (request.status === 'done') {
    return (
      <div className="action-bar">
        <Link className="button button--primary button--wide" to="/">
          Browse collabs
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
        {request.status === 'submitted' ? 'Change my link' : 'Add my post link'}
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

function Application({ request }: { request: RequestWithCollab }) {
  const { collab } = request;
  const visiting = request.status === 'accepted';

  return (
    <>
      <section className={`brand-banner house--${collab.businessHouse}`}>
        <BrandMark house={collab.businessHouse} size={64} />
        <div>
          <p className="brand-banner__name">{collab.businessName}</p>
          <p className="brand-banner__detail">{collab.title}</p>
        </div>
      </section>
      <Journey status={request.status} />
      <p className="note note--centre">
        {nextStep(request.status, collab.endsOn, bahrainToday())}
      </p>
      {visiting && (
        <section className="code-card">
          <p className="note">Show this code at {collab.businessName}</p>
          <p className="code-card__code">{request.passCode}</p>
        </section>
      )}
      <dl className="group">
        <div className="info-row">
          <dt>You get</dt>
          <dd>{collab.offer}</dd>
        </div>
        <div className="info-row">
          <dt>You post</dt>
          <dd>{collab.deliverable}</dd>
        </div>
        {collab.location && (
          <div className="info-row">
            <dt>Location</dt>
            <dd>{collab.location}</dd>
          </div>
        )}
        {visiting && (
          <div className="info-row">
            <dt>Visit by</dt>
            <dd>{shortDate(collab.endsOn)}</dd>
          </div>
        )}
        {request.postUrl && (
          <div className="info-row">
            <dt>Your link</dt>
            <dd>
              <a href={request.postUrl} target="_blank" rel="noreferrer">
                {PLATFORM_LABELS[detectPlatform(request.postUrl)]}
              </a>
            </dd>
          </div>
        )}
      </dl>
      <PassActions request={request} />
    </>
  );
}

export function VisitPass() {
  const { id = '' } = useParams();
  const request = useRequest(id);
  const backToList = (
    <Link className="button" to="/me">
      Back to Applications
    </Link>
  );

  return (
    <>
      <NavBar to="/me" title="Application" />
      <main className="page page--bar">
        <ScreenState
          query={request}
          errorTitle="Couldn't load this application."
          skeleton={<Skeleton className="skeleton--card" count={2} />}
          notFound={<MessageState art="empty" title="This has been removed." action={backToList} />}
          isEmpty={({ request: current }) => current.passCode === null}
          empty={
            <MessageState
              art="empty"
              title="Not accepted yet"
              body="You'll see the details here once the business accepts you."
              action={backToList}
            />
          }
        >
          {({ request: current }) => <Application request={current} />}
        </ScreenState>
      </main>
    </>
  );
}
