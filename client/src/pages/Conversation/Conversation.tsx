import { useCallback, useState } from 'react';
import { CallerIdPicker } from '../../components/CallerIdPicker';
import { MessageComposer } from '../../components/MessageComposer';
import { MessageThread } from '../../components/MessageThread';
import { useCallerId } from '../../hooks/useCallerId';
import { useSms } from '../../hooks/useSms';
import { formatForDisplay } from '../../utils/phone';

interface ConversationProps {
  contactNumber: string;
  onBack: () => void;
  onCall: (phoneNumber: string) => void;
}

export function Conversation({ contactNumber, onBack, onCall }: ConversationProps) {
  const [draft, setDraft] = useState('');
  const {
    numbers,
    selectedCallerId,
    loading: callerIdLoading,
    error: callerIdError,
    selectCallerId,
    hasNumbers,
  } = useCallerId('sms');

  const { messages, loading, sending, error, send, clearError } = useSms({ contactNumber });

  const handleSend = useCallback(async () => {
    const body = draft.trim();
    if (!body || !selectedCallerId) return;
    setDraft('');
    try {
      await send(body, selectedCallerId);
    } catch {
      setDraft(body);
    }
  }, [draft, selectedCallerId, send]);

  const handleRetry = useCallback(
    async (body: string) => {
      if (!selectedCallerId) return;
      try {
        await send(body, selectedCallerId);
      } catch {
        // error banner already set
      }
    },
    [selectedCallerId, send],
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-dialer-card">
      <header className="flex shrink-0 items-center gap-2 border-b border-dialer-border px-3 py-3 pr-16">
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
        <h1 className="min-w-0 flex-1 truncate text-lg font-semibold text-dialer-text">
          {formatForDisplay(contactNumber) || contactNumber}
        </h1>
        <button
          type="button"
          onClick={() => onCall(contactNumber)}
          aria-label="Call this number"
          className="flex h-10 w-10 items-center justify-center rounded-full text-dialer-accent hover:bg-dialer-key active:bg-dialer-keyHover"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
            <path
              fillRule="evenodd"
              d="M1.5 4.5a3 3 0 013-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 01-.694 1.955l-1.293.97c-.135.101-.164.249-.126.352a11.285 11.285 0 006.697 6.697c.103.038.25.009.352-.126l.97-1.293a1.875 1.875 0 011.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.82V19.5a3 3 0 01-3 3h-2.25C8.552 22.5 1.5 15.448 1.5 6.75V4.5z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </header>

      <MessageThread messages={messages} loading={loading} onRetry={handleRetry} />

      {(error || callerIdError) && (
        <p className="px-4 pb-1 text-center text-sm text-dialer-danger" role="alert">
          {error || callerIdError}
          {error && (
            <button type="button" onClick={clearError} className="ml-2 underline">
              Dismiss
            </button>
          )}
        </p>
      )}

      <MessageComposer
        value={draft}
        onChange={setDraft}
        onSend={() => {
          void handleSend();
        }}
        disabled={!hasNumbers || !selectedCallerId}
        sending={sending}
      />

      <CallerIdPicker
        numbers={numbers}
        selectedCallerId={selectedCallerId}
        loading={callerIdLoading}
        error={callerIdError}
        onSelect={selectCallerId}
        label="Sending from"
        emptyMessage="No SMS-capable numbers available"
      />
    </div>
  );
}
