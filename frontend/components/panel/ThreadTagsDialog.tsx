/**
 * ThreadTagsDialog Component
 *
 * Used in: frontend/components/panel/ThreadMenuDropdown.tsx
 * Purpose: Provides a dialog for managing thread tags.
 * Allows users to add, remove, and edit tags for better thread organization.
 */

import { useState, useCallback, useEffect, useRef } from "react";
import { X, Plus, Tag } from "lucide-react";
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
import { Label } from "@/frontend/components/ui/BasicComponents";

// Generate consistent colors for tags based on tag name using global CSS variables
const getTagColor = (tag: string) => {
  const colors = ["bg-primary/20 text-primary border-primary/30"];

  // Simple hash function to get consistent color for same tag
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = ((hash << 5) - hash + tag.charCodeAt(i)) & 0xffffffff;
  }
  return colors[Math.abs(hash) % colors.length];
};

interface ThreadTagsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  currentTags: string[];
  onConfirm: (tags: string[]) => void;
}

export const ThreadTagsDialog = ({
  isOpen,
  onOpenChange,
  currentTags,
  onConfirm,
}: ThreadTagsDialogProps) => {
  const [tags, setTags] = useState<string[]>(currentTags);
  const [newTag, setNewTag] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset tags when dialog opens
  useEffect(() => {
    if (isOpen) {
      setTags([...currentTags]);
      setNewTag("");
    }
  }, [isOpen, currentTags]);

  const handleAddTag = useCallback(() => {
    const trimmedTag = newTag.trim().toLowerCase();
    if (trimmedTag && !tags.includes(trimmedTag) && tags.length < 10) {
      setTags((prev) => [...prev, trimmedTag]);
      setNewTag("");
      inputRef.current?.focus();
    }
  }, [newTag, tags]);

  const handleRemoveTag = useCallback((tagToRemove: string) => {
    setTags((prev) => prev.filter((tag) => tag !== tagToRemove));
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleAddTag();
      }
    },
    [handleAddTag]
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      setIsSubmitting(true);
      try {
        await onConfirm(tags);
      } catch (error) {
        console.error("Error updating thread tags:", error);
      } finally {
        setIsSubmitting(false);
      }
    },
    [tags, onConfirm]
  );

  const handleCancel = useCallback(() => {
    setTags([...currentTags]);
    setNewTag("");
    onOpenChange(false);
  }, [currentTags, onOpenChange]);

  const hasChanges =
    JSON.stringify(tags.sort()) !== JSON.stringify([...currentTags].sort());

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 max-h-[85vh] overflow-hidden bg-card border-border shadow-2xl">
        <DialogHeader className="px-6 py-5 border-b border-border/50 bg-gradient-to-r from-primary/5 to-primary/10">
          <DialogTitle className="text-center text-xl font-semibold text-foreground flex items-center justify-center gap-2">
            <Tag className="h-5 w-5 text-primary" />
            Manage Tags
          </DialogTitle>
          <DialogDescription className="text-center text-sm text-muted-foreground max-w-sm mx-auto">
            Add tags to organize and categorize this conversation for better
            organization.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="px-6 pb-6 space-y-6 overflow-y-auto max-h-[calc(85vh-200px)]">
            {/* Current Tags */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/30">
                  <Tag className="h-4 w-4 text-primary" />
                </div>
                <Label className="text-base font-semibold text-foreground">
                  Current Tags ({tags.length})
                </Label>
              </div>
              <div className="flex flex-wrap gap-2 p-4 border border-border/50 rounded-xl bg-gradient-to-br from-card/50 to-muted/20 backdrop-blur-sm shadow-sm min-h-[60px]">
                {tags.length > 0 ? (
                  tags.map((tag) => (
                    <div
                      key={tag}
                      className={`group inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-all duration-200 hover:shadow-sm ${getTagColor(
                        tag
                      )}`}
                    >
                      <span>{tag}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4 p-0 hover:bg-black/20 dark:hover:bg-white/20 rounded-full opacity-60 group-hover:opacity-100 transition-opacity duration-200"
                        onClick={() => handleRemoveTag(tag)}
                        disabled={isSubmitting}
                        title="Remove tag"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="flex items-center justify-center w-full py-6 text-muted-foreground">
                    <div className="text-center space-y-2">
                      <p className="text-sm font-medium">No tags added yet</p>
                      <p className="text-xs">
                        Add tags below to organize this conversation
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Add New Tag */}
            <div className="space-y-4 p-5 border border-border/50 rounded-xl bg-gradient-to-br from-card/50 to-muted/20 backdrop-blur-sm shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/30">
                  <Plus className="h-4 w-4 text-primary" />
                </div>
                <Label
                  htmlFor="new-tag"
                  className="text-base font-semibold text-foreground"
                >
                  Add New Tag
                </Label>
              </div>
              <div className="flex gap-3">
                <Input
                  ref={inputRef}
                  id="new-tag"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Enter tag name..."
                  maxLength={20}
                  disabled={isSubmitting || tags.length >= 10}
                  className="h-11 rounded-lg bg-background border-border/60 focus:border-primary/50 focus:ring-primary/20 transition-all duration-200"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleAddTag}
                  disabled={
                    !newTag.trim() ||
                    tags.includes(newTag.trim().toLowerCase()) ||
                    tags.length >= 10 ||
                    isSubmitting
                  }
                  className="h-11 w-11 border-primary/30 text-primary hover:bg-primary/10 hover:border-primary/50 transition-all duration-200"
                  title="Add tag"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {tags.length >= 10 && (
                <div className="flex items-center gap-2 p-3 border border-amber-500/30 rounded-lg bg-gradient-to-r from-amber-500/10 to-amber-500/5">
                  <div className="h-2 w-2 rounded-full bg-amber-500" />
                  <p className="text-xs font-medium text-amber-700 dark:text-amber-600">
                    Maximum of 10 tags allowed.
                  </p>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="px-6 py-4 border-t border-border/50 bg-gradient-to-r from-muted/20 to-muted/10 gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
              className="flex-1 h-11 font-medium border-border hover:bg-accent hover:text-accent-foreground transition-all duration-200"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!hasChanges || isSubmitting}
              className="flex-1 h-11 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 shadow-sm transition-all duration-200 font-medium"
            >
              {isSubmitting ? "Saving..." : "Save Tags"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
