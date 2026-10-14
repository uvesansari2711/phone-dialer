import { useEffect, useRef } from 'react';
import { formatCallDate } from '../../utils/phone';
import type { MessageRecord } from '../../types';

interface MessageThreadProps {
  messages: MessageRecord[];
  loading?: boolean;
  onRetry?: (body: string) => void;
}

function statusLabel(status: MessageRecord['status']): string {
  switch (status) {
    case 'sending':
    case 'queued':
      return 'Sending';
    case 'sent':
      return 'Sent';
    case 'delivered':
      return 'Delivered';
    case 'undelivered':
    case 'failed':
      return 'Failed';
    case 'received':
      return '';
    default:
      return status;
  }
}

export function MessageThread({ messages, loading = false, onRetry }: MessageThreadProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (loading && messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center px-4">
        <p className="text-sm text-dialer-textMuted">Loading messages...</p>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center px-6">
        <p className="text-center text-sm text-dialer-textMuted">No messages yet</p>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-2 overflow-y-auto px-4 py-3">
      {messages.map((message) => {
        const outbound = message.direction === 'outbound';
        const failed = message.status === 'failed' || message.status === 'undelivered';
        const label = outbound ? statusLabel(message.status) : '';

        return (
          <div key={message._id} className={`flex ${outbound ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] ${outbound ? 'items-end' : 'items-start'} flex flex-col`}>
              <div
                className={`rounded-2xl px-3.5 py-2 text-sm leading-snug ${
                  outbound
                    ? 'rounded-br-md bg-dialer-accent/15 text-dialer-text'
                    : 'rounded-bl-md bg-dialer-key text-dialer-text'
                }`}
              >
                <p className="whitespace-pre-wrap break-words">{message.body}</p>
              </div>
              <p className="mt-0.5 px-1 text-[11px] text-dialer-textMuted">
                {formatCallDate(message.createdAt)}
                {label ? ` · ${label}` : ''}
              </p>
              {failed && onRetry && (
                <button
                  type="button"
                  onClick={() => onRetry(message.body)}
                  className="mt-0.5 px-1 text-[11px] font-medium text-dialer-danger hover:underline"
                >
                  Retry
                </button>
              )}
            </div>
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}
