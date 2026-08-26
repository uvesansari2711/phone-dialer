import type { CallRecord } from '../../types';
import {
  formatCallDate,
  formatDuration,
  formatForDisplay,
  formatStatusLabel,
} from '../../utils/phone';

interface CallHistoryListProps {
  calls: CallRecord[];
  onSelect: (phoneNumber: string) => void;
  compact?: boolean;
}

export function CallHistoryList({ calls, onSelect, compact = false }: CallHistoryListProps) {
  return (
    <ul className={compact ? 'space-y-0.5' : 'divide-y divide-dialer-border'}>
      {calls.map((call) => (
        <li key={call._id}>
          <button
            type="button"
            onClick={() => onSelect(call.to)}
            className={`flex w-full items-start gap-2.5 rounded-xl text-left transition-colors hover:bg-dialer-key active:bg-dialer-keyHover ${
              compact ? 'px-2 py-1' : 'px-3 py-3'
            }`}
          >
            <span className="mt-0.5 text-sm text-dialer-accent" aria-hidden="true">
              ↗
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-dialer-text">
                {formatForDisplay(call.to) || call.to}
              </p>
              {compact ? (
                <p className="truncate text-xs text-dialer-textMuted">
                  {formatStatusLabel(call.status)}
                  {call.duration != null && call.duration > 0 && (
                    <span> · {formatDuration(call.duration)}</span>
                  )}
                  <span> · {formatCallDate(call.createdAt)}</span>
                </p>
              ) : (
                <>
                  <p className="text-sm text-dialer-textSecondary">
                    {formatStatusLabel(call.status)}
                    {call.duration != null && call.duration > 0 && (
                      <span> · {formatDuration(call.duration)}</span>
                    )}
                  </p>
                  <p className="text-xs text-dialer-textMuted">{formatCallDate(call.createdAt)}</p>
                </>
              )}
            </div>
          </button>
        </li>
      ))}
    </ul>
  );
}
