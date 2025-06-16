/**
 * Project Prompt Dialog Component
 *
 * Purpose: Dialog for editing project custom prompts.
 * Provides form validation and character limit enforcement.
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
import { Textarea } from "@/frontend/components/ui/textarea";
import { Label } from "@/frontend/components/ui/label";
import { ProjectData } from "@/frontend/hooks/useProjectManager";

interface ProjectPromptDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  project: ProjectData | null;
  onUpdateProject: (projectId: string, name: string, description?: string, prompt?: string) => Promise<void>;
}

export const ProjectPromptDialog: React.FC<ProjectPromptDialogProps> = ({
  isOpen,
  onOpenChange,
  project,
  onUpdateProject,
}) => {
  const [prompt, setPrompt] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState("");

  // Initialize prompt when project changes
  useEffect(() => {
    if (project) {
      setPrompt(project.prompt || "");
    }
  }, [project]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!project) {
      setError("No project selected");
      return;
    }

    setIsUpdating(true);
    setError("");

    try {
      await onUpdateProject(
        project.id,
        project.name,
        project.description,
        prompt.trim() || undefined
      );

      onOpenChange(false);
    } catch (error) {
      console.error("Failed to update project prompt:", error);
      setError("Failed to update project prompt. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancel = () => {
    if (project) {
      setPrompt(project.prompt || "");
    }
    setError("");
    onOpenChange(false);
  };

  const handleClearPrompt = () => {
    setPrompt("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[625px] p-5 max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Project Prompt</DialogTitle>
          <DialogDescription>
            Customize AI instructions for "{project?.name}" project. This prompt will be used for all conversations in this project.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="project-prompt">Custom Prompt</Label>
            <Textarea
              id="project-prompt"
              placeholder="Enter custom instructions for AI when working on this project..."
              value={prompt}
              onChange={(e) => {
                const value = e.target.value;
                if (value.length <= 500) {
                  setPrompt(value);
                }
              }}
              disabled={isUpdating}
              rows={6}
              className="min-h-[150px] max-h-[250px] bg-border/50 resize-none w-full"
            />
            <div className="flex justify-between items-center">
              <p className="text-xs text-muted-foreground">
                Custom instructions for AI responses in this project ({prompt.length}/500 characters)
              </p>
              {prompt && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleClearPrompt}
                  disabled={isUpdating}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Clear
                </Button>
              )}
            </div>
          </div>

          {error && <div className="text-sm text-destructive">{error}</div>}

          <DialogFooter>
            <Button
              size="default"
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button
              size="default"
              type="submit"
              disabled={isUpdating}
            >
              {isUpdating ? "Updating..." : "Update Prompt"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectPromptDialog;
