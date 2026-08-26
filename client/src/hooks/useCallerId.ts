import { useCallback, useEffect, useState } from 'react';
import { api } from '../services/api';
import type { OutgoingPhoneNumber } from '../types';
import { pickDefaultCallerId, setStoredCallerId } from '../utils/callerIdStorage';

export function useCallerId() {
  const [numbers, setNumbers] = useState<OutgoingPhoneNumber[]>([]);
  const [selectedCallerId, setSelectedCallerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadNumbers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { numbers: fetched, default: serverDefault } = await api.getPhoneNumbers();
      setNumbers(fetched);
      setSelectedCallerId((current) => {
        if (current && fetched.some((n) => n.phoneNumber === current)) {
          return current;
        }
        return pickDefaultCallerId(fetched, serverDefault);
      });
    } catch {
      setError('Unable to load phone numbers.');
      setNumbers([]);
      setSelectedCallerId(null);
    } finally {
      setLoading(false);
    }
  }, []);

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
  };
}
