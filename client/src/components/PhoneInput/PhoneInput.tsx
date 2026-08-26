import { useCallback } from 'react';
import { sanitizePhoneInput, formatForDisplay } from '../../utils/phone';

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function PhoneInput({ value, onChange, disabled = false }: PhoneInputProps) {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(sanitizePhoneInput(e.target.value));
    },
    [onChange],
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      const pasted = e.clipboardData.getData('text');
      onChange(sanitizePhoneInput(pasted));
    },
    [onChange],
  );

  const displayValue = formatForDisplay(value) || value;

  return (
    <div className="relative px-4">
      <input
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        aria-label="Phone number"
        placeholder="Enter number"
        value={displayValue}
        onChange={handleChange}
        onPaste={handlePaste}
        disabled={disabled}
        className="w-full bg-transparent py-2.5 text-center text-[1.75rem] font-light tracking-wide text-dialer-text placeholder:text-dialer-textMuted focus:outline-none disabled:opacity-50"
      />
    </div>
  );
}
