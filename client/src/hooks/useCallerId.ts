import { useCallback, useEffect, useState } from 'react';
import { api } from '../services/api';
import type { OutgoingPhoneNumber } from '../types';
import { pickDefaultCallerId, setStoredCallerId } from '../utils/callerIdStorage';

type NumberCapability = 'voice' | 'sms';

export function useCallerId(capability?: NumberCapability) {
  const [numbers, setNumbers] = useState<OutgoingPhoneNumber[]>([]);
  const [selectedCallerId, setSelectedCallerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasSmsNumbers, setHasSmsNumbers] = useState(false);

  const loadNumbers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { numbers: fetched, default: serverDefault } = await api.getPhoneNumbers();
      const filtered = capability
        ? fetched.filter((number) => number.capabilities?.[capability])
        : fetched;
      setHasSmsNumbers(fetched.some((number) => number.capabilities?.sms));
      setNumbers(filtered);
      setSelectedCallerId((current) => {
        if (current && filtered.some((n) => n.phoneNumber === current)) {
          return current;
        }
        return pickDefaultCallerId(filtered, serverDefault);
      });
    } catch {
      setError('Unable to load phone numbers.');
      setNumbers([]);
      setSelectedCallerId(null);
      setHasSmsNumbers(false);
    } finally {
      setLoading(false);
    }
  }, [capability]);

  useEffect(() => {
    loadNumbers();
  }, [loadNumbers]);

  const selectCallerId = useCallback((phoneNumber: string) => {
    setSelectedCallerId(phoneNumber);
    setStoredCallerId(phoneNumber);
  }, []);

  return {
    numbers,
    selectedCallerId,
    loading,
    error,
    selectCallerId,
    reload: loadNumbers,
    hasNumbers: numbers.length > 0,
    hasSmsNumbers,
  };
}
