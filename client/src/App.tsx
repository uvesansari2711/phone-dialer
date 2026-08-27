import { useState } from 'react';
import { Dialer } from './pages/Dialer';
import { CallHistoryPage } from './pages/CallHistory';
import { LoginPage } from './pages/Login';
import { useAuth } from './hooks/useAuth';

type View = 'dialer' | 'history';

function DialerApp() {
  const [view, setView] = useState<View>('dialer');
  const [redialNumber, setRedialNumber] = useState<string | undefined>();
  const { logout, email } = useAuth();

  const handleHistorySelect = (number: string) => {
    setRedialNumber(number);
    setView('dialer');
  };

  return (
    <div className="flex h-dvh overflow-hidden bg-dialer-app px-2 py-2 sm:px-3 sm:py-3">
      <div className="relative mx-auto flex h-full w-full max-w-sm flex-col overflow-hidden rounded-2xl border border-dialer-border bg-dialer-card shadow-card">
        <button
          type="button"
          onClick={logout}
          className="absolute right-3 top-3 z-10 rounded-full px-2.5 py-1 text-xs font-medium text-dialer-textMuted transition-colors hover:bg-dialer-key hover:text-dialer-text"
          aria-label="Sign out"
          title={email ?? 'Sign out'}
        >
          Sign out
        </button>

        {view === 'dialer' ? (
          <Dialer
            onViewAll={() => setView('history')}
            redialNumber={redialNumber}
            onRedialConsumed={() => setRedialNumber(undefined)}
          />
        ) : (
          <CallHistoryPage
            onBack={() => setView('dialer')}
            onSelect={handleHistorySelect}
          />
        )}
      </div>
    </div>
  );
}

function App() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-dvh items-center justify-center bg-dialer-app">
        <div className="rounded-2xl border border-dialer-border bg-dialer-card px-6 py-4 text-sm text-dialer-textSecondary shadow-card">
          Loading...
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return <DialerApp />;
}

export default App;
