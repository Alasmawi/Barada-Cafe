import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { Collab, CollabRequest } from '../../shared/api';
import { bahrainToday, endsLabel, shortDate } from '../../shared/dates';
import { nextStep } from '../../shared/requestSteps';
import { ApiError } from '../api/client';
import { useAnswerInvite, useCollab } from '../api/queries';
import { BrandMark } from '../components/BrandMark';
import { NavBar } from '../components/Layout';
import { MessageState } from '../components/MessageState';
import { ScreenState } from '../components/ScreenState';
import { Skeleton } from '../components/Skeleton';
import { StatusChip } from '../components/StatusChip';
import { SpotsBar, spotsLabel } from '../features/collabs/CollabShared';
import { PitchSheet } from '../features/requests/PitchSheet';

function InviteBar({ request, endsOn }: { request: CollabRequest; endsOn: string }) {
  const answer = useAnswerInvite(request.id);
  return (
    <div className="action-bar">
      <p className="note">{nextStep(request.status, endsOn, bahrainToday())}</p>
      {answer.isError && (
        <p className="form-error" role="alert">
          {answer.error instanceof ApiError && answer.error.code === 'COLLAB_FULL'
            ? 'All spots were filled before you answered.'
            : "That didn't go through. Try again."}
        </p>
      )}
      <div className="button-row">
        <button
          className="button"
          type="button"
          onClick={() => answer.mutate('decline')}
          aria-busy={answer.isPending}
            disabled={answer.isPending}
        >
          Decline
        </button>
        <button
          className="button button--primary button--grow"
          type="button"
          onClick={() => answer.mutate('accept')}
          aria-busy={answer.isPending}
            disabled={answer.isPending}
        >
          Accept invite
        </button>
      </div>
    </div>
  );
}

function RequestBar({ request, endsOn }: { request: CollabRequest; endsOn: string }) {
  return (
    <div className="action-bar action-bar--split">
      <div className="action-bar__status">
        <StatusChip status={request.status} />
        <p className="note">{nextStep(request.status, endsOn, bahrainToday())}</p>
      </div>
      {request.passCode && (
        <Link className="button button--primary" to={`/me/passes/${request.id}`}>
          View
        </Link>
      )}
    </div>
  );
}

function ActionBar({ collab, request }: { collab: Collab; request: CollabRequest | null }) {
  const [asking, setAsking] = useState(false);

  return (
    <>
      {request?.status === 'invited' && <InviteBar request={request} endsOn={collab.endsOn} />}
      {request && request.status !== 'invited' && (
        <RequestBar request={request} endsOn={collab.endsOn} />
      )}
      {!request && collab.state === 'open' && (
        <div className="action-bar">
          <button
            className="button button--primary button--wide"
            type="button"
            onClick={() => setAsking(true)}
          >
            Apply
          </button>
        </div>
      )}
      {!request && collab.state !== 'open' && (
        <div className="action-bar action-bar--split">
          <p className="note">
            {collab.state === 'full' ? 'All spots are filled.' : 'This has ended.'}
          </p>
          <Link className="button" to="/">
            Browse
          </Link>
        </div>
      )}
      {/* Outside the branches above: if it fills mid-application, the sheet must stay to say so. */}
      <PitchSheet
        collabId={collab.id}
        open={asking}
        onClose={() => setAsking(false)}
        onSent={() => setAsking(false)}
      />
    </>
  );
}

export function CollabDetail() {
  const { id = '' } = useParams();
  const collab = useCollab(id);

  return (
    <>
      <NavBar to="/" title="Details" />
      <main className="page page--bar page--wide">
        <ScreenState
          query={collab}
          errorTitle="Couldn't load this."
          skeleton={<Skeleton className="skeleton--card" count={2} />}
          notFound={
            <MessageState
              art="empty"
              title="This has been removed."
              action={
                <Link className="button" to="/">
                  Back to Browse
                </Link>
              }
            />
          }
        >
          {({ collab: detail, myRequest }) => (
            <>
              <div className="split">
                <div className="split__side">
                  <section className={`brand-banner house--${detail.businessHouse}`}>
                    <BrandMark house={detail.businessHouse} size={64} />
                    <div>
                      <p className="brand-banner__name">{detail.businessName}</p>
                      <p className="brand-banner__detail">
                        {detail.businessType} · {detail.businessArea}
                      </p>
                    </div>
                  </section>
                  <div className="detail-head">
                    <h1 className="detail-head__title">{detail.title}</h1>
                  </div>
                </div>
                <dl className="group">
                  <div className="info-row">
                    <dt>You get</dt>
                    <dd>{detail.offer}</dd>
                  </div>
                  <div className="info-row">
                    <dt>You post</dt>
                    <dd>{detail.deliverable}</dd>
                  </div>
                  {detail.details && (
                    <div className="info-row">
                      <dt>About this post</dt>
                      <dd className="info-row__long">{detail.details}</dd>
                    </div>
                  )}
                  {detail.requirements && (
                    <div className="info-row">
                      <dt>Who they're looking for</dt>
                      <dd className="info-row__long">{detail.requirements}</dd>
                    </div>
                  )}
                  {detail.location && (
                    <div className="info-row">
                      <dt>Location</dt>
                      <dd>{detail.location}</dd>
                    </div>
                  )}
                  <div className="info-row">
                    <dt>Spots</dt>
                    <dd>
                      {spotsLabel(detail)}
                      <SpotsBar collab={detail} />
                    </dd>
                  </div>
                  <div className="info-row">
                    <dt>Last day</dt>
                    <dd>
                      {shortDate(detail.endsOn)} · {endsLabel(detail.endsOn, bahrainToday())}
                    </dd>
                  </div>
                </dl>
              </div>
              <ActionBar collab={detail} request={myRequest} />
            </>
          )}
        </ScreenState>
      </main>
    </>
  );
}
