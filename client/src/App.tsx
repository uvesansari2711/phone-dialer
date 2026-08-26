import { useState } from 'react';
import { Dialer } from './pages/Dialer';
import { CallHistoryPage } from './pages/CallHistory';

type View = 'dialer' | 'history';

function App() {
  const [view, setView] = useState<View>('dialer');
  const [redialNumber, setRedialNumber] = useState<string | undefined>();

  const handleHistorySelect = (number: string) => {
    setRedialNumber(number);
    setView('dialer');
  };

  return (
    <div className="min-h-dvh bg-dialer-app px-3 py-4 sm:py-6">
      <div className="mx-auto flex min-h-[calc(100dvh-2rem)] max-w-sm flex-col overflow-hidden rounded-2xl border border-dialer-border bg-dialer-card shadow-card sm:min-h-[calc(100dvh-3rem)]">
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

export default App;
