/**
 * ThreadTagsDialog Component
 *
 * Used in: frontend/components/panel/ThreadMenuDropdown.tsx
 * Purpose: Provides a dialog for managing thread tags.
 * Allows users to add, remove, and edit tags for better thread organization.
 */

import { useState, useCallback, useEffect, useRef } from "react";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { X, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
} from "@/frontend/components/ui/dialog";
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";

const getTagColor = (tag: string) => {
  const colors = ["bg-primary/20 text-primary border-primary/30"];
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
      <DialogContent className="sm:max-w-md gap-0 bg-card border-border">
        <VisuallyHidden>
          <DialogTitle>Manage tags</DialogTitle>
        </VisuallyHidden>

        <div className="p-3 md:p-5">
          <h2 className="text-xl md:text-2xl font-bold text-foreground mb-4">
            Manage tags
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-3">
              <div className="text-sm font-medium text-foreground">
                Current tags ({tags.length}/10)
              </div>
              <div className="flex flex-wrap gap-2 p-3 border border-border/50 rounded-lg bg-background/50 min-h-12">
                {tags.length > 0 ? (
                  tags.map((tag) => (
                    <div
                      key={tag}
                      className={`group inline-flex items-center gap-2 px-2 py-1 rounded-md text-xs font-medium border transition-all ${getTagColor(
                        tag
                      )}`}
                    >
                      <span>{tag}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        disabled={isSubmitting}
                        className="p-0 hover:opacity-70 transition-opacity"
                        title="Remove tag"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="w-full text-center py-2 text-xs text-muted-foreground">
                    No tags added
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium text-foreground">
                Add new tag
              </div>
              <div className="flex gap-2">
                <Input
                  ref={inputRef}
                  id="new-tag"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Enter tag name..."
                  maxLength={20}
                  disabled={isSubmitting || tags.length >= 10}
                  className="h-10 rounded-lg bg-background border-1 border-primary/40 focus:ring-primary/50 focus:ring-1 text-sm"
                />
                <Button
                  type="button"
                  onClick={handleAddTag}
                  disabled={
                    !newTag.trim() ||
                    tags.includes(newTag.trim().toLowerCase()) ||
                    tags.length >= 10 ||
                    isSubmitting
                  }
                  className="h-10 px-3 bg-primary hover:bg-primary/80  font-medium"
                  title="Add tag"
                >
                  <Plus className="h-4 w-4 bg-primary" />
                </Button>
              </div>
              {tags.length >= 10 && (
                <div className="text-xs text-amber-600 dark:text-amber-500">
                  Maximum of 10 tags allowed.
                </div>
              )}
            </div>

            <DialogFooter className="flex gap-3 pt-2">
              <Button
                type="button"
                onClick={handleCancel}
                disabled={isSubmitting}
                className="flex-1 h-9 md:h-11 font-medium bg-border/45 border-border/30 text-foreground hover:bg-border/60"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!hasChanges || isSubmitting}
                className="flex-1 h-9 md:h-11 bg-primary hover:bg-primary/80  font-medium"
              >
                <span className="text-background">
                  {" "}
                  {isSubmitting ? "Saving..." : "Save"}
                </span>
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};
