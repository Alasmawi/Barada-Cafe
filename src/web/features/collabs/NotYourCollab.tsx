import { Link } from 'react-router-dom';
import { MessageState } from '../../components/MessageState';

/** For a collab that's gone, or that belongs to another café. */
export function NotYourCollab() {
  return (
    <MessageState
      art="empty"
      title="This collab isn't one of yours."
      action={
        <Link className="button" to="/cafe">
          Back to your collabs
        </Link>
      }
    />
  );
}
