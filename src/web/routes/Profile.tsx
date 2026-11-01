import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { SocialsInput, type Socials } from '../../shared/socials';
import { logOut, useMyRequests, useSaveSocials } from '../api/queries';
import { BrandMark } from '../components/BrandMark';
import { DemoMenu } from '../components/DemoMenu';
import { LargeTitle } from '../components/Layout';
import { Sheet } from '../components/Sheet';
import { SocialFields } from '../features/creators/SocialFields';
import { SocialLinks } from '../features/creators/SocialLinks';
import { Ring } from '../features/rings/Ring';
import { useSession } from '../session';

function SocialsForm({ current, onSaved }: { current: Socials; onSaved: () => void }) {
  const { signIn } = useSession();
  const save = useSaveSocials();
  const [socials, setSocials] = useState(current);
  const [invalid, setInvalid] = useState<string | null>(null);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const parsed = SocialsInput.safeParse(socials);
    if (!parsed.success) {
      setInvalid(parsed.error.issues[0]?.message ?? null);
      return;
    }
    setInvalid(null);
    save.mutate(parsed.data, {
      onSuccess: ({ user }) => {
        signIn(user);
        onSaved();
      },
    });
  };

  return (
    <form className="form" onSubmit={submit}>
      <SocialFields socials={socials} onChange={setSocials} />
      {invalid && (
        <p className="form-error" role="alert">
          {invalid}
        </p>
      )}
      {save.isError && (
        <p className="form-error" role="alert">
          Didn't save. Try again.
        </p>
      )}
      <button className="button button--primary button--wide" type="submit" disabled={save.isPending}>
        {save.isPending ? 'Saving…' : 'Save'}
      </button>
    </form>
  );
}

export function Profile() {
  const { user, signOut } = useSession();
  const navigate = useNavigate();
  const requests = useMyRequests();
  const [editing, setEditing] = useState(false);
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
      <h2 className="group-label">Socials</h2>
      <section className="group group--padded profile__socials">
        <SocialLinks socials={user.socials} />
        {Object.keys(user.socials).length === 0 && (
          <p className="note">Add your socials so businesses can see your work.</p>
        )}
        <button className="button button--wide" type="button" onClick={() => setEditing(true)}>
          Edit socials
        </button>
      </section>
      <Sheet open={editing} onClose={() => setEditing(false)} title="Your socials">
        <SocialsForm current={user.socials} onSaved={() => setEditing(false)} />
      </Sheet>
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
