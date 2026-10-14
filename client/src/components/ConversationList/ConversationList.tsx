import { formatCallDate, formatForDisplay } from '../../utils/phone';
import type { ConversationSummary } from '../../types';

interface ConversationListProps {
  conversations: ConversationSummary[];
  loading?: boolean;
  onSelect: (phoneNumber: string) => void;
  limit?: number;
  onViewAll?: () => void;
  title?: string;
  compact?: boolean;
}

export function ConversationList({
  conversations,
  loading,
  onSelect,
  limit,
  onViewAll,
  title = 'Messages',
  compact = false,
}: ConversationListProps) {
  const displayed = limit != null ? conversations.slice(0, limit) : conversations;
  const paddingClass = compact ? 'px-4 py-1.5' : 'px-4 py-6';

  const header = (
    <div className="mb-0.5 flex items-center justify-between">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-dialer-textSecondary">
        {title}
      </h2>
      {onViewAll && conversations.length > 0 && (
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

  if (conversations.length === 0) {
    return (
      <div className={paddingClass}>
        {header}
        <p className="text-sm text-dialer-textMuted">No messages yet</p>
      </div>
    );
  }

  return (
    <div className={paddingClass}>
      {header}
      <ul className={compact ? 'space-y-0.5' : 'divide-y divide-dialer-border'}>
        {displayed.map((conversation) => (
          <li key={conversation.contactNumber}>
            <button
              type="button"
              onClick={() => onSelect(conversation.contactNumber)}
              className={`flex w-full items-start gap-2.5 rounded-xl text-left transition-colors hover:bg-dialer-key active:bg-dialer-keyHover ${
                compact ? 'px-2 py-1' : 'px-3 py-3'
              }`}
            >
              <span className="relative mt-1.5 h-2 w-2 shrink-0">
                {conversation.unreadCount > 0 && (
                  <span className="absolute inset-0 rounded-full bg-dialer-accent" aria-label="Unread" />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-dialer-text">
                  {formatForDisplay(conversation.contactNumber) || conversation.contactNumber}
                </p>
                <p className="truncate text-xs text-dialer-textMuted">
                  {conversation.lastDirection === 'outbound' ? 'You: ' : ''}
                  {conversation.lastBody}
                  <span> · {formatCallDate(conversation.lastAt)}</span>
                </p>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
