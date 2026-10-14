import { useCallback, useEffect, useRef, type ChangeEvent, type KeyboardEvent } from 'react';
import { getSmsSegmentInfo, MAX_SMS_BODY_LENGTH } from '../../utils/smsSegments';

interface MessageComposerProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled?: boolean;
  sending?: boolean;
}

export function MessageComposer({
  value,
  onChange,
  onSend,
  disabled = false,
  sending = false,
}: MessageComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const info = getSmsSegmentInfo(value);
  const canSend = value.trim().length > 0 && !disabled && !sending;

  const resize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, []);

  useEffect(() => {
    resize();
  }, [value, resize]);

  const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    onChange(event.target.value.slice(0, MAX_SMS_BODY_LENGTH));
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (canSend) onSend();
    }
  };

  return (
    <div className="shrink-0 border-t border-dialer-border px-3 py-2">
      <div className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          rows={1}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder="Text message"
          aria-label="Message text"
          className="max-h-[120px] min-h-[40px] flex-1 resize-none rounded-2xl bg-dialer-key px-3.5 py-2.5 text-sm text-dialer-text placeholder:text-dialer-textMuted focus:outline-none focus:ring-2 focus:ring-dialer-accent/30 disabled:opacity-50"
        />
        <button
          type="button"
          onClick={onSend}
          disabled={!canSend}
          aria-label={sending ? 'Sending' : 'Send'}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-dialer-accent text-white shadow-sm transition-all hover:bg-dialer-accentDark active:scale-95 disabled:cursor-not-allowed disabled:bg-dialer-key disabled:text-dialer-textMuted disabled:shadow-none"
        >
          {sending ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-5 w-5"
              aria-hidden="true"
            >
              <path d="M3.478 2.405a.75.75 0 00-.926.94l2.387 7.18H13.5a.75.75 0 010 1.5H4.939l-2.387 7.18a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
            </svg>
          )}
        </button>
      </div>
      {value.length > 0 && (
        <p className="mt-1 px-1 text-right text-[11px] text-dialer-textMuted">
          {info.characters}/{MAX_SMS_BODY_LENGTH}
          {info.segments > 0 ? ` · ${info.segments} ${info.segments === 1 ? 'segment' : 'segments'}` : ''}
        </p>
      )}
    </div>
  );
}
