/**
 * ChatSidebarPanel Component
 *
 * Used in: frontend/ChatLayoutWrapper.tsx
 * Purpose: Main conversation sidebar panel that displays thread list with header and footer.
 * Manages thread navigation, deletion, and provides the primary sidebar interface.
 */

import { useState } from "react";
import { SidebarMenu, SidebarMenuItem } from "@/frontend/components/ui/sidebar";
import {
  useThreadManager,
  PanelHeader,
  PanelFooter,
  ThreadListItem,
} from "./panel";
import { ThreadData } from "./panel/ThreadManager";
import { Pin } from "lucide-react";

// Helper functions to categorize dates
const isToday = (date: Date) => {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
};

const isYesterday = (date: Date) => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return (
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear()
  );
};

const isLastSevenDays = (date: Date) => {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  return date > sevenDaysAgo && !isToday(date) && !isYesterday(date);
};

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
  const threadsToDisplay = isSearchActive
    ? filteredThreads
    : threadCollection || [];

  // Handle search filter changes
  const handleFilteredThreadsChange = (filtered: ThreadData[]) => {
    setFilteredThreads(filtered);
    // Search is active if filtered results are different from all threads
    const allThreadsCount = threadCollection?.length || 0;
    setIsSearchActive(
      allThreadsCount > 0 && filtered.length !== allThreadsCount
    );
  };

  // Separate pinned and regular threads from the displayed threads
  const pinnedThreads = threadsToDisplay.filter((thread) => thread.isPinned);
  const regularThreads = threadsToDisplay.filter((thread) => !thread.isPinned);

  // Group regular threads by date category
  const groupThreadsByDate = (threads: ThreadData[]) => {
    const today: ThreadData[] = [];
    const yesterday: ThreadData[] = [];
    const lastSevenDays: ThreadData[] = [];
    const previous: ThreadData[] = [];

    threads.forEach((thread) => {
      // Since ThreadData doesn't explicitly include lastMessageAt in the type,
      // we need to access it safely
      const lastMessageAt = (thread as any).lastMessageAt;
      if (!lastMessageAt) {
        // If no lastMessageAt, put it in previous section
        previous.push(thread);
        return;
      }

      const lastMessageDate = new Date(lastMessageAt);

      if (isToday(lastMessageDate)) {
        today.push(thread);
      } else if (isYesterday(lastMessageDate)) {
        yesterday.push(thread);
      } else if (isLastSevenDays(lastMessageDate)) {
        lastSevenDays.push(thread);
      } else {
        previous.push(thread);
      }
    });

    return {
      today,
      yesterday,
      lastSevenDays,
      previous,
    };
  };

  // Group regular threads by date
  const { today, yesterday, lastSevenDays, previous } =
    groupThreadsByDate(regularThreads);

  // Render a category of threads with a header
  const ThreadCategory = ({
    title,
    threads,
  }: {
    title: string;
    threads: ThreadData[];
  }) => {
    if (threads.length === 0) {
      return null;
    }

    return (
      <>
        <div className="px-0 py-1 text-xs font-medium text-primary/85">
          {title}
        </div>
        {threads.map((threadItem) => (
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
      </>
    );
  };

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
                  <div className="px-0 py-2 flex text-xs font-medium text-muted-foreground">
                    <Pin className="h-4 w-4 mr-2" /> Pinned
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
                </>
              )}

              {/* Regular Threads Section - Organized by Date */}
              {regularThreads.length > 0 ? (
                <>
                  {/* Today's Threads */}
                  <ThreadCategory title="Today" threads={today} />
                  {today.length > 0 &&
                    (yesterday.length > 0 ||
                      lastSevenDays.length > 0 ||
                      previous.length > 0)}

                  {/* Yesterday's Threads */}
                  <ThreadCategory title="Yesterday" threads={yesterday} />
                  {yesterday.length > 0 &&
                    (lastSevenDays.length > 0 || previous.length > 0)}
                  {/* Last 7 Days Threads */}
                  <ThreadCategory title="Last 7 Days" threads={lastSevenDays} />
                  {lastSevenDays.length > 0 && previous.length > 0}
                  {/* Previous Threads */}
                  <ThreadCategory title="Previous" threads={previous} />
                </>
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
