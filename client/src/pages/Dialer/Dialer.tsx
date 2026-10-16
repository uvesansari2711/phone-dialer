import { useCallback, useEffect, useRef, useState } from 'react';
import { PhoneInput } from '../../components/PhoneInput';
import { DialPad } from '../../components/DialPad';
import { CallButton } from '../../components/CallButton';
import { SmsButton } from '../../components/SmsButton';
import { ActiveCall } from '../../components/ActiveCall';
import { CallHistory } from '../../components/CallHistory';
import { ConversationList } from '../../components/ConversationList';
import { CallerIdPicker } from '../../components/CallerIdPicker';
import { useCall } from '../../hooks/useCall';
import { useCallerId } from '../../hooks/useCallerId';
import { useConversations } from '../../hooks/useConversations';
import { api } from '../../services/api';
import { isValidPhoneNumber, normalizeToE164 } from '../../utils/phone';
import type { CallRecord } from '../../types';

interface DialerProps {
  onViewAll: () => void;
  onViewAllMessages: () => void;
  onOpenSms: (phoneNumber: string) => void;
  redialNumber?: string;
  onRedialConsumed?: () => void;
}

type HistoryTab = 'calls' | 'messages';

const LONG_PRESS_MS = 500;

export function Dialer({
  onViewAll,
  onViewAllMessages,
  onOpenSms,
  redialNumber,
  onRedialConsumed,
}: DialerProps) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [historyTab, setHistoryTab] = useState<HistoryTab>('calls');
  const longPressTimer = useRef<number | undefined>(undefined);
  const longPressFired = useRef(false);

  const refreshHistory = useCallback(async () => {
    try {
      const data = await api.getCalls();
      setCalls(data);
    } catch {
      // silently fail history refresh
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  const {
    numbers: callerNumbers,
    selectedCallerId,
    loading: callerIdLoading,
    error: callerIdError,
    selectCallerId,
    hasNumbers,
    hasSmsNumbers,
  } = useCallerId('voice');

  const { conversations, loading: conversationsLoading, unreadTotal, reload: reloadConversations } =
    useConversations();

  const {
    callState,
    activeNumber,
    error: callError,
    isReady,
    duration,
    startCall,
    endCall,
    resetCall,
    isInCall,
  } = useCall({ onHistoryRefresh: refreshHistory });

  useEffect(() => {
    refreshHistory();
  }, [refreshHistory]);

  useEffect(() => {
    if (historyTab !== 'messages') return;
    void reloadConversations();
  }, [historyTab, reloadConversations]);

  useEffect(() => {
    if (redialNumber) {
      setPhoneNumber(redialNumber);
      setValidationError(null);
      onRedialConsumed?.();
    }
  }, [redialNumber, onRedialConsumed]);

  const handleKeyPress = useCallback((digit: string) => {
    setPhoneNumber((prev) => prev + digit);
    setValidationError(null);
  }, []);

  const handleBackspace = useCallback(() => {
    setPhoneNumber((prev) => prev.slice(0, -1));
    setValidationError(null);
  }, []);

  const handleClear = useCallback(() => {
    setPhoneNumber('');
    setValidationError(null);
  }, []);

  const clearLongPress = useCallback(() => {
    if (longPressTimer.current !== undefined) {
      window.clearTimeout(longPressTimer.current);
      longPressTimer.current = undefined;
    }
  }, []);

  const handleBackspacePointerDown = useCallback(() => {
    longPressFired.current = false;
    clearLongPress();
    longPressTimer.current = window.setTimeout(() => {
      longPressFired.current = true;
      handleClear();
    }, LONG_PRESS_MS);
  }, [clearLongPress, handleClear]);

  const handleBackspacePointerUp = useCallback(() => {
    clearLongPress();
    if (!longPressFired.current) {
      handleBackspace();
    }
  }, [clearLongPress, handleBackspace]);

  useEffect(() => () => clearLongPress(), [clearLongPress]);

  const handleCall = useCallback(async () => {
    const e164 = normalizeToE164(phoneNumber);
    if (!e164) {
      setValidationError('Please enter a valid phone number.');
      return;
    }
    if (!selectedCallerId) {
      setValidationError('Please select a caller ID.');
      return;
    }
    await startCall(e164, selectedCallerId);
  }, [phoneNumber, selectedCallerId, startCall]);

  const handleSms = useCallback(() => {
    const e164 = normalizeToE164(phoneNumber);
    if (!e164) {
      setValidationError('Please enter a valid phone number.');
      return;
    }
    if (!hasSmsNumbers) {
      setValidationError('No SMS-capable numbers available.');
      return;
    }
    setValidationError(null);
    onOpenSms(e164);
  }, [phoneNumber, hasSmsNumbers, onOpenSms]);

  const handleHistorySelect = useCallback((number: string) => {
    setPhoneNumber(number);
    setValidationError(null);
  }, []);

  const handleTryAgain = useCallback(() => {
    resetCall();
  }, [resetCall]);

  const isValid = isValidPhoneNumber(phoneNumber);
  const canCall = isValid && isReady && hasNumbers && !!selectedCallerId;
  const canSms = isValid && hasSmsNumbers;

  if (isInCall || callState === 'ended' || callState === 'failed') {
    return (
      <div className="flex min-h-full flex-1 flex-col bg-dialer-card">
        <ActiveCall
          phoneNumber={activeNumber}
          callState={callState}
          duration={duration}
          error={callError}
          onEndCall={endCall}
          onTryAgain={handleTryAgain}
        />
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-dialer-card">
      <header className="shrink-0 px-4 pt-4 pb-0.5 text-center">
        <h1 className="text-lg font-semibold text-dialer-text">Dialer</h1>
        {!isReady && (
          <p className="mt-0.5 text-xs text-dialer-textMuted">Connecting to phone system...</p>
        )}
      </header>

      <div className="shrink-0 border-b border-dialer-border">
        <div className="flex justify-center px-4 pt-2">
          <div className="inline-flex rounded-full bg-dialer-key p-0.5" role="tablist" aria-label="History">
            <button
              type="button"
              role="tab"
              aria-selected={historyTab === 'calls'}
              onClick={() => setHistoryTab('calls')}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                historyTab === 'calls'
                  ? 'bg-dialer-card text-dialer-text shadow-sm'
                  : 'text-dialer-textSecondary hover:text-dialer-text'
              }`}
            >
              Calls
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={historyTab === 'messages'}
              onClick={() => setHistoryTab('messages')}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                historyTab === 'messages'
                  ? 'bg-dialer-card text-dialer-text shadow-sm'
                  : 'text-dialer-textSecondary hover:text-dialer-text'
              }`}
            >
              Messages
              {unreadTotal > 0 && (
                <span className="h-1.5 w-1.5 rounded-full bg-dialer-accent" aria-label={`${unreadTotal} unread`} />
              )}
            </button>
          </div>
        </div>

        {historyTab === 'calls' ? (
          <CallHistory
            calls={calls}
            loading={historyLoading}
            onSelect={handleHistorySelect}
            limit={2}
            onViewAll={onViewAll}
            title="Call History"
            compact
          />
        ) : (
          <ConversationList
            conversations={conversations}
            loading={conversationsLoading}
            onSelect={onOpenSms}
            limit={2}
            onViewAll={onViewAllMessages}
            title="Messages"
            compact
          />
        )}
      </div>

      <div className="flex min-h-0 flex-1 flex-col px-2 pb-2">
        <div className="flex flex-1 flex-col justify-center">
          <PhoneInput value={phoneNumber} onChange={setPhoneNumber} />

          {(validationError || callError) && (
            <p className="px-2 text-center text-sm text-dialer-danger" role="alert">
              {validationError || callError}
            </p>
          )}

          <DialPad onKeyPress={handleKeyPress} />

          <div className="mt-1.5 grid shrink-0 grid-cols-3 items-center px-3">
            <div className="flex justify-start">
              <button
                type="button"
                onPointerDown={handleBackspacePointerDown}
                onPointerUp={handleBackspacePointerUp}
                onPointerLeave={clearLongPress}
                onPointerCancel={clearLongPress}
                disabled={!phoneNumber}
                aria-label="Delete last digit"
                className="flex h-11 w-11 items-center justify-center rounded-full text-dialer-textSecondary transition-colors hover:bg-dialer-key active:bg-dialer-keyHover disabled:opacity-30"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                  <path
                    fillRule="evenodd"
                    d="M9.53 2.47a.75.75 0 010 1.06L4.81 8.25H18a4.75 4.75 0 010 9.5H7.5a.75.75 0 010-1.5H18a3.25 3.25 0 000-6.5H4.81l4.72 4.72a.75.75 0 11-1.06 1.06l-6-6a.75.75 0 010-1.06l6-6a.75.75 0 011.06 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>

            <div className="flex justify-center">
              <CallButton onClick={handleCall} disabled={!canCall} />
            </div>

            <div className="flex justify-end">
              <SmsButton onClick={handleSms} disabled={!canSms} />
            </div>
          </div>
        </div>

        <CallerIdPicker
          numbers={callerNumbers}
          selectedCallerId={selectedCallerId}
          loading={callerIdLoading}
          error={callerIdError}
          onSelect={selectCallerId}
        />
      </div>
    </div>
  );
}
