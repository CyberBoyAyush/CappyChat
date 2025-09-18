/**
 * Project Rename Dialog Component
 *
 * Purpose: Dialog for renaming existing projects with name and description editing.
 * Provides form validation and project update functionality.
 */

import React, { useState, useEffect } from "react";
import { Edit3, AlertCircle } from "lucide-react";
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
      <DialogContent className="sm:max-w-[600px] p-0 max-h-[85vh] overflow-hidden bg-card border-border shadow-2xl">
        <DialogHeader className="px-6 py-4 border-b border-border/50 bg-gradient-to-r from-primary/5 to-primary/10">
          <DialogTitle className="text-center text-xl font-semibold text-foreground flex items-center justify-center gap-2">
            <Edit3 className="h-5 w-5 text-primary" />
            Rename Project
          </DialogTitle>
          <DialogDescription className="text-center text-sm text-muted-foreground max-w-md mx-auto">
            Update the project name and description to better organize your
            work.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="px-6 pb-6 space-y-6 overflow-y-auto max-h-[calc(85vh-200px)]">
            {/* Project Name Section */}
            <div className="space-y-4 p-5 border border-border/50 rounded-xl bg-gradient-to-br from-card/50 to-muted/20 backdrop-blur-sm shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/30">
                  <Edit3 className="h-4 w-4 text-primary" />
                </div>
                <Label
                  htmlFor="project-name"
                  className="text-base font-semibold text-foreground"
                >
                  Project Name
                </Label>
              </div>
              <div className="space-y-2">
                <Input
                  id="project-name"
                  placeholder="Enter project name..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isUpdating}
                  autoFocus
                  className="h-11 rounded-lg bg-background border-border/60 border focus:border-primary/50 focus:ring-primary/20 transition-all duration-200"
                />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Choose a clear and descriptive name</span>
                  <span>{name.length} characters</span>
                </div>
              </div>
            </div>

            {/* Project Description Section */}
            <div className="space-y-4 p-5 border border-border/50 rounded-xl bg-gradient-to-br from-card/50 to-muted/20 backdrop-blur-sm shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/30">
                  <Edit3 className="h-4 w-4 text-primary" />
                </div>
                <Label
                  htmlFor="project-description"
                  className="text-base font-semibold text-foreground"
                >
                  Description{" "}
                  <span className="text-muted-foreground font-normal">
                    (Optional)
                  </span>
                </Label>
              </div>
              <div className="space-y-2">
                <Textarea
                  id="project-description"
                  placeholder="Enter project description..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={isUpdating}
                  rows={4}
                  className="min-h-[120px] max-h-[200px] bg-background border-border/60 focus:border-primary/50  transition-all duration-200 resize-none"
                />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Provide additional context about your project</span>
                  <span>{description.length} characters</span>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-3 p-4 border border-destructive/30 rounded-xl bg-gradient-to-r from-destructive/10 to-destructive/5 backdrop-blur-sm shadow-sm">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-destructive/20 border border-destructive/30">
                  <AlertCircle className="h-4 w-4 text-destructive" />
                </div>
                <span className="text-sm font-medium text-destructive">
                  {error}
                </span>
              </div>
            )}
          </div>

          <DialogFooter className="px-6 py-4 border-t border-border/50 bg-gradient-to-r from-muted/20 to-muted/10 gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isUpdating}
              className="flex-1 h-11 font-medium border-border hover:bg-accent hover:text-accent-foreground transition-all duration-200"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isUpdating || !name.trim()}
              className="flex-1 h-11 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 shadow-sm transition-all duration-200 font-medium"
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
