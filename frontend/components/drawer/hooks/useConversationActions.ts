/**
 * useConversationActions Hook
 *
 * Used in: frontend/components/drawer/ConversationsList.tsx
 * Purpose: Custom hook that provides conversation/thread actions like selection, navigation, and deletion.
 * Manages conversation state and routing for the sidebar conversation list.
 */

import { useNavigate, useParams } from 'react-router';
import { deleteThread } from '@/frontend/database/chatQueries';

// Hook for managing conversation actions
export const useConversationActions = () => {
  const { id: activeConversationId } = useParams();
  const navigator = useNavigate();

  const handleSelect = (conversationId: string) => {
    if (activeConversationId === conversationId) {
      return;
    }
    navigator(`/chat/${conversationId}`);
  };

  const handleRemove = async (conversationId: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    await deleteThread(conversationId);
    navigator(`/chat`);
  };

  const isSelected = (conversationId: string) => activeConversationId === conversationId;

  return {
    handleSelect,
    handleRemove,
    isSelected,
    activeConversationId,
  };
};

export default useConversationActions;
