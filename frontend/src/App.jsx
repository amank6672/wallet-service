import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import { LoadingSkeleton } from './components/LoadingSkeleton.jsx';

// Lazy load pages for code splitting
const WalletPage = lazy(() => import('./pages/WalletPage.jsx'));
const TransactionsPage = lazy(() => import('./pages/TransactionsPage.jsx'));

/**
 * Loading fallback component
 */
function PageLoader() {
  return (
    <div style={{ padding: '40px', display: 'flex', justifyContent: 'center' }}>
      <LoadingSkeleton />
    </div>
  );
}

/**
 * Create QueryClient with optimized defaults
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Retry failed requests
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Refetch on window focus in production (optional)
      refetchOnWindowFocus: false,
      // Refetch on reconnect
      refetchOnReconnect: true,
      // Stale time for queries
      staleTime: 0,
    },
    mutations: {
      // Retry failed mutations
      retry: 1,
      retryDelay: 1000,
    },
  },
});

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<WalletPage />} />
              <Route path="/transactions" element={<TransactionsPage />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
        {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
