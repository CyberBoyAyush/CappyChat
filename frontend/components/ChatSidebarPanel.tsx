/**
 * ChatSidebarPanel Component
 *
 * Used in: frontend/ChatLayoutWrapper.tsx
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
} from "@/frontend/components/ui/sidebar";
import {
  useThreadManager,
  PanelHeader,
  PanelFooter,
  ThreadListItem,
} from "./panel";

// Main conversation panel component
export default function ChatSidebarPanel() {
  const {
    threadCollection,
    navigateToThread,
    removeThread,
    isActiveThread,
    isLoading,
  } = useThreadManager();

  return (
    <div className="flex flex-col h-full w-full">
      <PanelHeader />
      <div className="flex-1 overflow-y-auto no-scrollbar p-2">
        <SidebarMenu>
          {isLoading ? (
            // Loading skeleton - removed to make it snappier
            <SidebarMenuItem>
              <div className="h-9 flex items-center px-2 py-1 rounded-lg overflow-hidden w-full">
                <div className="h-4 bg-muted animate-pulse rounded w-3/4"></div>
              </div>
            </SidebarMenuItem>
          ) : threadCollection?.length > 0 ? (
            threadCollection.map((threadItem) => (
              <SidebarMenuItem key={threadItem.id}>
                <ThreadListItem
                  threadData={threadItem}
                  isActive={isActiveThread(threadItem.id)}
                  onNavigate={navigateToThread}
                  onDelete={removeThread}
                />
              </SidebarMenuItem>
            ))
          ) : (
            <SidebarMenuItem>
              <div className="h-9 flex items-center px-2 py-1 text-muted-foreground text-sm">
                No conversations yet
              </div>
            </SidebarMenuItem>
          )}
        </SidebarMenu>
      </div>
      <PanelFooter />
    </div>
  );
}
