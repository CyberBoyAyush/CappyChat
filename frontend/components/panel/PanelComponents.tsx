/**
 * Panel Components
 *
 * Used in: frontend/components/ChatSidebarPanel.tsx
 * Purpose: Consolidated panel UI components including header, footer, and thread list items.
 * Contains app branding, navigation buttons, thread display, and settings access.
 */

import { memo, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { Button } from "../ui/button";
import { Trash2, GitBranch, Settings, LogIn, Crown, Coins } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThreadData, ThreadOperations } from "./ThreadManager";
import UserProfileDropdown from "../UserProfileDropdown";
import { DeleteThreadDialog } from "./DeleteThreadDialog";
import { ThreadSearch } from "./ThreadSearch";
import { ThreadMenuDropdown } from "./ThreadMenuDropdown";
import { useAuth } from "@/frontend/contexts/AuthContext";
import { getUserTierInfo } from "@/lib/tierSystem";
import { useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
  ChevronDown,
  User,
  Sparkles,
  Database,
  Shield,
  Github,
  Info,
  Calendar,
  LogOut,
  Activity,
} from "lucide-react";

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
      <span className="text-xl font-bold text-primary tracking-tight">
        CappyChat
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
const NewChatButton = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Button
      onClick={() => {
        if (location.pathname !== "/chat") navigate("/chat");
      }}
      disabled={location.pathname === "/chat"}
      className="w-full justify-center h-7 sm:h-9 rounded-lg text-sm sm:text-sm"
    >
      New Chat
    </Button>
  );
};

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
  const { isGuest, logout } = useAuth();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Get user initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const [tierInfo, setTierInfo] = useState<any>(null);

  // Load tier information
  useEffect(() => {
    const loadTierInfo = async () => {
      if (!user) return;

      try {
        const info = await getUserTierInfo();
        setTierInfo(info);
      } catch (error) {
        console.error("Error loading tier info:", error);
      }
    };

    loadTierInfo();
  }, [user]);

  const userInitials = user?.name ? getInitials(user.name) : "U";
  const displayName = user?.name || "User";
  const displayEmail = user?.email || "";
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
      navigate("/");
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleSettings = () => {
    navigate("/settings");
  };

  return (
    <div className="flex flex-col gap-3 p-3 sm:p-4">
      {/* Logo */}
      <div className="flex relative justify-center">
        <AppTitle />

        {/* Show login icon for guest users, settings icon for authenticated users */}
        {isGuest ? (
          <LogIn
            className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground md:hidden cursor-pointer hover:text-primary transition-colors"
            onClick={() => navigate("/login")}
          />
        ) : (
          <div className="md:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Settings
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-5 w-5 text-primary md:hidden cursor-pointer hover:text-primary transition-colors"
                  onClick={() => navigate("/settings")}
                />
              </DropdownMenuTrigger>

              <DropdownMenuContent
                align="end"
                className="w-64 p-2 bg-card border-border"
                sideOffset={8}
              >
                {/* User Header */}
                <DropdownMenuLabel className="px-3 py-2">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-medium shadow-sm">
                      {userInitials}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground truncate">
                          {displayName}
                        </span>
                        {tierInfo?.tier === "premium" && (
                          <span className="px-2 py-0.5 text-xs font-medium bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full">
                            PRO
                          </span>
                        )}
                        {tierInfo?.tier === "admin" && (
                          <span className="px-2 py-0.5 text-xs font-medium bg-gradient-to-r from-zinc-700 to-zinc-900 dark:from-zinc-300 dark:to-zinc-100 text-white dark:text-black rounded-full">
                            ADMIN
                          </span>
                        )}
                      </div>
                      <span className="text-sm text-muted-foreground truncate">
                        {displayEmail}
                      </span>
                    </div>
                  </div>
                </DropdownMenuLabel>

                <DropdownMenuSeparator />

                {/* User Actions */}
                <DropdownMenuItem
                  onClick={() => navigate("/settings#profile")}
                  className="flex items-center space-x-2 cursor-pointer px-3 py-2 text-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                >
                  <User className="h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => navigate("/settings#customization")}
                  className="flex items-center space-x-2 cursor-pointer px-3 py-2 text-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>Customization</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => navigate("/settings#storage")}
                  className="flex items-center space-x-2 cursor-pointer px-3 py-2 text-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                >
                  <Database className="h-4 w-4" />
                  <span>Storage</span>
                </DropdownMenuItem>

                {/* Admin Panel - Only show for admin users */}
                {tierInfo?.tier === "admin" && (
                  <DropdownMenuItem
                    onClick={() => navigate("/admin")}
                    className="flex items-center space-x-2 cursor-pointer px-3 py-2 text-black hover:bg-black/5 hover:text-black dark:text-white dark:hover:bg-white/10 dark:hover:text-white"
                  >
                    <Shield className="h-4 w-4" />
                    <span>Admin Panel</span>
                  </DropdownMenuItem>
                )}

                <DropdownMenuSeparator />

                {/* Github */}
                <DropdownMenuItem
                  onClick={() =>
                    window.open(
                      "https://github.com/cyberboyayush/CappyChat",
                      "_blank"
                    )
                  }
                  className="flex items-center space-x-2 cursor-pointer px-3 py-2 text-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                >
                  <Github className="h-4 w-4" />
                  <span>Github</span>
                </DropdownMenuItem>

                {/* About */}
                <DropdownMenuItem
                  onClick={() => navigate("/about")}
                  className="flex items-center space-x-2 cursor-pointer px-3 py-2 text-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                >
                  <Info className="h-4 w-4" />
                  <span>About</span>
                </DropdownMenuItem>

                {/* Pricing */}
                <DropdownMenuItem
                  onClick={() => navigate("/pricing")}
                  className="flex items-center space-x-2 cursor-pointer px-3 py-2 text-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                >
                  <Coins className="h-4 w-4" />
                  <span>Pricing</span>
                </DropdownMenuItem>

                {/* Changelog */}
                <DropdownMenuItem
                  onClick={() => navigate("/changelog")}
                  className="flex items-center space-x-2 cursor-pointer px-3 py-2 text-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                >
                  <Calendar className="h-4 w-4" />
                  <span>Changelog</span>
                </DropdownMenuItem>

                {/* Status */}
                <DropdownMenuItem
                  onClick={() =>
                    window.open("https://status.cappychat.com", "_blank")
                  }
                  className="flex items-center space-x-2 cursor-pointer px-3 py-2 text-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                >
                  <Activity className="h-4 w-4" />
                  <span>Status</span>
                </DropdownMenuItem>

                {/* Settings */}
                <DropdownMenuItem
                  onClick={handleSettings}
                  className="flex items-center space-x-2 cursor-pointer px-3 py-2 text-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                >
                  <Settings className="h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                {/* Logout */}
                <DropdownMenuItem
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="flex items-center space-x-2 cursor-pointer px-3 py-2 text-destructive hover:bg-destructive/10 focus:text-destructive"
                >
                  <LogOut className="h-4 w-4" />
                  <span>{isLoggingOut ? "Signing out..." : "Sign out"}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      {/* New Chat Button - Full Width */}
      <NewChatButton />

      {/* Search Bar - Full Width (hidden for guest users) */}
      {!isGuest && onFilteredThreadsChange && (
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
    <div className=" hidden md:flex flex-col gap-2 p-2">
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
 * Purpose: Displays the thread title with truncation for long titles and branch indicator.
 */
const ThreadTitle = ({ threadData }: { threadData: ThreadData }) => (
  <div className="flex items-center min-w-0 gap-1.5">
    {threadData.isBranched && (
      <GitBranch className="h-3.5 w-3.5 text-primary/50 flex-shrink-0" />
    )}
    <span
      className="truncate flex align-middle md:block"
      title={threadData.title}
    >
      {threadData.title}
    </span>
  </div>
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
  onBranch,
  isActive,
}: ThreadListItemProps) => {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const containerStyles = cn(
    "cursor-pointer group/thread relative flex items-center px-3 py-2 sm:px-2 text-base sm:py-1 rounded-md overflow-hidden w-full transition-colors",
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
        <div className="flex min-w-0 w-full justify-between pr-2 overflow-hidden ">
          <ThreadTitle threadData={threadData} />

          <div className="flex md:hidden  gap-1 text-xs text-muted-foreground">
            <DeleteButton onDelete={handleDeleteClick} />
            <ThreadMenuDropdown
              threadData={threadData}
              onTogglePin={onTogglePin}
              onRename={onRename}
              onUpdateTags={onUpdateTags}
              onBranch={onBranch}
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
              onBranch={onBranch}
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
