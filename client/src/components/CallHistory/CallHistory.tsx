import type { CallRecord } from '../../types';
import { CallHistoryList } from './CallHistoryList';

interface CallHistoryProps {
  calls: CallRecord[];
  loading?: boolean;
  onSelect: (phoneNumber: string) => void;
  limit?: number;
  onViewAll?: () => void;
  title?: string;
  compact?: boolean;
}

export function CallHistory({
  calls,
  loading,
  onSelect,
  limit,
  onViewAll,
  title = 'Call History',
  compact = false,
}: CallHistoryProps) {
  const displayedCalls = limit != null ? calls.slice(0, limit) : calls;
  const paddingClass = compact ? 'px-4 py-1.5' : 'px-4 py-6';

  const header = (
    <div className="mb-0.5 flex items-center justify-between">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-dialer-textSecondary">
        {title}
      </h2>
      {onViewAll && calls.length > 0 && (
        <button
          type="button"
          onClick={onViewAll}
          className="text-sm font-medium text-dialer-accent hover:text-dialer-accentDark active:opacity-70"
        >
          View All
        </button>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className={paddingClass}>
        {header}
        <p className="text-sm text-dialer-textMuted">Loading...</p>
      </div>
    );
  }

  if (calls.length === 0) {
    return (
      <div className={paddingClass}>
        {header}
        <p className="text-sm text-dialer-textMuted">No calls yet</p>
      </div>
    );
  }

  return (
    <div className={paddingClass}>
      {header}
      <CallHistoryList calls={displayedCalls} onSelect={onSelect} compact={compact} />
    </div>
  );
}
