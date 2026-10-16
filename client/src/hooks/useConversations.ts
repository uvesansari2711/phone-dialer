import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../services/api';
import type { ConversationSummary } from '../types';

export function useConversations() {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const loadConversations = useCallback(async () => {
    try {
      const data = await api.getConversations();
      setConversations(data);
    } catch {
      // silently fail list refresh
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    void loadConversations();
  }, [loadConversations]);

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
