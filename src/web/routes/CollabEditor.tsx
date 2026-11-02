import { useNavigate, useParams } from 'react-router-dom';
import { useCollab } from '../api/queries';
import { NavBar } from '../components/Layout';
import { ScreenState } from '../components/ScreenState';
import { MessageState } from '../components/MessageState';
import { Skeleton } from '../components/Skeleton';
import { CollabForm } from '../features/collabs/CollabForm';
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
      notFound={<MessageState art="empty" title="This post isn't yours." />}
      isEmpty={(data) => data.collab.businessId !== user?.businessId}
      empty={<MessageState art="empty" title="This post isn't yours." />}
    >
      {({ collab: { title, offer, deliverable, details, requirements, location, spots, endsOn } }) => (
        <CollabForm
          collabId={id}
          initial={{ title, offer, deliverable, details, requirements, location, spots, endsOn }}
          onSaved={() => navigate(`/business/collabs/${id}`, { replace: true })}
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
      <NavBar
        to={id ? `/business/collabs/${id}` : '/business/collabs'}
        title={id ? 'Edit post' : 'New post'}
      />
      <main className="page page--bar">
        {id ? (
          <EditCollab id={id} />
        ) : (
          <CollabForm onSaved={(newId) => navigate(`/business/collabs/${newId}`, { replace: true })} />
        )}
      </main>
    </>
  );
}
