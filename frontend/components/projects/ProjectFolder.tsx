/**
 * Project Folder Component
 *
 * Purpose: Renders a collapsible project folder in the sidebar containing threads.
 * Provides project management actions and thread organization within projects.
 */

import React, { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Folder,
  FolderOpen,
  MoreHorizontal,
  Plus,
  Palette,
  Edit,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ProjectData } from "@/frontend/hooks/useProjectManager";
import {
  ThreadData,
  ThreadOperations,
} from "@/frontend/components/panel/ThreadManager";
import { SidebarMenuItem } from "@/frontend/components/ui/sidebar";
import ThreadListItem from "@/frontend/components/panel/PanelComponents";
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
import { useNavigate } from "react-router";
import { v4 as uuidv4 } from "uuid";
import { HybridDB } from "@/lib/hybridDB";
import ProjectRenameDialog from "./ProjectRenameDialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/frontend/components/ui/dialog";
// import ProjectDeleteDialog from './ProjectDeleteDialog';

interface ProjectFolderProps {
  project: ProjectData;
  threads: ThreadData[];
  threadOperations: ThreadOperations;
  onProjectUpdate: (
    projectId: string,
    name: string,
    description?: string
  ) => Promise<void>;
  onProjectDelete: (
    projectId: string,
    reassignThreadsToProjectId?: string
  ) => Promise<void>;
  onProjectColorChange: (
    projectId: string,
    colorIndex: number
  ) => Promise<void>;
  isActive: (threadId: string) => boolean;
}

// Project folder colors - matching theme with icon colors
const PROJECT_COLORS = [
  {
    bg: "bg-blue-500/20 border-blue-500/30",
    icon: "text-blue-500",
    name: "Blue",
  },
  {
    bg: "bg-green-500/20 border-green-500/30",
    icon: "text-green-500",
    name: "Green",
  },
  {
    bg: "bg-purple-500/20 border-purple-500/30",
    icon: "text-purple-500",
    name: "Purple",
  },
  {
    bg: "bg-orange-500/20 border-orange-500/30",
    icon: "text-orange-500",
    name: "Orange",
  },
  {
    bg: "bg-pink-500/20 border-pink-500/30",
    icon: "text-pink-500",
    name: "Pink",
  },
  {
    bg: "bg-cyan-500/20 border-cyan-500/30",
    icon: "text-cyan-500",
    name: "Cyan",
  },
  {
    bg: "bg-yellow-500/20 border-yellow-500/30",
    icon: "text-yellow-500",
    name: "Yellow",
  },
  {
    bg: "bg-red-500/20 border-red-500/30",
    icon: "text-red-500",
    name: "Red",
  },
];

export const ProjectFolder: React.FC<ProjectFolderProps> = ({
  project,
  threads,
  threadOperations,
  onProjectUpdate,
  onProjectDelete,
  onProjectColorChange,
  isActive,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  // Get color for project - use stored colorIndex or default based on ID
  const colorIndex =
    (project as any).colorIndex ??
    project.id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) %
      PROJECT_COLORS.length;
  const projectColor = PROJECT_COLORS[colorIndex];

  const handleToggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  const handleNewChatInProject = async () => {
    try {
      // Generate new thread ID
      const threadId = uuidv4();

      // Create thread with project ID
      await HybridDB.createThread(threadId, project.id);

      // Navigate to the new thread
      navigate(`/chat/${threadId}`);
    } catch (error) {
      console.error("Error creating new chat in project:", error);
    }
  };

  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleProjectRename = () => {
    setIsRenameDialogOpen(true);
  };

  const handleProjectDelete = () => {
    setIsDeleteDialogOpen(true);
  };

  const handleRenameConfirm = async (
    newName: string,
    newDescription?: string
  ) => {
    try {
      await onProjectUpdate(project.id, newName, newDescription);
      setIsRenameDialogOpen(false);
    } catch (error) {
      console.error("Error renaming project:", error);
    }
  };

  const handleDeleteConfirm = async (reassignToProjectId?: string) => {
    try {
      await onProjectDelete(project.id, reassignToProjectId);
      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error("Error deleting project:", error);
    }
  };

  const handleColorChange = async (newColorIndex: number) => {
    try {
      await onProjectColorChange(project.id, newColorIndex);
    } catch (error) {
      console.error("Error changing project color:", error);
    }
  };

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div className="mb-1">
      {/* Project Header */}
      <div
        className={cn(
          "flex items-center relative justify-between px-2 py-1.5 rounded-lg cursor-pointer group/project",
          "hover:bg-sidebar-accent/50 transition-colors",
          projectColor
        )}
        onClick={handleToggleExpanded}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {/* Expand/Collapse Icon */}
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          )}

          {/* Folder Icon with Color */}
          {isExpanded ? (
            <FolderOpen
              className={cn("h-4 w-4 flex-shrink-0", projectColor.icon)}
            />
          ) : (
            <Folder
              className={cn("h-4 w-4 flex-shrink-0", projectColor.icon)}
            />
          )}

          {/* Project Name */}
          <span className="text-xs font-medium truncate text-foreground">
            {project.name}
          </span>

          {/* Thread Count */}
          <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
            {threads.length}
          </span>
        </div>

        <div className="flex md:absolute overflow-hidden md:right-0 h-full md:rounded-r-md items-center md:opacity-0 group-hover/project:opacity-100 transition-opacity">
          {/* New Chat Button */}
          <div className="hidden md:block h-full w-5 bg-gradient-to-r from-transparent to-sidebar-accent"></div>
          <div className="md:bg-sidebar-accent h-full flex justify-center items-center pr-1.5">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 hover:bg-accent/50"
              onClick={(e) => {
                e.stopPropagation();
                handleNewChatInProject();
              }}
              title="New chat in this project"
            >
              <Plus className="h-3 w-3" />
            </Button>

            {/* Project Menu */}
            <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={handleMenuClick}
                >
                  <MoreHorizontal className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={handleProjectRename}>
                  <Edit className="dark:text-white h-4 w-4" />
                  Rename Project
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <Palette className="mr-2 h-4 w-4" />
                    Change Color
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    {PROJECT_COLORS.map((color, index) => (
                      <DropdownMenuItem
                        key={index}
                        onClick={() => handleColorChange(index)}
                        className="flex items-center gap-2"
                      >
                        <Folder className={cn("h-4 w-4", color.icon)} />
                        <span>{color.name}</span>
                        {colorIndex === index && (
                          <span className="ml-auto text-xs bg-primary/20 px-1 rounded-sm py-0.5 text-muted-foreground">
                            Current
                          </span>
                        )}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  onClick={handleProjectDelete}
                  className="text-destructive focus:text-destructive"
                >
                  Delete Project
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Project Threads */}
      {isExpanded && threads.length > 0 && (
        <div className="ml-6 mt-1 text-xs space-y-1">
          {threads
            .filter(
              (thread, index, arr) =>
                arr.findIndex((t) => t.id === thread.id) === index
            )
            .map((thread, index) => (
              <SidebarMenuItem
                key={`project-${project.id}-${thread.id}-${index}`}
              >
                <ThreadListItem
                  threadData={thread}
                  isActive={isActive(thread.id)}
                  onNavigate={threadOperations.onNavigate}
                  onDelete={threadOperations.onDelete}
                  onTogglePin={threadOperations.onTogglePin}
                  onRename={threadOperations.onRename}
                  onUpdateTags={threadOperations.onUpdateTags}
                  onBranch={threadOperations.onBranch}
                />
              </SidebarMenuItem>
            ))}
        </div>
      )}

      {/* Empty State */}
      {isExpanded && threads.length === 0 && (
        <div className="ml-6 mt-1 px-2 py-1 text-xs text-muted-foreground">
          No conversations in this project
        </div>
      )}

      {/* Rename Dialog */}
      <ProjectRenameDialog
        isOpen={isRenameDialogOpen}
        onOpenChange={setIsRenameDialogOpen}
        onConfirm={handleRenameConfirm}
        currentName={project.name}
        currentDescription={project.description}
      />

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{project.name}"? This action
              cannot be undone.
              {threads.length > 0 && (
                <span className="block mt-2">
                  This project contains {threads.length} conversation
                  {threads.length > 1 ? "s" : ""}. They will be moved to the
                  main conversation list.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => handleDeleteConfirm()}>
              Delete Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProjectFolder;
