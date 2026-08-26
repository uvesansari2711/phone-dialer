import { parsePhoneNumberFromString, type CountryCode } from 'libphonenumber-js';

export function sanitizePhoneInput(input: string): string {
  const hasPlus = input.trimStart().startsWith('+');
  const digits = input.replace(/[^\d+*#]/g, '');
  if (hasPlus && !digits.startsWith('+')) {
    return `+${digits.replace(/\+/g, '')}`;
  }
  return digits;
}

export function normalizeToE164(input: string, defaultCountry: CountryCode = 'US'): string | null {
  const cleaned = input.trim();
  if (!cleaned) return null;

  const parsed = parsePhoneNumberFromString(cleaned, defaultCountry);
  if (!parsed || !parsed.isValid()) return null;

  return parsed.format('E.164');
}

export function isValidPhoneNumber(input: string, defaultCountry: CountryCode = 'US'): boolean {
  return normalizeToE164(input, defaultCountry) !== null;
}

export function formatForDisplay(input: string): string {
  const cleaned = sanitizePhoneInput(input);
  if (!cleaned) return '';

  const parsed = parsePhoneNumberFromString(cleaned);
  if (parsed && parsed.isValid()) {
    return parsed.formatInternational();
  }

  return cleaned;
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function formatCallDate(isoDate: string): string {
  const date = new Date(isoDate);
  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  const time = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

  if (isToday) return `Today, ${time}`;
  if (isYesterday) return `Yesterday, ${time}`;

  return date.toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: 'Pending',
    queued: 'Queued',
    initiated: 'Initiating',
    ringing: 'Ringing',
    'in-progress': 'Completed',
    completed: 'Completed',
    busy: 'Busy',
    failed: 'Failed',
    'no-answer': 'No Answer',
    canceled: 'Canceled',
  };
  return labels[status] || status;
}
