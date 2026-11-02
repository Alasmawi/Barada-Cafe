import { QueryClientProvider } from '@tanstack/react-query';
import { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { BusinessTabs, CreatorTabs, GuestOnly, RequireRole } from './components/Layout';
import { PreviewBanner } from './components/PreviewBanner';
import { TopProgress } from './components/TopProgress';
import { OfflineBanner } from './components/OfflineBanner';
import { BusinessCollabs } from './routes/BusinessCollabs';
import { BusinessCreators } from './routes/BusinessCreators';
import { BusinessHome } from './routes/BusinessHome';
import { CollabEditor } from './routes/CollabEditor';
import { CollabInbox } from './routes/CollabInbox';
import { CollabDetail } from './routes/CollabDetail';
import { Feed } from './routes/Feed';
import { MyWork } from './routes/MyWork';
import { Profile } from './routes/Profile';
import { BusinessSignUpScreen, CreatorSignUpScreen } from './routes/SignUp';
import { VisitPass } from './routes/VisitPass';
import { Welcome } from './routes/Welcome';
import { queryClient, SessionProvider } from './session';

/** Each screen opens at its top. */
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function AppRoutes() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ScrollToTop />
        <TopProgress />
        <OfflineBanner />
        <PreviewBanner />
        <Routes>
          <Route element={<GuestOnly />}>
            <Route path="/welcome" element={<Welcome />} />
            <Route path="/signup/creator" element={<CreatorSignUpScreen />} />
            <Route path="/signup/business" element={<BusinessSignUpScreen />} />
          </Route>
          <Route element={<RequireRole role="creator" />}>
            <Route element={<CreatorTabs />}>
              <Route path="/" element={<Feed />} />
              <Route path="/me" element={<MyWork />} />
              <Route path="/profile" element={<Profile />} />
            </Route>
            <Route path="/collabs/:id" element={<CollabDetail />} />
            <Route path="/me/passes/:id" element={<VisitPass />} />
          </Route>
          <Route element={<RequireRole role="business" />}>
            <Route element={<BusinessTabs />}>
              <Route path="/business" element={<BusinessHome />} />
              <Route path="/business/collabs" element={<BusinessCollabs />} />
              <Route path="/business/creators" element={<BusinessCreators />} />
            </Route>
            <Route path="/business/collabs/new" element={<CollabEditor />} />
            <Route path="/business/collabs/:id" element={<CollabInbox />} />
            <Route path="/business/collabs/:id/edit" element={<CollabEditor />} />
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
