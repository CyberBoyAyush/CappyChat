/**
 * ConversationsList Component
 *
 * Used in: frontend/components/drawer/SidebarContainer.tsx (via index.ts export)
 * Purpose: Displays a list of all conversation threads in the sidebar.
 * Fetches threads from database and renders them using ConversationItem components.
 */

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
} from '@/frontend/components/ui/sidebar';
import { useLiveQuery } from 'dexie-react-hooks';
import { getThreads } from '@/frontend/database/chatQueries';
import { ConversationItem } from './ConversationItem';
import { useConversationActions } from './hooks/useConversationActions';

// List of all conversations/threads
export const ConversationsList = () => {
  const conversationsData = useLiveQuery(() => getThreads(), []);
  const { handleSelect, handleRemove, isSelected } = useConversationActions();

  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu>
          {conversationsData?.map((conversation) => (
            <SidebarMenuItem key={conversation.id}>
              <ConversationItem
                data={conversation}
                selected={isSelected(conversation.id)}
                onSelect={handleSelect}
                onRemove={handleRemove}
              />
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
};

export default ConversationsList;
