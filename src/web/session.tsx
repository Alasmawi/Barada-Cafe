import { QueryCache, QueryClient } from '@tanstack/react-query';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { User } from '../shared/api';
import { api, ApiError } from './api/client';

let onSessionLost = () => {};

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => {
      if (error instanceof ApiError && error.code === 'NOT_SIGNED_IN') onSessionLost();
    },
  }),
  defaultOptions: { queries: { retry: false, staleTime: 10_000 } },
});

type Session = {
  user: User | null;
  /** True until we know whether the browser holds a session. */
  loading: boolean;
  signIn: (user: User) => void;
  signOut: () => void;
};

const SessionContext = createContext<Session | null>(null);

/** The session itself is an HttpOnly cookie, which this code can't read. It asks who it is. */
export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .me()
      .then(({ user: current }) => setUser(current))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  // Clearing first means one person's data can never show on the next person's screen.
  const signIn = useCallback((next: User) => {
    queryClient.clear();
    setUser(next);
  }, []);
  const signOut = useCallback(() => {
    queryClient.clear();
    setUser(null);
  }, []);

  useEffect(() => {
    onSessionLost = signOut;
  }, [signOut]);

  const session = useMemo(() => ({ user, loading, signIn, signOut }), [user, loading, signIn, signOut]);
  return <SessionContext.Provider value={session}>{children}</SessionContext.Provider>;
}

export function useSession(): Session {
  const session = useContext(SessionContext);
  if (!session) throw new Error('useSession must be used inside SessionProvider');
  return session;
}
