const STORAGE_KEY = 'phone-dialer-caller-id';

export function getStoredCallerId(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setStoredCallerId(phoneNumber: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, phoneNumber);
  } catch {
    // ignore storage errors
  }
}

export function pickDefaultCallerId(
  numbers: { phoneNumber: string }[],
  serverDefault: string,
): string | null {
  if (numbers.length === 0) return null;

  const stored = getStoredCallerId();
  if (stored && numbers.some((n) => n.phoneNumber === stored)) {
    return stored;
  }

  if (numbers.some((n) => n.phoneNumber === serverDefault)) {
    return serverDefault;
  }

  return numbers[0].phoneNumber;
}
