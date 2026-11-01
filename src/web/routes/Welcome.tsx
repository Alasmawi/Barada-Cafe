import { useNavigate } from 'react-router-dom';
import lockup from '../../../brand/svg/finjan-lockup.svg';
import scene from '../../../brand/svg/scene-serve.svg';
import type { User } from '../../shared/api';
import { useResetDemo, useUsers } from '../api/queries';
import { CupArt } from '../components/CupArt';
import { DemoMenu } from '../components/DemoMenu';
import { MessageState } from '../components/MessageState';
import { ScreenState } from '../components/ScreenState';
import { Skeleton } from '../components/Skeleton';
import { useSession } from '../session';

function UserGroup({ title, users }: { title: string; users: User[] }) {
  const { signIn } = useSession();
  const navigate = useNavigate();

  const choose = (user: User) => {
    signIn(user);
    navigate(user.role === 'creator' ? '/' : '/cafe', { replace: true });
  };

  return (
    <section className="user-group">
      <h2 className="user-group__title">{title}</h2>
      <ul className="user-group__list">
        {users.map((user) => (
          <li key={user.id}>
            <button className="user-row" type="button" onClick={() => choose(user)}>
              <CupArt seed={user.avatarSeed} size={40} />
              <span className="user-row__name">{user.name}</span>
              {user.handle && <span className="user-row__detail">{user.handle}</span>}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function EmptyMajlis() {
  const reset = useResetDemo();
  return (
    <MessageState
      art="empty"
      title="No one's here yet."
      body="Reset the demo to bring back the sample cafés and creators."
      action={
        <button
          className="button button--primary"
          type="button"
          onClick={() => reset.mutate()}
          disabled={reset.isPending}
        >
          {reset.isPending ? 'Resetting…' : 'Reset demo'}
        </button>
      }
    />
  );
}

export function Welcome() {
  const users = useUsers();

  return (
    <main className="page welcome">
      <div className="welcome__demo">
        <DemoMenu />
      </div>
      <img className="welcome__lockup" src={lockup} alt="Finjan · فنجان" />
      <img className="welcome__scene" src={scene} alt="" />
      <h1 className="welcome__title">Every cup is a spot.</h1>
      <p className="welcome__intro">
        The collab board for cafés and creators. Cafés post collabs, creators ask to join, visit
        and share a post. Choose who you are to try it.
      </p>

      <ScreenState
        query={users}
        errorTitle="We couldn't seat you. Check your connection."
        skeleton={<Skeleton className="skeleton--row" count={3} />}
        isEmpty={({ users: list }) => list.length === 0}
        empty={<EmptyMajlis />}
      >
        {({ users: list }) => (
          <>
            <UserGroup title="I make content" users={list.filter((u) => u.role === 'creator')} />
            <UserGroup title="I run a café" users={list.filter((u) => u.role === 'cafe_staff')} />
          </>
        )}
      </ScreenState>
    </main>
  );
}
