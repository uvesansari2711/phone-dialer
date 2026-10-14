import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../services/api';
import type { ConversationSummary } from '../types';
import { useVisibilityPolling } from './useVisibilityPolling';

const CONVERSATION_POLL_MS = 8000;

export function useConversations(enabled = true) {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const loadConversations = useCallback(async () => {
    if (!enabled) return;

    try {
      const data = await api.getConversations();
      setConversations(data);
    } catch {
      // silently fail list refresh
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    setLoading(true);
    void loadConversations();
  }, [loadConversations]);

  useVisibilityPolling(loadConversations, CONVERSATION_POLL_MS, enabled);

  const unreadTotal = useMemo(
    () => conversations.reduce((sum, conversation) => sum + conversation.unreadCount, 0),
    [conversations],
  );

  return {
    conversations,
    loading,
    unreadTotal,
    reload: loadConversations,
  };
}