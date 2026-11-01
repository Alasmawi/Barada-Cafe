import { Link } from 'react-router-dom';
import type { RequestWithCollab } from '../../shared/api';
import { STATUS_LABELS, type RequestStatus } from '../../shared/status';
import { useMyRequests } from '../api/queries';
import { CupArt } from '../components/CupArt';
import { MessageState } from '../components/MessageState';
import { ScreenState } from '../components/ScreenState';
import { Skeleton } from '../components/Skeleton';

/** Most urgent first: what the creator can act on now comes before what's finished. */
const SECTION_ORDER: RequestStatus[] = ['accepted', 'pending', 'submitted', 'done', 'declined'];

function requestLink(request: RequestWithCollab): string {
  return request.passCode ? `/me/passes/${request.id}` : `/collabs/${request.collabId}`;
}

function RequestRow({ request }: { request: RequestWithCollab }) {
  const filled = request.passCode !== null;
  return (
    <li>
      <Link className="request-row" to={requestLink(request)}>
        <CupArt seed={request.collabId} fill={filled ? 0.85 : 0} size={44} />
        <span className="request-row__text">
          <span className="request-row__cafe">{request.collab.cafeName}</span>
          <span className="request-row__offer">{request.collab.offer}</span>
        </span>
      </Link>
    </li>
  );
}

export function MyCollabs() {
  const requests = useMyRequests();

  return (
    <>
      <h1 className="page__title">My collabs</h1>
      <ScreenState
        query={requests}
        errorTitle="Couldn't find your cups."
        skeleton={<Skeleton className="skeleton--row" count={4} />}
        isEmpty={(data) => data.requests.length === 0}
        empty={
          <MessageState
            art="empty"
            title="You haven't asked for a cup yet."
            action={
              <Link className="button button--primary" to="/">
                Browse collabs
              </Link>
            }
          />
        }
      >
        {(data) =>
          SECTION_ORDER.map((status) => {
            const matching = data.requests.filter((request) => request.status === status);
            if (matching.length === 0) return null;
            return (
              <section key={status} className={`request-section request-section--${status}`}>
                <h2 className="section-title">{STATUS_LABELS[status]}</h2>
                <ul className="request-list">
                  {matching.map((request) => (
                    <RequestRow key={request.id} request={request} />
                  ))}
                </ul>
              </section>
            );
          })
        }
      </ScreenState>
    </>
  );
}
