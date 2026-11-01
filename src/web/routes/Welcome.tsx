import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import lockup from '../../../brand/svg/finjan-lockup.svg';
import scene from '../../../brand/svg/scene-serve.svg';
import type { Role, User } from '../../shared/api';
import { useResetDemo, useUsers } from '../api/queries';
import { CupArt } from '../components/CupArt';
import { DemoMenu } from '../components/DemoMenu';
import { MessageState } from '../components/MessageState';
import { ScreenState } from '../components/ScreenState';
import { Skeleton } from '../components/Skeleton';
import { useSession } from '../session';

const SIDES: { role: Role; label: string }[] = [
  { role: 'creator', label: 'I make content' },
  { role: 'cafe_staff', label: 'I run a café' },
];

function ChooseUser({ users }: { users: User[] }) {
  const { signIn } = useSession();
  const navigate = useNavigate();
  const [side, setSide] = useState<Role>('creator');

  const choose = (user: User) => {
    signIn(user);
    navigate(user.role === 'creator' ? '/' : '/cafe', { replace: true });
  };

  return (
    <section>
      <div className="segmented segmented--two" role="radiogroup" aria-label="Choose a side">
        {SIDES.map(({ role, label }) => (
          <button
            key={role}
            className="segmented__option"
            type="button"
            role="radio"
            aria-checked={side === role}
            onClick={() => setSide(role)}
          >
            {label}
          </button>
        ))}
      </div>
      <ul className="user-group__list">
        {users
          .filter((user) => user.role === side)
          .map((user) => (
            <li key={user.id}>
              <button className="user-row" type="button" onClick={() => choose(user)}>
                <CupArt seed={user.avatarSeed} size={40} />
                <span className="user-row__name">{user.name}</span>
                <span className="user-row__detail">{user.handle ?? user.cafeName}</span>
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
        and share a post.
      </p>

      <ScreenState
        query={users}
        errorTitle="We couldn't seat you. Check your connection."
        skeleton={<Skeleton className="skeleton--row" count={3} />}
        isEmpty={({ users: list }) => list.length === 0}
        empty={<EmptyMajlis />}
      >
        {({ users: list }) => <ChooseUser users={list} />}
      </ScreenState>
    </main>
  );
}
