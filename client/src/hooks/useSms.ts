import { useCallback, useEffect, useState } from 'react';
import { api, ApiClientError } from '../services/api';
import type { MessageRecord } from '../types';
import { useVisibilityPolling } from './useVisibilityPolling';

const THREAD_POLL_MS = 3000;

interface UseSmsOptions {
  contactNumber: string | null;
}

export function useSms({ contactNumber }: UseSmsOptions) {
  const [messages, setMessages] = useState<MessageRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMessages = useCallback(
    async (sync = false) => {
      if (!contactNumber) {
        setMessages([]);
        setLoading(false);
        return;
      }

      try {
        const data = await api.getMessages(contactNumber, { sync });
        setMessages(data);
      } catch (err) {
        if (err instanceof ApiClientError) {
          setError(err.message);
        } else {
          setError('Unable to load messages.');
        }
      } finally {
        setLoading(false);
      }
    },
    [contactNumber],
  );

  useEffect(() => {
    setLoading(true);
    setError(null);
    void loadMessages(true);
  }, [loadMessages]);

  const pollMessages = useCallback(() => {
    void loadMessages(false);
  }, [loadMessages]);

  useEffect(() => {
    if (!contactNumber) return;
    void api.markConversationRead(contactNumber).catch(() => {
      // unread state will refresh on next poll
    });
  }, [contactNumber]);

  useVisibilityPolling(pollMessages, THREAD_POLL_MS, Boolean(contactNumber));

  const send = useCallback(
    async (body: string, from: string) => {
      if (!contactNumber) return;

      setSending(true);
      setError(null);

      const tempId = `temp-${Date.now()}`;
      const optimistic: MessageRecord = {
        _id: tempId,
        contactNumber,
        ourNumber: from,
        body,
        direction: 'outbound',
        status: 'sending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, optimistic]);

      try {
        const saved = await api.sendSms(contactNumber, from, body);
        setMessages((prev) => prev.map((message) => (message._id === tempId ? saved : message)));
      } catch (err) {
        const message =
          err instanceof ApiClientError ? err.message : 'Unable to send the message. Please try again.';
        setError(message);
        await loadMessages();
        throw err;
      } finally {
        setSending(false);
      }
    },
    [contactNumber, loadMessages],
  );

  return {
    messages,
    loading,
    sending,
    error,
    send,
    reload: loadMessages,
    clearError: () => setError(null),
  };
}
