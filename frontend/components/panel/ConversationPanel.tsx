/**
 * ConversationPanel Component
 *
 * Used in: frontend/components/ChatSidebarPanel.tsx
 * Purpose: Main conversation sidebar panel that displays thread list with header and footer.
 * Manages thread navigation, deletion, and provides the primary sidebar interface.
 */

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
} from '@/frontend/components/ui/sidebar';
import { useThreadManager } from './ThreadManager';
import PanelHeader from './PanelHeader';
import PanelFooter from './PanelFooter';
import ThreadListItem from './ThreadListItem';

// Main conversation panel component
const ConversationPanel = () => {
  const {
    threadCollection,
    navigateToThread,
    removeThread,
    isActiveThread,
  } = useThreadManager();

  return (
    <Sidebar>
      <div className="flex flex-col h-full p-2">
        <PanelHeader />
        <SidebarContent className="no-scrollbar">
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {threadCollection?.map((threadItem) => {
                  return (
                    <SidebarMenuItem key={threadItem.id}>
                      <ThreadListItem
                        threadData={threadItem}
                        isActive={isActiveThread(threadItem.id)}
                        onNavigate={navigateToThread}
                        onDelete={removeThread}
                      />
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <PanelFooter />
      </div>
    </Sidebar>
  );
};

export default ConversationPanel;
