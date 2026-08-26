import { useCallback, useEffect, useState } from 'react';
import { CallHistory } from '../../components/CallHistory';
import { api } from '../../services/api';
import type { CallRecord } from '../../types';

interface CallHistoryPageProps {
  onBack: () => void;
  onSelect: (phoneNumber: string) => void;
}

export function CallHistoryPage({ onBack, onSelect }: CallHistoryPageProps) {
  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCalls = useCallback(async () => {
    try {
      const data = await api.getCalls();
      setCalls(data);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCalls();
  }, [loadCalls]);

  const handleSelect = useCallback(
    (phoneNumber: string) => {
      onSelect(phoneNumber);
      onBack();
    },
    [onSelect, onBack],
  );

  return (
    <div className="flex min-h-full flex-1 flex-col bg-dialer-card">
      <header className="flex items-center gap-3 border-b border-dialer-border px-4 py-4">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to dialer"
          className="flex h-10 w-10 items-center justify-center rounded-full text-dialer-accent hover:bg-dialer-key active:bg-dialer-keyHover"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
            <path
              fillRule="evenodd"
              d="M11.03 3.97a.75.75 0 010 1.06l-6.22 6.22H21a.75.75 0 010 1.5H4.81l6.22 6.22a.75.75 0 11-1.06 1.06l-7.5-7.5a.75.75 0 010-1.06l7.5-7.5a.75.75 0 011.06 0z"
              clipRule="evenodd"
            />
          </svg>
        </button>
        <h1 className="text-lg font-semibold text-dialer-text">Call History</h1>
      </header>

      <div className="flex-1 overflow-y-auto">
        <CallHistory calls={calls} loading={loading} onSelect={handleSelect} />
      </div>
    </div>
  );
}
