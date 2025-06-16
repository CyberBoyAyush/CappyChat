/**
 * Project Create Dialog Component
 *
 * Purpose: Dialog for creating new projects with name and optional description.
 * Provides form validation and project creation functionality.
 */

import React, { useState } from "react";
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

interface ProjectCreateDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateProject: (name: string, description?: string, prompt?: string) => Promise<string>;
}

export const ProjectCreateDialog: React.FC<ProjectCreateDialogProps> = ({
  isOpen,
  onOpenChange,
  onCreateProject,
}) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [prompt, setPrompt] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError("Project name is required");
      return;
    }

    setIsCreating(true);
    setError("");

    try {
      await onCreateProject(
        name.trim(),
        description.trim() || undefined,
        prompt.trim() || undefined
      );

      // Reset form and close dialog
      setName("");
      setDescription("");
      setPrompt("");
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to create project:", error);
      setError("Failed to create project. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleCancel = () => {
    setName("");
    setDescription("");
    setPrompt("");
    setError("");
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[625px] p-5 max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>
            Create a new project to organize your conversations.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="project-name">Project Name</Label>
            <Input
              id="project-name"
              placeholder="Enter project name..."
              className="bg-border/20 rounded-md py-1 w-full"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isCreating}
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
              disabled={isCreating}
              rows={3}
              className="min-h-[100px] max-h-[180px] bg-border/50 resize-none w-full"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="project-prompt">Custom Prompt (Optional)</Label>
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
              disabled={isCreating}
              rows={3}
              className="min-h-[100px] max-h-[180px] bg-border/50 resize-none w-full"
            />
            <p className="text-xs text-muted-foreground">
              Custom instructions for AI responses in this project ({prompt.length}/500 characters)
            </p>
          </div>

          {error && <div className="text-sm text-destructive">{error}</div>}

          <DialogFooter>
            <Button
              size="default"
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button
              size="default"
              type="submit"
              disabled={isCreating || !name.trim()}
            >
              {isCreating ? "Creating..." : "Create Project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectCreateDialog;
