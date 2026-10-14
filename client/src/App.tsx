import { useState } from 'react';
import { Dialer } from './pages/Dialer';
import { CallHistoryPage } from './pages/CallHistory';
import { Conversation } from './pages/Conversation';
import { ConversationsPage } from './pages/Conversations';
import { LoginPage } from './pages/Login';
import { useAuth } from './hooks/useAuth';

type View = 'dialer' | 'history' | 'conversation' | 'conversations';

function DialerApp() {
  const [view, setView] = useState<View>('dialer');
  const [redialNumber, setRedialNumber] = useState<string | undefined>();
  const [smsNumber, setSmsNumber] = useState<string | undefined>();
  const { logout, email } = useAuth();

  const handleHistorySelect = (number: string) => {
    setRedialNumber(number);
    setView('dialer');
  };

  const handleOpenSms = (number: string) => {
    setSmsNumber(number);
    setView('conversation');
  };

  const handleCallFromThread = (number: string) => {
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

        {view === 'history' ? (
          <CallHistoryPage onBack={() => setView('dialer')} onSelect={handleHistorySelect} />
        ) : view === 'conversations' ? (
          <ConversationsPage
            onBack={() => setView('dialer')}
            onSelect={handleOpenSms}
          />
        ) : view === 'conversation' && smsNumber ? (
          <Conversation
            contactNumber={smsNumber}
            onBack={() => setView('dialer')}
            onCall={handleCallFromThread}
          />
        ) : (
          <Dialer
            onViewAll={() => setView('history')}
            onViewAllMessages={() => setView('conversations')}
            onOpenSms={handleOpenSms}
            redialNumber={redialNumber}
            onRedialConsumed={() => setRedialNumber(undefined)}
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
