import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { User } from '../shared/api';

const STORAGE_KEY = 'finjan.user';

function readStoredUser(): User | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? (JSON.parse(stored) as User) : null;
  } catch {
    return null;
  }
}

function storeUser(user: User | null): void {
  try {
    if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Private mode: the session lasts until the page is closed.
  }
}

let currentUser = readStoredUser();

/** Read by the API client, which runs outside React. */
export const actingUserId = () => currentUser?.id ?? null;

function setCurrentUser(user: User | null): void {
  currentUser = user;
  storeUser(user);
}

type Session = {
  user: User | null;
  signIn: (user: User) => void;
  signOut: () => void;
};

const SessionContext = createContext<Session | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState(currentUser);

  const signIn = useCallback((next: User) => {
    setCurrentUser(next);
    setUser(next);
  }, []);
  const signOut = useCallback(() => {
    setCurrentUser(null);
    setUser(null);
  }, []);

  const session = useMemo(() => ({ user, signIn, signOut }), [user, signIn, signOut]);
  return <SessionContext.Provider value={session}>{children}</SessionContext.Provider>;
}

export function useSession(): Session {
  const session = useContext(SessionContext);
  if (!session) throw new Error('useSession must be used inside SessionProvider');
  return session;
}
