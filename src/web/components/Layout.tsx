import type { ReactNode } from 'react';
import { Link, NavLink, Navigate, Outlet, useLocation } from 'react-router-dom';
import type { Role } from '../../shared/api';
import { useMyRequests } from '../api/queries';
import { useSession } from '../session';
import { Icon, type IconName } from './Icon';
import { PullToRefresh } from './PullToRefresh';

export const HOME: Record<Role, string> = { creator: '/', business: '/business' };

/** Sends visitors to the welcome screen, and each role to its own side of the app. */
export function RequireRole({ role }: { role: Role }) {
  const { user, loading } = useSession();
  if (loading) return <Splash />;
  if (!user) return <Navigate to="/welcome" replace />;
  if (user.role !== role) return <Navigate to={HOME[user.role]} replace />;
  return <Outlet />;
}

/** While a session is being checked, so there's never a blank screen. */
export function Splash() {
  return (
    <main className="splash" role="status" aria-label="Loading">
      <img src="/icon.svg" alt="" width={72} height={72} />
    </main>
  );
}

/** Someone logged in has no use for the login page, so they go to their home. */
export function GuestOnly() {
  const { user, loading } = useSession();
  if (loading) return <Splash />;
  if (user) return <Navigate to={HOME[user.role]} replace />;
  return <Outlet />;
}

/** The compact bar on pushed screens: back on the left, the title centred. */
export function NavBar({ to, title, action }: { to: string; title?: string; action?: ReactNode }) {
  return (
    <header className="nav-bar">
      <Link className="nav-bar__back" to={to} aria-label="Back">
        <Icon name="back" />
      </Link>
      <span className="nav-bar__title">{title}</span>
      <span className="nav-bar__action">{action}</span>
    </header>
  );
}

/** The big title at the top of each tab, as on iOS. */
export function LargeTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <header className="large-title">
      <h1>{children}</h1>
      {action}
    </header>
  );
}

function Tab({ to, icon, label, badge }: { to: string; icon: IconName; label: string; badge?: number }) {
  return (
    <NavLink className="tab-bar__link" to={to} end>
      <span className="tab-bar__icon">
        <Icon name={icon} />
        {badge ? <span className="tab-bar__badge">{badge}</span> : null}
      </span>
      {label}
    </NavLink>
  );
}

/** Keyed by path, so changing tab plays the same entrance as opening a screen. */
function TabPage() {
  const { pathname } = useLocation();
  return (
    <main key={pathname} className="page page--tabs">
      <PullToRefresh />
      <Outlet />
    </main>
  );
}

export function CreatorTabs() {
  // There are no notifications, so this is how a creator learns something changed.
  const requests = useMyRequests();
  const waiting =
    requests.data?.requests.filter(({ status }) => status === 'accepted' || status === 'invited')
      .length ?? 0;

  return (
    <>
      <TabPage />
      <nav className="tab-bar" aria-label="Main">
        <Tab to="/" icon="browse" label="Browse" />
        <Tab to="/me" icon="applications" label="Applications" badge={waiting} />
        <Tab to="/profile" icon="profile" label="Profile" />
      </nav>
    </>
  );
}

export function BusinessTabs() {
  return (
    <>
      <TabPage />
      <nav className="tab-bar" aria-label="Main">
        <Tab to="/business" icon="overview" label="Overview" />
        <Tab to="/business/collabs" icon="posts" label="My posts" />
        <Tab to="/business/creators" icon="creators" label="Creators" />
      </nav>
    </>
  );
}
