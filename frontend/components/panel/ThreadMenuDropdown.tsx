/**
 * ThreadMenuDropdown Component
 *
 * Used in: frontend/components/panel/PanelComponents.tsx
 * Purpose: Provides a dropdown menu for thread actions including pin, rename, and tags management.
 * Replaces the individual pin and delete buttons with a consolidated menu interface.
 */

import { useState, useCallback } from "react";
import {
  MoreHorizontal,
  Pin,
  PinOff,
  Edit3,
  Tag,
  Trash2,
  GitBranch,
  FolderPlus,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/frontend/components/ui/dropdown-menu";
import { Button } from "@/frontend/components/ui/button";
import { ThreadData } from "./ThreadManager";
import { ThreadRenameDialog } from "./index";
import { ThreadTagsDialog } from "./index";
import { useProjectManager } from "@/frontend/hooks/useProjectManager";
import { HybridDB } from "@/lib/hybridDB";

interface ThreadMenuDropdownProps {
  threadData: ThreadData;
  onTogglePin: (threadId: string, event?: React.MouseEvent) => void;
  onRename: (threadId: string, newTitle: string) => void;
  onUpdateTags: (threadId: string, tags: string[]) => void;
  onBranch: (threadId: string, newTitle?: string) => void;
  onDelete: (threadId: string, event?: React.MouseEvent) => void;
}

export const ThreadMenuDropdown = ({
  threadData,
  onTogglePin,
  onRename,
  onUpdateTags,
  onBranch,
  onDelete,
}: ThreadMenuDropdownProps) => {
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [isTagsDialogOpen, setIsTagsDialogOpen] = useState(false);

  // Get projects for the "Add to Project" functionality
  const { projects } = useProjectManager();

  const handlePinClick = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();
      onTogglePin(threadData.id, event);
    },
    [onTogglePin, threadData.id]
  );

  const handleRenameClick = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsRenameDialogOpen(true);
  }, []);

  const handleTagsClick = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsTagsDialogOpen(true);
  }, []);

  const handleBranchClick = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();
      onBranch(threadData.id);
    },
    [onBranch, threadData.id]
  );

  const handleDeleteClick = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();
      onDelete(threadData.id, event);
    },
    [onDelete, threadData.id]
  );

  const handleRenameConfirm = useCallback(
    (newTitle: string) => {
      onRename(threadData.id, newTitle);
      setIsRenameDialogOpen(false);
    },
    [onRename, threadData.id]
  );

  const handleTagsConfirm = useCallback(
    (tags: string[]) => {
      onUpdateTags(threadData.id, tags);
      setIsTagsDialogOpen(false);
    },
    [onUpdateTags, threadData.id]
  );

  const handleAddToProject = useCallback(
    async (projectId: string) => {
      try {
        // Update thread to assign it to the project
        await HybridDB.updateThreadProject(threadData.id, projectId);
      } catch (error) {
        console.error("Error adding thread to project:", error);
      }
    },
    [threadData.id]
  );

  const handleRemoveFromProject = useCallback(async () => {
    try {
      // Update thread to remove it from the project
      await HybridDB.updateThreadProject(threadData.id, undefined);
    } catch (error) {
      console.error("Error removing thread from project:", error);
    }
  }, [threadData.id]);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground transition-all duration-200 focus:opacity-100 active:opacity-100 data-[state=open]:opacity-100 md:data-[state=open]:opacity-100
              md:opacity-0 md:group-hover/thread:opacity-100
              opacity-70 group-hover/thread:opacity-100"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            aria-label="Thread options"
          >
            <MoreHorizontal size={14} />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={handlePinClick}>
            {threadData.isPinned ? (
              <>
                <PinOff className="mr-2 h-4 w-4" />
                Unpin
              </>
            ) : (
              <>
                <Pin className="mr-2 h-4 w-4" />
                Pin
              </>
            )}
          </DropdownMenuItem>

          <DropdownMenuItem onClick={handleRenameClick}>
            <Edit3 className="mr-2 h-4 w-4" />
            Rename
          </DropdownMenuItem>

          <DropdownMenuItem onClick={handleTagsClick}>
            <Tag className="mr-2 h-4 w-4" />
            Tags
            {threadData.tags && threadData.tags.length > 0 && (
              <span className="ml-auto flex items-center gap-1">
                <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-medium bg-primary text-primary-foreground rounded-full">
                  {threadData.tags.length}
                </span>
              </span>
            )}
          </DropdownMenuItem>

          {/* Project Management */}
          {projects.length > 0 && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <FolderPlus className="mr-2 h-4 w-4" />
                  {threadData.projectId ? "Move to Project" : "Add to Project"}
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  {threadData.projectId && (
                    <>
                      <DropdownMenuItem onClick={handleRemoveFromProject}>
                        Remove from Project
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  {projects
                    .filter((project) => project.id !== threadData.projectId)
                    .map((project) => (
                      <DropdownMenuItem
                        key={project.id}
                        onClick={() => handleAddToProject(project.id)}
                      >
                        {project.name}
                      </DropdownMenuItem>
                    ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            </>
          )}

          <DropdownMenuItem onClick={handleBranchClick}>
            <GitBranch className="mr-2 h-4 w-4" />
            Branch
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={handleDeleteClick} variant="destructive">
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ThreadRenameDialog
        isOpen={isRenameDialogOpen}
        onOpenChange={setIsRenameDialogOpen}
        currentTitle={threadData.title}
        onConfirm={handleRenameConfirm}
      />

      <ThreadTagsDialog
        isOpen={isTagsDialogOpen}
        onOpenChange={setIsTagsDialogOpen}
        currentTags={threadData.tags || []}
        onConfirm={handleTagsConfirm}
      />
    </>
  );
};
