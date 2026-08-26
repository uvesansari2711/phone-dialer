import { useCallback, useEffect, useRef, useState } from 'react';
import { formatForDisplay } from '../../utils/phone';
import type { OutgoingPhoneNumber } from '../../types';

interface CallerIdPickerProps {
  numbers: OutgoingPhoneNumber[];
  selectedCallerId: string | null;
  loading: boolean;
  error?: string | null;
  onSelect: (phoneNumber: string) => void;
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
      className={`h-4 w-4 shrink-0 text-dialer-textSecondary transition-transform duration-200 ${
        open ? 'rotate-180' : ''
      }`}
    >
      <path
        fillRule="evenodd"
        d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
      className="h-4 w-4 shrink-0 text-dialer-accent"
    >
      <path
        fillRule="evenodd"
        d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export function CallerIdPicker({
  numbers,
  selectedCallerId,
  loading,
  error,
  onSelect,
}: CallerIdPickerProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedNumber = numbers.find((n) => n.phoneNumber === selectedCallerId);

  const handleSelect = useCallback(
    (phoneNumber: string) => {
      onSelect(phoneNumber);
      setOpen(false);
    },
    [onSelect],
  );

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  const sectionClass = 'mt-2 shrink-0 border-t border-dialer-border px-4 pb-2 pt-2';

  if (loading) {
    return (
      <div className={sectionClass}>
        <p className="text-center text-xs text-dialer-textMuted">Loading phone numbers...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={sectionClass}>
        <p className="text-center text-xs text-dialer-danger" role="alert">
          {error}
        </p>
      </div>
    );
  }

  if (numbers.length === 0) {
    return (
      <div className={sectionClass}>
        <p className="text-center text-xs text-dialer-textMuted">No outbound numbers available</p>
      </div>
    );
  }

  if (numbers.length === 1) {
    const number = numbers[0];
    return (
      <div className={sectionClass}>
        <p className="mb-1.5 text-center text-[11px] font-medium uppercase tracking-wider text-dialer-textMuted">
          Calling from
        </p>
        <div className="flex items-center justify-center rounded-2xl bg-dialer-key px-4 py-2">
          <span className="text-sm font-medium text-dialer-text">
            {formatForDisplay(number.phoneNumber)}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`relative ${sectionClass}`}>
      <p className="mb-1.5 text-center text-[11px] font-medium uppercase tracking-wider text-dialer-textMuted">
        Calling from
      </p>

      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Select caller ID"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between gap-3 rounded-2xl border border-dialer-border bg-dialer-key px-4 py-2 text-left shadow-sm transition-colors hover:bg-dialer-keyHover focus:outline-none focus:ring-2 focus:ring-dialer-accent/30 active:bg-dialer-keyHover"
      >
        <span className="truncate text-sm font-medium text-dialer-text">
          {selectedNumber
            ? formatForDisplay(selectedNumber.phoneNumber)
            : 'Select a number'}
        </span>
        <ChevronIcon open={open} />
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label="Caller ID numbers"
          className="absolute bottom-full left-4 right-4 z-20 mb-2 max-h-48 overflow-y-auto rounded-2xl border border-dialer-border bg-dialer-card py-1 shadow-card"
        >
          {numbers.map((number) => {
            const isSelected = number.phoneNumber === selectedCallerId;
            const label = formatForDisplay(number.phoneNumber);

            return (
              <li key={number.sid} role="option" aria-selected={isSelected}>
                <button
                  type="button"
                  onClick={() => handleSelect(number.phoneNumber)}
                  className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm transition-colors ${
                    isSelected
                      ? 'bg-dialer-accent/10 font-medium text-dialer-text'
                      : 'text-dialer-textSecondary hover:bg-dialer-key'
                  }`}
                >
                  <span className="truncate">{label}</span>
                  {isSelected && <CheckIcon />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
