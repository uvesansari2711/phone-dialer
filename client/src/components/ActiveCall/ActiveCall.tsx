import type { CallState } from '../../types';
import { formatForDisplay, formatDuration } from '../../utils/phone';

interface ActiveCallProps {
  phoneNumber: string;
  callState: CallState;
  duration: number;
  error?: string | null;
  onEndCall: () => void;
  onTryAgain: () => void;
}

function getStatusLabel(callState: CallState): string {
  switch (callState) {
    case 'initiating':
      return 'Calling...';
    case 'ringing':
      return 'Ringing...';
    case 'connected':
      return 'Connected';
    case 'ended':
      return 'Call Ended';
    case 'failed':
      return 'Call Failed';
    default:
      return '';
  }
}

export function ActiveCall({
  phoneNumber,
  callState,
  duration,
  error,
  onEndCall,
  onTryAgain,
}: ActiveCallProps) {
  const isActive =
    callState === 'initiating' || callState === 'ringing' || callState === 'connected';

  return (
    <div className="flex flex-1 flex-col items-center justify-between px-6 py-12">
      <div className="flex flex-col items-center gap-2 pt-8">
        <p className="text-lg text-dialer-textSecondary">{getStatusLabel(callState)}</p>
        <p className="text-3xl font-light tracking-wide text-dialer-text">
          {formatForDisplay(phoneNumber) || phoneNumber}
        </p>
        {(callState === 'connected' || callState === 'ended') && duration > 0 && (
          <p className="mt-4 font-mono text-4xl text-dialer-text">{formatDuration(duration)}</p>
        )}
        {callState === 'initiating' && (
          <p className="mt-2 text-sm text-dialer-textMuted">Please wait</p>
        )}
        {callState === 'failed' && (
          <p className="mt-4 text-center text-sm text-dialer-textSecondary">
            {error || 'Unable to complete the call.'}
          </p>
        )}
      </div>

      <div className="pb-8">
        {isActive ? (
          <button
            type="button"
            onClick={onEndCall}
            aria-label="End call"
            className="flex h-20 w-20 flex-col items-center justify-center rounded-full bg-dialer-danger text-white shadow-md transition-transform active:scale-95"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-8 w-8 rotate-[135deg]"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M1.5 4.5a3 3 0 013-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 01-.694 1.955l-1.293.97c-.135.101-.164.249-.126.352a11.285 11.285 0 006.697 6.697c.103.038.25.009.352-.126l.97-1.293a1.875 1.875 0 011.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.82V19.5a3 3 0 01-3 3h-2.25C8.552 22.5 1.5 15.448 1.5 6.75V4.5z"
                clipRule="evenodd"
              />
            </svg>
            <span className="mt-1 text-xs font-medium">End</span>
          </button>
        ) : callState === 'failed' ? (
          <button
            type="button"
            onClick={onTryAgain}
            className="rounded-full bg-dialer-accent px-8 py-3 text-base font-medium text-white shadow-sm hover:bg-dialer-accentDark"
          >
            Try Again
          </button>
        ) : null}
      </div>
    </div>
  );
}
