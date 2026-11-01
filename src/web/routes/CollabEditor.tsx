import { useNavigate, useParams } from 'react-router-dom';
import { useCollab } from '../api/queries';
import { BackHeader } from '../components/Layout';
import { ScreenState } from '../components/ScreenState';
import { Skeleton } from '../components/Skeleton';
import { CollabForm } from '../features/collabs/CollabForm';
import { NotYourCollab } from '../features/collabs/NotYourCollab';
import { useSession } from '../session';

function EditCollab({ id }: { id: string }) {
  const { user } = useSession();
  const navigate = useNavigate();
  const collab = useCollab(id);

  return (
    <ScreenState
      query={collab}
      errorTitle="Couldn't open this collab."
      skeleton={<Skeleton className="skeleton--line" count={5} />}
      notFound={<NotYourCollab />}
      isEmpty={(data) => data.collab.cafeId !== user?.cafeId}
      empty={<NotYourCollab />}
    >
      {({ collab: { title, offer, deliverable, spots, endsOn } }) => (
        <CollabForm
          collabId={id}
          initial={{ title, offer, deliverable, spots, endsOn }}
          onSaved={() => navigate(`/cafe/collabs/${id}`, { replace: true })}
        />
      )}
    </ScreenState>
  );
}

export function CollabEditor() {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <>
      <BackHeader to={id ? `/cafe/collabs/${id}` : '/cafe'} label={id ? 'Inbox' : 'Your collabs'} />
      <main className="page page--bar">
        <h1 className="page__title">{id ? 'Edit collab' : 'Post a collab'}</h1>
        {id ? (
          <EditCollab id={id} />
        ) : (
          <CollabForm onSaved={(newId) => navigate(`/cafe/collabs/${newId}`, { replace: true })} />
        )}
      </main>
    </>
  );
}
