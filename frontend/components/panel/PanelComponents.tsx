/**
 * Panel Components
 *
 * Used in: frontend/components/ChatSidebarPanel.tsx
 * Purpose: Consolidated panel UI components including header, footer, and thread list items.
 * Contains app branding, navigation buttons, thread display, and settings access.
 */

import { memo, useState } from "react";
import { Link } from "react-router";
import { Button } from "../ui/button";
import { buttonVariants } from "../ui/button";
import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThreadData, ThreadOperations } from "./ThreadManager";
import UserProfileDropdown from "../UserProfileDropdown";
import { DeleteThreadDialog } from "./DeleteThreadDialog";
import { ThreadSearch } from "./ThreadSearch";
import { ThreadMenuDropdown } from "./ThreadMenuDropdown";

// ===============================================
// Panel Header Components
// ===============================================

/**
 * Application Title Component
 *
 * Used in: PanelHeader
 * Purpose: Displays the app logo and branding with gradient design and animation.
 */
const AppTitle = memo(() => (
  <div className="flex items-center gap-2 shrink-0">
    {/* Logo Text */}
    <div className="flex items-baseline">
      <span className="text-xl font-bold text-sidebar-foreground tracking-tight">
        AV
      </span>
      <span className="text-xl font-bold text-primary tracking-tight">
        Chat
      </span>
      <div className="w-1.5 h-1.5 rounded-full bg-primary ml-0.5 animate-pulse"></div>
    </div>
  </div>
));

AppTitle.displayName = "AVChatAppTitle";

/**
 * New Chat Button Component
 *
 * Used in: PanelHeader
 * Purpose: Provides navigation to start a new chat conversation.
 */
const NewChatButton = () => (
  <Link
    to="/chat"
    className={buttonVariants({
      variant: "default",
      className:
        "w-full justify-center h-7 sm:h-9 rounded-lg text-sm sm:text-sm",
    })}
  >
    New Chat
  </Link>
);

/**
 * Panel Header Component
 *
 * Used in: frontend/components/ChatSidebarPanel.tsx
 * Purpose: Header section of the conversation panel containing app title, search, and new chat button.
 * Provides branding, search functionality, and quick access to start new conversations.
 */
interface PanelHeaderProps {
  threads?: ThreadData[];
  onFilteredThreadsChange?: (filteredThreads: ThreadData[]) => void;
}

const PanelHeaderComponent = ({
  threads = [],
  onFilteredThreadsChange,
}: PanelHeaderProps) => {
  return (
    <div className="flex flex-col gap-3 p-3 sm:p-4">
      {/* Logo */}
      <div className="flex justify-center">
        <AppTitle />
      </div>

      {/* New Chat Button - Full Width */}
      <NewChatButton />

      {/* Search Bar - Full Width */}
      {onFilteredThreadsChange && (
        <ThreadSearch
          threads={threads}
          onFilteredThreadsChange={onFilteredThreadsChange}
        />
      )}
    </div>
  );
};

export const PanelHeader = memo(PanelHeaderComponent);

// ===============================================
// Panel Footer Components
// ===============================================

/**
 * Panel Footer Component
 *
 * Used in: frontend/components/ChatSidebarPanel.tsx
 * Purpose: Footer section of the conversation panel containing user profile dropdown.
 * Provides access to user account, settings, and logout functionality.
 */
const PanelFooterComponent = () => {
  return (
    <div className="flex flex-col gap-2 p-2">
      <UserProfileDropdown />
    </div>
  );
};

export const PanelFooter = memo(PanelFooterComponent);

// ===============================================
// Thread List Item Components
// ===============================================

/**
 * Thread Title Component
 *
 * Used in: ThreadListItem
 * Purpose: Displays the thread title with truncation for long titles.
 */
const ThreadTitle = ({ title }: { title: string }) => (
  <span className="truncate block " title={title}>
    {title}
  </span>
);
/**
 * Delete Thread Button Component
 *
 * Used in: ThreadListItem
 * Purpose: Provides delete functionality for individual threads.
 */
interface DeleteButtonProps {
  onDelete: (event?: React.MouseEvent) => void;
}

const DeleteButton = ({ onDelete }: DeleteButtonProps) => (
  <Button
    variant="ghost"
    size="icon"
    className="h-7 w-7 text-muted-foreground hover:text-destructive transition-all duration-200"
    onClick={(event: React.MouseEvent) => onDelete(event)}
    aria-label="Delete thread"
    data-delete-button
  >
    <Trash2 size={14} />
  </Button>
);

/**
 * Thread List Item Component
 *
 * Used in: frontend/components/ChatSidebarPanel.tsx
 * Purpose: Renders individual thread items in the conversation panel sidebar.
 * Displays thread title, active state, and provides navigation and delete functionality.
 */
interface ThreadListItemProps extends ThreadOperations {
  threadData: ThreadData;
}

const ThreadListItem = ({
  threadData,
  onNavigate,
  onDelete,
  onTogglePin,
  onRename,
  onUpdateTags,
  isActive,
}: ThreadListItemProps) => {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const containerStyles = cn(
    "cursor-pointer group/thread relative flex items-center px-3 py-2 sm:px-2 text-sm sm:py-1 rounded-md overflow-hidden w-full transition-colors",
    "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
    "border border-transparent hover:border-border/50",
    isActive && "bg-sidebar-accent text-sidebar-accent-foreground border-border"
  );

  const handleItemClick = () => {
    onNavigate(threadData.id);
  };

  const handleDeleteClick = (event?: React.MouseEvent) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(threadData.id);
    } catch (error) {
      console.error("Error deleting thread:", error);
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  return (
    <>
      <div className={containerStyles} onClick={handleItemClick}>
        <div className="flex min-w-0 pr-2 overflow-hidden ">
          <ThreadTitle title={threadData.title} />

          <div className="flex md:hidden items-start justify-start gap-1 text-xs text-muted-foreground mt-0.5">
            <DeleteButton onDelete={handleDeleteClick} />
            <ThreadMenuDropdown
              threadData={threadData}
              onTogglePin={onTogglePin}
              onRename={onRename}
              onUpdateTags={onUpdateTags}
              onDelete={(_, event) => handleDeleteClick(event)}
            />
          </div>
        </div>

        <div
          className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 items-center  
                       opacity-0 group-hover/thread:opacity-100 scale-90 group-hover/thread:scale-100
                       transition-all duration-200 transform-gpu"
        >
          <div className="bg-gradient-to-r from-transparent w-8 to-sidebar-accent h-6 "></div>
          <div className="bg-sidebar-accent text-sidebar-accent-foreground">
            <DeleteButton onDelete={handleDeleteClick} />
            <ThreadMenuDropdown
              threadData={threadData}
              onTogglePin={onTogglePin}
              onRename={onRename}
              onUpdateTags={onUpdateTags}
              onDelete={(_, event) => handleDeleteClick(event)}
            />
          </div>
        </div>
      </div>

      <DeleteThreadDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        threadTitle={threadData.title}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
      />
    </>
  );
};

export default ThreadListItem;
