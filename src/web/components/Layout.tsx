import type { ReactNode } from 'react';
import { Link, NavLink, Navigate, Outlet } from 'react-router-dom';
import mark from '../../../brand/svg/finjan-mark-static.svg';
import type { Role } from '../../shared/api';
import { useSession } from '../session';
import { DemoMenu } from './DemoMenu';

const HOME: Record<Role, string> = { creator: '/', cafe_staff: '/cafe' };

/** Sends visitors to the welcome screen, and each role to its own side of the app. */
export function RequireRole({ role }: { role: Role }) {
  const { user } = useSession();
  if (!user) return <Navigate to="/welcome" replace />;
  if (user.role !== role) return <Navigate to={HOME[user.role]} replace />;
  return <Outlet />;
}

export function AppHeader({ start }: { start?: ReactNode }) {
  return (
    <header className="app-header">
      {start ?? (
        <Link className="app-header__home" to="/" aria-label="Finjan home">
          <img src={mark} alt="" />
        </Link>
      )}
      <DemoMenu />
    </header>
  );
}

export function BackHeader({ to, label }: { to: string; label: string }) {
  return (
    <AppHeader
      start={
        <Link className="back-link" to={to}>
          <span aria-hidden>‹</span> {label}
        </Link>
      }
    />
  );
}

/** The two top-level creator screens share the header and the tab bar. */
export function CreatorTabs() {
  return (
    <>
      <AppHeader />
      <main className="page page--tabs">
        <Outlet />
      </main>
      <nav className="tab-bar" aria-label="Main">
        <NavLink className="tab-bar__link" to="/" end>
          Browse
        </NavLink>
        <NavLink className="tab-bar__link" to="/me" end>
          My collabs
        </NavLink>
      </nav>
    </>
  );
}
