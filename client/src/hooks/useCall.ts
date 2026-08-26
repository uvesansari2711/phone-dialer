import { useCallback, useEffect, useState } from 'react';
import { Call } from '@twilio/voice-sdk';
import { api, ApiClientError } from '../services/api';
import type { CallState } from '../types';
import { useTwilioDevice } from './useTwilioDevice';
import { useCallTimer } from './useCallTimer';

const CALL_ENDED_DISMISS_MS = 2500;

interface UseCallOptions {
  onHistoryRefresh?: () => void;
}

export function useCall({ onHistoryRefresh }: UseCallOptions = {}) {
  const { isReady, error: deviceError, connect, disconnect, getActiveCall } = useTwilioDevice();
  const [callState, setCallState] = useState<CallState>('idle');
  const [activeNumber, setActiveNumber] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [currentCallId, setCurrentCallId] = useState<string | null>(null);
  const { seconds, reset: resetTimer } = useCallTimer(callState === 'connected');

  const resetToIdle = useCallback(() => {
    setCallState('idle');
    setActiveNumber('');
    setError(null);
    setCurrentCallId(null);
    resetTimer();
  }, [resetTimer]);

  const finishCall = useCallback(() => {
    setCallState('ended');
    onHistoryRefresh?.();
  }, [onHistoryRefresh]);

  useEffect(() => {
    if (callState !== 'ended') return;

    const timer = window.setTimeout(() => {
      resetToIdle();
    }, CALL_ENDED_DISMISS_MS);

    return () => clearTimeout(timer);
  }, [callState, resetToIdle]);

  const setupCallListeners = useCallback(
    (call: Call, callId: string) => {
      call.on('ringing', () => {
        setCallState('ringing');
      });

      call.on('accept', () => {
        setCallState('connected');
      });

      call.on('disconnect', () => {
        finishCall();
      });

      call.on('cancel', () => {
        finishCall();
      });

      call.on('reject', () => {
        setCallState('failed');
        setError('Call was rejected.');
        resetTimer();
        onHistoryRefresh?.();
      });

      call.on('error', (callError) => {
        setCallState('failed');
        setError(callError.message || 'Call failed.');
        resetTimer();
        onHistoryRefresh?.();
      });

      const sid = call.parameters.CallSid;
      if (sid) {
        api.linkCallSid(callId, sid).catch(() => {
          // webhook may handle linking
        });
      }
    },
    [onHistoryRefresh, resetTimer, finishCall],
  );

  const startCall = useCallback(
    async (to: string) => {
      if (!isReady) {
        setError('Phone system is not ready. Please wait.');
        return;
      }

      if (callState !== 'idle' && callState !== 'ended' && callState !== 'failed') {
        return;
      }

      setError(null);
      setActiveNumber(to);
      setCallState('initiating');
      resetTimer();

      try {
        const { callId } = await api.createCall(to);
        setCurrentCallId(callId);

        const call = await connect(to);
        setupCallListeners(call, callId);

        const status = call.status();
        if (status === 'open') {
          setCallState('connected');
        } else if (status === 'ringing' || status === 'connecting' || status === 'pending') {
          setCallState('ringing');
        }
      } catch (err) {
        setCallState('failed');
        if (err instanceof ApiClientError) {
          setError(err.message);
        } else if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('Unable to initiate the call. Please try again.');
        }
      }
    },
    [isReady, callState, resetTimer, connect, setupCallListeners],
  );

  const endCall = useCallback(async () => {
    const call = getActiveCall();
    const sid = call?.parameters.CallSid;

    disconnect();

    if (sid) {
      try {
        await api.endCall(sid);
      } catch {
        // local disconnect is sufficient
      }
    }

    finishCall();
  }, [disconnect, getActiveCall, finishCall]);

  const resetCall = useCallback(() => {
    resetToIdle();
  }, [resetToIdle]);

  return {
    callState,
    activeNumber,
    error: error || deviceError,
    isReady,
    duration: seconds,
    currentCallId,
    startCall,
    endCall,
    resetCall,
    isInCall:
      callState === 'initiating' ||
      callState === 'ringing' ||
      callState === 'connected',
  };
}
