import { KEYPAD_KEYS } from './constants';

interface DialPadProps {
  onKeyPress: (digit: string) => void;
  disabled?: boolean;
}

export function DialPad({ onKeyPress, disabled = false }: DialPadProps) {
  return (
    <div className="grid grid-cols-3 gap-2 px-2" role="group" aria-label="Phone keypad">
      {KEYPAD_KEYS.map(({ digit, letters }) => (
        <button
          key={digit}
          type="button"
          disabled={disabled}
          onClick={() => onKeyPress(digit)}
          aria-label={`Key ${digit}${letters ? `, ${letters}` : ''}`}
          className="flex aspect-square max-h-[60px] w-full flex-col items-center justify-center rounded-full bg-dialer-key text-dialer-text transition-colors hover:bg-dialer-keyHover active:bg-dialer-keyHover disabled:opacity-50"
        >
          <span className="text-[1.65rem] font-light leading-none">{digit}</span>
          {letters && (
            <span className="mt-0.5 text-[10px] font-medium tracking-widest text-dialer-textSecondary">
              {letters}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
