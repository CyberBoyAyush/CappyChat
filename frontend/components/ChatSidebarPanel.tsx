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
import { FolderPlus, Folder, PinIcon } from "lucide-react";
import { useProjectManager } from "@/frontend/hooks/useProjectManager";
import ProjectFolder from "./projects/ProjectFolder";
import ProjectCreateDialog from "./projects/ProjectCreateDialog";
import { Button } from "./ui/button";
import { HybridDB } from "@/lib/hybridDB";
import { useAuth } from "@/frontend/contexts/AuthContext";
import { devWarn, devError } from '@/lib/logger';

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
  const { isGuest, guestUser } = useAuth();

  const {
    threadCollection,
    navigateToThread,
    removeThread,
    toggleThreadPin,
    renameThread,
    updateThreadTags,
    branchThread,
    isActiveThread,
    isLoading,
    isLoadingMore,
    hasMore,
    loadMoreThreads,
  } = useThreadManager();

  // Project management
  const { projects, createProject, updateProject, deleteProject } =
    useProjectManager();

  // Handle project color change
  const handleProjectColorChange = async (
    projectId: string,
    colorIndex: number
  ) => {
    try {
      await HybridDB.updateProjectColor(projectId, colorIndex);
    } catch (error) {
      devError("Error updating project color:", error);
    }
  };

  // State for filtered threads (used by search)
  const [filteredThreads, setFilteredThreads] = useState<ThreadData[]>([]);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false);

  // Use filtered threads if search is active, otherwise use all threads
  const rawThreadsToDisplay = isSearchActive
    ? filteredThreads
    : threadCollection || [];

  // Remove duplicates at the source level to prevent React key conflicts
  const threadsToDisplay = rawThreadsToDisplay.filter(
    (thread, index, arr) => arr.findIndex((t) => t.id === thread.id) === index
  );

  // Log warning if duplicates were found at the source
  if (rawThreadsToDisplay.length !== threadsToDisplay.length) {
    const duplicateCount = rawThreadsToDisplay.length - threadsToDisplay.length;
    devWarn(
      `[ChatSidebarPanel] Removed ${duplicateCount} duplicate threads from source data`
    );

    // Log the duplicate IDs for debugging
    const threadIds = rawThreadsToDisplay.map((t) => t.id);
    const duplicateIds = threadIds.filter(
      (id, index) => threadIds.indexOf(id) !== index
    );
    devWarn("Duplicate thread IDs:", [...new Set(duplicateIds)]);
  }

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

  // Group threads by projects
  const threadsWithProjects = regularThreads.filter(
    (thread) => thread.projectId
  );
  const threadsWithoutProjects = regularThreads.filter(
    (thread) => !thread.projectId
  );

  // Group threads by project ID
  const threadsByProject = threadsWithProjects.reduce((acc, thread) => {
    const projectId = thread.projectId!;
    if (!acc[projectId]) {
      acc[projectId] = [];
    }
    acc[projectId].push(thread);
    return acc;
  }, {} as Record<string, ThreadData[]>);

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

  // Group threads without projects by date
  const { today, yesterday, lastSevenDays, previous } = groupThreadsByDate(
    threadsWithoutProjects
  );

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

    // Remove duplicates and add defensive key generation
    const uniqueThreads = threads.filter(
      (thread, index, arr) => arr.findIndex((t) => t.id === thread.id) === index
    );

    // Log warning if duplicates were found
    if (uniqueThreads.length !== threads.length) {
      devWarn(
        `[${title}] Removed ${
          threads.length - uniqueThreads.length
        } duplicate threads`
      );
    }

    return (
      <>
        <div className="px-0 py-1 text-sm font-medium text-primary/85">
          {title}
        </div>
        {uniqueThreads.map((threadItem, index) => (
          <SidebarMenuItem key={`${title}-${threadItem.id}-${index}`}>
            <ThreadListItem
              threadData={threadItem}
              isActive={isActiveThread(threadItem.id)}
              onNavigate={navigateToThread}
              onDelete={removeThread}
              onTogglePin={toggleThreadPin}
              onRename={renameThread}
              onUpdateTags={updateThreadTags}
              onBranch={branchThread}
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

      <div className="flex-1 overflow-y-auto px-3 no-scrollbar pb-3 sm:px-4">
        <SidebarMenu className="space-y-2">
          {isGuest ? (
            // Guest user interface - simple welcome message
            <div className="px-2 py-4 text-center space-y-3">
              <div className="text-sm text-muted-foreground">
                Welcome to CappyChat! You can send up to 2 free messages to try our
                AI assistant.
              </div>
              {guestUser && (
                <div className="text-xs font-medium text-primary/80">
                  {guestUser.messagesUsed}/{guestUser.maxMessages} free messages used
                </div>
              )}
              <div className="text-xs text-muted-foreground">
                Sign up for unlimited conversations, conversation history, and
                access to all features.
              </div>
            </div>
          ) : isLoading ? (
            // Loading skeleton - centered properly
            <SidebarMenuItem>
              <div className="h-9 flex items-center justify-center px-2 py-1 rounded-lg overflow-hidden w-full">
                <div className="h-4 bg-muted animate-pulse rounded w-3/4"></div>
              </div>
            </SidebarMenuItem>
          ) : (
            <>
              {/* Projects and Pinned Section */}
              <>
                <div className="px-0 pt-1 flex items-center justify-between text-sm font-medium text-primary/85">
                  <div className="flex items-center gap-2 ">
                    <Folder className="h-4 w-4" />
                    <span>Projects</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 w-5 p-0 hover:bg-accent/50 border border-dashed border-muted-foreground/30 hover:border-muted-foreground/50"
                    onClick={() => setIsProjectDialogOpen(true)}
                    title="Create new project"
                  >
                    <FolderPlus className="h-3 w-3" />
                  </Button>
                </div>

                {/* Projects */}
                {projects.map((project) => {
                  const projectThreads = threadsByProject[project.id] || [];
                  return (
                    <ProjectFolder
                      key={project.id}
                      project={project}
                      threads={projectThreads}
                      threadOperations={{
                        onNavigate: navigateToThread,
                        onDelete: removeThread,
                        onTogglePin: toggleThreadPin,
                        onRename: renameThread,
                        onUpdateTags: updateThreadTags,
                        onBranch: branchThread,
                        isActive: false, // This will be set per thread
                      }}
                      onProjectUpdate={updateProject}
                      onProjectDelete={deleteProject}
                      onProjectColorChange={handleProjectColorChange}
                      isActive={isActiveThread}
                    />
                  );
                })}

                {/* Pinned Threads */}
                {pinnedThreads.length > 0 && (
                  <div className="space-y-1">
                    {projects.length > 0 && (
                      <div className="px-0 py-0.5 text-sm font-medium text-primary/70">
                        <PinIcon className="h-4 w-4 inline-block mr-2" />
                        Pinned Chats
                      </div>
                    )}
                    {pinnedThreads
                      .filter(
                        (thread, index, arr) =>
                          arr.findIndex((t) => t.id === thread.id) === index
                      )
                      .map((threadItem, index) => (
                        <SidebarMenuItem
                          key={`pinned-${threadItem.id}-${index}`}
                        >
                          <ThreadListItem
                            threadData={threadItem}
                            isActive={isActiveThread(threadItem.id)}
                            onNavigate={navigateToThread}
                            onDelete={removeThread}
                            onTogglePin={toggleThreadPin}
                            onRename={renameThread}
                            onUpdateTags={updateThreadTags}
                            onBranch={branchThread}
                          />
                        </SidebarMenuItem>
                      ))}
                  </div>
                )}
              </>

              {/* Regular Threads Section - Organized by Date (threads without projects) */}
              {threadsWithoutProjects.length > 0 ? (
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

                  {/* Load More Button */}
                  {hasMore && (
                    <SidebarMenuItem>
                      <Button
                        variant="ghost"
                        className="w-full justify-center text-sm text-muted-foreground hover:text-foreground hover:bg-accent/50 h-8 border border-dashed border-muted-foreground/30 hover:border-muted-foreground/50"
                        onClick={loadMoreThreads}
                        disabled={isLoadingMore}
                      >
                        {isLoadingMore ? (
                          <>
                            <div className="w-4 h-4 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin mr-2" />
                            Loading...
                          </>
                        ) : (
                          "Load More Chats (40)"
                        )}
                      </Button>
                    </SidebarMenuItem>
                  )}
                </>
              ) : pinnedThreads.length === 0 &&
                projects.length === 0 &&
                threadsWithoutProjects.length === 0 ? (
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

      {/* Project Creation Dialog */}
      <ProjectCreateDialog
        isOpen={isProjectDialogOpen}
        onOpenChange={setIsProjectDialogOpen}
        onCreateProject={createProject}
      />
    </div>
  );
}
