/**
 * Project Create Dialog Component
 *
 * Purpose: Dialog for creating new projects with name and optional description.
 * Provides form validation and project creation functionality.
 */

import React, { useState } from "react";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
} from "@/frontend/components/ui/dialog";
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import { Textarea } from "@/frontend/components/ui/textarea";

interface ProjectCreateDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateProject: (
    name: string,
    description?: string,
    prompt?: string
  ) => Promise<string>;
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
      <DialogContent className="sm:max-w-md gap-0 bg-card border-border max-h-[85vh] overflow-y-auto">
        <VisuallyHidden>
          <DialogTitle>Create project</DialogTitle>
        </VisuallyHidden>

        <div className="p-3 md:p-5">
          <h2 className="text-xl md:text-2xl font-bold text-foreground mb-2">
            Create project
          </h2>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Project name
              </label>
              <Input
                id="project-name"
                placeholder="My awesome project"
                className="h-12 !rounded-lg !border-1 !border-primary/40 bg-background focus:ring-primary/50 focus:ring-1 text-base"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isCreating}
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Description
              </label>
              <Textarea
                id="project-description"
                placeholder="What is this project about?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isCreating}
                rows={2}
                variant="field"
                className="min-h-[80px] max-h-[150px] resize-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Custom prompt
              </label>
              <Textarea
                id="project-prompt"
                placeholder="Custom instructions for AI when working on this project..."
                value={prompt}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value.length <= 500) {
                    setPrompt(value);
                  }
                }}
                disabled={isCreating}
                rows={2}
                variant="field"
                className="min-h-[80px] max-h-[150px] resize-none"
              />
              <div className="text-xs text-muted-foreground">
                {prompt.length}/500
              </div>
            </div>

            {error && <div className="text-sm text-destructive">{error}</div>}

            <DialogFooter className="flex gap-3 pt-2">
              <Button
                type="button"
                onClick={handleCancel}
                disabled={isCreating}
                className="flex-1 h-9 md:h-11 font-medium bg-border/45 border-border/30 text-foreground hover:bg-border/60"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isCreating || !name.trim()}
                className="flex-1 h-9 md:h-11 bg-primary hover:bg-primary/80 text-black font-medium"
              >
                {isCreating ? "Creating..." : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectCreateDialog;
