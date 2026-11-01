import { Link } from 'react-router-dom';
import type { RequestWithCollab } from '../../shared/api';
import { bahrainToday } from '../../shared/dates';
import { nextStep } from '../../shared/requestSteps';
import { STATUS_LABELS, type RequestStatus } from '../../shared/status';
import { useMyRequests } from '../api/queries';
import { BrandMark } from '../components/BrandMark';
import { Icon } from '../components/Icon';
import { LargeTitle } from '../components/Layout';
import { MessageState } from '../components/MessageState';
import { ScreenState } from '../components/ScreenState';
import { Skeleton } from '../components/Skeleton';

/** What needs the creator's action comes first. */
const SECTION_ORDER: RequestStatus[] = ['invited', 'accepted', 'pending', 'submitted', 'done', 'declined'];

function requestLink(request: RequestWithCollab): string {
  return request.passCode ? `/me/passes/${request.id}` : `/collabs/${request.collabId}`;
}

function RequestRow({ request }: { request: RequestWithCollab }) {
  return (
    <li>
      <Link className="list-row" to={requestLink(request)}>
        <BrandMark house={request.collab.businessHouse} size={44} />
        <span className="list-row__text">
          <span className="list-row__detail">{request.collab.businessName}</span>
          <span className="list-row__title">{request.collab.title}</span>
          <span className="list-row__detail">
            {nextStep(request.status, request.collab.endsOn, bahrainToday())}
          </span>
        </span>
        <Icon name="chevron" size={18} />
      </Link>
    </li>
  );
}

export function MyWork() {
  const requests = useMyRequests();

  return (
    <>
      <LargeTitle>Applications</LargeTitle>
      <ScreenState
        query={requests}
        errorTitle="Couldn't load your applications."
        skeleton={<Skeleton className="skeleton--row" count={4} />}
        isEmpty={(data) => data.requests.length === 0}
        empty={
          <MessageState
            art="empty"
            title="No applications yet"
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
              <section key={status}>
                <h2 className="group-label">{STATUS_LABELS[status]}</h2>
                <ul className="group">
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
