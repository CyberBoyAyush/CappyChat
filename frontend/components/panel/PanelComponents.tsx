/**
 * Panel Components
 *
 * Used in: frontend/components/ChatSidebarPanel.tsx
 * Purpose: Consolidated panel UI components including header, footer, and thread list items.
 * Contains app branding, navigation buttons, thread display, and settings access.
 */

import { memo, useState } from "react";
import { Link, useParams } from "react-router";
import { Button } from "../ui/button";
import { buttonVariants } from "../ui/button";
import {
  SidebarHeader,
  SidebarTrigger,
} from "@/frontend/components/ui/sidebar";
import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThreadData, ThreadOperations } from "./ThreadManager";
import UserProfileDropdown from "../UserProfileDropdown";
import { DeleteThreadDialog } from "./DeleteThreadDialog";

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
  <div className="flex items-center gap-2">
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
      className: "w-full",
    })}
  >
    New Chat
  </Link>
);

/**
 * Panel Header Component
 *
 * Used in: frontend/components/ChatSidebarPanel.tsx
 * Purpose: Header section of the conversation panel containing app title, sidebar toggle, and new chat button.
 * Provides branding and quick access to start new conversations.
 */
const PanelHeaderComponent = () => {
  return (
    <SidebarHeader className="flex justify-between items-center gap-4 relative">
      <AppTitle />
      <NewChatButton />
    </SidebarHeader>
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
  <span className="truncate block">{title}</span>
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
    className="ml-auto h-7 w-7 text-muted-foreground hover:text-destructive transition-all duration-200 focus:opacity-100 active:opacity-100 
      md:opacity-0 md:group-hover/thread:opacity-100 
      opacity-70 group-hover/thread:opacity-100"
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
  isActive,
}: ThreadListItemProps) => {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const containerStyles = cn(
    "cursor-pointer group/thread h-9 flex items-center px-2 py-1 rounded-lg overflow-hidden w-full transition-colors",
    "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
    isActive && "bg-sidebar-accent text-sidebar-accent-foreground"
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
      console.error('Error deleting thread:', error);
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  return (
    <>
      <div className={containerStyles} onClick={handleItemClick}>
        <ThreadTitle title={threadData.title} />
        <DeleteButton onDelete={handleDeleteClick} />
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
