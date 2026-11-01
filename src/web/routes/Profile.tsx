import { useNavigate } from 'react-router-dom';
import { logOut, useMyRequests } from '../api/queries';
import { BrandMark } from '../components/BrandMark';
import { DemoMenu } from '../components/DemoMenu';
import { LargeTitle } from '../components/Layout';
import { Ring } from '../features/rings/Ring';
import { useSession } from '../session';

export function Profile() {
  const { user, signOut } = useSession();
  const navigate = useNavigate();
  const requests = useMyRequests();
  const done = requests.data?.requests.filter(({ status }) => status === 'done') ?? [];

  const leave = async () => {
    await logOut();
    signOut();
    navigate('/welcome', { replace: true });
  };

  if (!user) return null;

  return (
    <>
      <LargeTitle action={<DemoMenu />}>Profile</LargeTitle>
      <div className="profile">
        <Ring tags={user.tags} size={200} name={user.name} />
        <h2 className="profile__name">{user.name}</h2>
        <p className="note">{user.handle}</p>
        {user.signature && <p className="profile__line">{user.signature}</p>}
        <ul className="tag-list">
          {user.tags.map((tag) => (
            <li key={tag} className="tag">
              {tag}
            </li>
          ))}
        </ul>
      </div>
      <h2 className="group-label">Worked with</h2>
      {done.length === 0 ? (
        <p className="note note--inset">Completed collabs appear here.</p>
      ) : (
        <ul className="group">
          {done.map(({ id, collab }) => (
            <li key={id} className="list-row">
              <BrandMark house={collab.businessHouse} size={40} />
              <span className="list-row__text">
                <span className="list-row__title">{collab.businessName}</span>
                <span className="list-row__detail">{collab.title}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
      <button className="button button--wide logout" type="button" onClick={leave}>
        Log out
      </button>
    </>
  );
}
