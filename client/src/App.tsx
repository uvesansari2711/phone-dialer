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
    <div className="flex h-dvh overflow-hidden bg-dialer-app px-2 py-2 sm:px-3 sm:py-3">
      <div className="mx-auto flex h-full w-full max-w-sm flex-col overflow-hidden rounded-2xl border border-dialer-border bg-dialer-card shadow-card">
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
