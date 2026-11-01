import { QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { ApiError } from './api/client';
import { ErrorBoundary } from './components/ErrorBoundary';
import { CreatorTabs, RequireRole } from './components/Layout';
import { OfflineBanner } from './components/OfflineBanner';
import { CafeCollabs } from './routes/CafeCollabs';
import { CollabEditor } from './routes/CollabEditor';
import { CollabInbox } from './routes/CollabInbox';
import { CollabDetail } from './routes/CollabDetail';
import { Feed } from './routes/Feed';
import { MyCollabs } from './routes/MyCollabs';
import { VisitPass } from './routes/VisitPass';
import { Welcome } from './routes/Welcome';
import { SessionProvider, useSession } from './session';

function useAppQueryClient() {
  const { signOut } = useSession();
  return useState(
    () =>
      new QueryClient({
        queryCache: new QueryCache({
          onError: (error) => {
            // A remembered user who no longer exists goes back to the welcome screen.
            if (error instanceof ApiError && error.code === 'UNKNOWN_USER') signOut();
          },
        }),
        defaultOptions: { queries: { retry: false, staleTime: 10_000 } },
      }),
  )[0];
}

/** Each screen opens at its top. */
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function AppRoutes() {
  const queryClient = useAppQueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ScrollToTop />
        <OfflineBanner />
        <Routes>
          <Route path="/welcome" element={<Welcome />} />
          <Route element={<RequireRole role="creator" />}>
            <Route element={<CreatorTabs />}>
              <Route path="/" element={<Feed />} />
              <Route path="/me" element={<MyCollabs />} />
            </Route>
            <Route path="/collabs/:id" element={<CollabDetail />} />
            <Route path="/me/passes/:id" element={<VisitPass />} />
          </Route>
          <Route element={<RequireRole role="cafe_staff" />}>
            <Route path="/cafe" element={<CafeCollabs />} />
            <Route path="/cafe/collabs/new" element={<CollabEditor />} />
            <Route path="/cafe/collabs/:id" element={<CollabInbox />} />
            <Route path="/cafe/collabs/:id/edit" element={<CollabEditor />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export function App() {
  return (
    <ErrorBoundary>
      <SessionProvider>
        <AppRoutes />
      </SessionProvider>
    </ErrorBoundary>
  );
}
