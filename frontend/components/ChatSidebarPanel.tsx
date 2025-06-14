/**
 * ChatSidebarPanel Component
 *
 * Used in: frontend/ChatLayoutWrapper.tsx
 * Purpose: Main conversation sidebar panel that displays thread list with header and footer.
 * Manages thread navigation, deletion, and provides the primary sidebar interface.
 */

import { useState } from "react";
import {
  SidebarMenu,
  SidebarMenuItem,
} from "@/frontend/components/ui/sidebar";
import {
  useThreadManager,
  PanelHeader,
  PanelFooter,
  ThreadListItem,
} from "./panel";
import { ThreadData } from "./panel/ThreadManager";

// Main conversation panel component
export default function ChatSidebarPanel() {
  const {
    threadCollection,
    navigateToThread,
    removeThread,
    toggleThreadPin,
    renameThread,
    updateThreadTags,
    isActiveThread,
    isLoading,
  } = useThreadManager();

  // State for filtered threads (used by search)
  const [filteredThreads, setFilteredThreads] = useState<ThreadData[]>([]);
  const [isSearchActive, setIsSearchActive] = useState(false);

  // Use filtered threads if search is active, otherwise use all threads
  const threadsToDisplay = isSearchActive ? filteredThreads : threadCollection || [];

  // Handle search filter changes
  const handleFilteredThreadsChange = (filtered: ThreadData[]) => {
    setFilteredThreads(filtered);
    // Search is active if filtered results are different from all threads
    const allThreadsCount = threadCollection?.length || 0;
    setIsSearchActive(allThreadsCount > 0 && filtered.length !== allThreadsCount);
  };

  // Separate pinned and regular threads from the displayed threads
  const pinnedThreads = threadsToDisplay.filter(thread => thread.isPinned);
  const regularThreads = threadsToDisplay.filter(thread => !thread.isPinned);

  return (
    <div className="flex flex-col h-full w-full">
      <PanelHeader
        threads={threadCollection || []}
        onFilteredThreadsChange={handleFilteredThreadsChange}
      />
      <div className="flex-1 overflow-y-auto no-scrollbar px-3 pb-3 sm:px-4">
        <SidebarMenu className="space-y-2">
          {isLoading ? (
            // Loading skeleton - removed to make it snappier
            <SidebarMenuItem>
              <div className="h-9 flex items-center px-2 py-1 rounded-lg overflow-hidden w-full">
                <div className="h-4 bg-muted animate-pulse rounded w-3/4"></div>
              </div>
            </SidebarMenuItem>
          ) : (
            <>
              {/* Pinned Threads Section */}
              {pinnedThreads.length > 0 && (
                <>
                  <div className="px-0 py-2 text-sm font-medium text-muted-foreground">
                    Pinned
                  </div>
                  {pinnedThreads.map((threadItem) => (
                    <SidebarMenuItem key={threadItem.id}>
                      <ThreadListItem
                        threadData={threadItem}
                        isActive={isActiveThread(threadItem.id)}
                        onNavigate={navigateToThread}
                        onDelete={removeThread}
                        onTogglePin={toggleThreadPin}
                        onRename={renameThread}
                        onUpdateTags={updateThreadTags}
                      />
                    </SidebarMenuItem>
                  ))}
                  {regularThreads.length > 0 && (
                    <div className="h-px bg-border my-3" />
                  )}
                </>
              )}

              {/* Regular Threads Section */}
              {regularThreads.length > 0 ? (
                regularThreads.map((threadItem) => (
                  <SidebarMenuItem key={threadItem.id}>
                    <ThreadListItem
                      threadData={threadItem}
                      isActive={isActiveThread(threadItem.id)}
                      onNavigate={navigateToThread}
                      onDelete={removeThread}
                      onTogglePin={toggleThreadPin}
                      onRename={renameThread}
                      onUpdateTags={updateThreadTags}
                    />
                  </SidebarMenuItem>
                ))
              ) : pinnedThreads.length === 0 ? (
                <SidebarMenuItem>
                  <div className="h-9 flex items-center px-2 py-1 text-muted-foreground text-sm">
                    No conversations yet
                  </div>
                </SidebarMenuItem>
              ) : null}
            </>
          )}
        </SidebarMenu>
      </div>
      <PanelFooter />
    </div>
  );
}
