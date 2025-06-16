/**
 * Project Rename Dialog Component
 *
 * Purpose: Dialog for renaming existing projects with name and description editing.
 * Provides form validation and project update functionality.
 */

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/frontend/components/ui/dialog";
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import { Textarea } from "@/frontend/components/ui/textarea";
import { Label } from "@/frontend/components/ui/label";

interface ProjectRenameDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (name: string, description?: string) => Promise<void>;
  currentName: string;
  currentDescription?: string;
}

export const ProjectRenameDialog: React.FC<ProjectRenameDialogProps> = ({
  isOpen,
  onOpenChange,
  onConfirm,
  currentName,
  currentDescription,
}) => {
  const [name, setName] = useState(currentName);
  const [description, setDescription] = useState(currentDescription || "");
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState("");

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      setName(currentName);
      setDescription(currentDescription || "");
      setError("");
    }
  }, [isOpen, currentName, currentDescription]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError("Project name is required");
      return;
    }

    setIsUpdating(true);
    setError("");

    try {
      await onConfirm(name.trim(), description.trim() || undefined);
    } catch (error) {
      console.error("Failed to update project:", error);
      setError("Failed to update project. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancel = () => {
    setName(currentName);
    setDescription(currentDescription || "");
    setError("");
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[625px] p-5 max-h-[85vh] overflow-y-auto">
        <DialogHeader className="pb-2">
          <DialogTitle>Rename Project</DialogTitle>
          <DialogDescription>
            Update the project name and description.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="project-name">Project Name</Label>
            <Input
              id="project-name"
              placeholder="Enter project name..."
              value={name}
              className="bg-border/50 rounded-md py-1 w-full"
              onChange={(e) => setName(e.target.value)}
              disabled={isUpdating}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="project-description">Description (Optional)</Label>
            <Textarea
              id="project-description"
              placeholder="Enter project description..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isUpdating}
              rows={3}
              className="min-h-[100px] max-h-[180px] bg-border/50 resize-none w-full"
            />
          </div>

          {error && <div className="text-sm text-destructive">{error}</div>}

          <DialogFooter className="mt-6 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isUpdating}
              className="flex-1 sm:flex-none"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isUpdating || !name.trim()}
              className="flex-1 sm:flex-none"
            >
              {isUpdating ? "Updating..." : "Update Project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectRenameDialog;
