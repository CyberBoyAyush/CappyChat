/**
 * ThreadTagsDialog Component
 *
 * Used in: frontend/components/panel/ThreadMenuDropdown.tsx
 * Purpose: Provides a dialog for managing thread tags.
 * Allows users to add, remove, and edit tags for better thread organization.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { X, Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/frontend/components/ui/dialog';
import { Button } from '@/frontend/components/ui/button';
import { Input } from '@/frontend/components/ui/input';
import { Badge } from '@/frontend/components/ui/BasicComponents';
import { Label } from '@/frontend/components/ui/label';

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
  const [newTag, setNewTag] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset tags when dialog opens
  useEffect(() => {
    if (isOpen) {
      setTags([...currentTags]);
      setNewTag('');
    }
  }, [isOpen, currentTags]);

  const handleAddTag = useCallback(() => {
    const trimmedTag = newTag.trim().toLowerCase();
    if (trimmedTag && !tags.includes(trimmedTag) && tags.length < 10) {
      setTags(prev => [...prev, trimmedTag]);
      setNewTag('');
      inputRef.current?.focus();
    }
  }, [newTag, tags]);

  const handleRemoveTag = useCallback((tagToRemove: string) => {
    setTags(prev => prev.filter(tag => tag !== tagToRemove));
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  }, [handleAddTag]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsSubmitting(true);
    try {
      await onConfirm(tags);
    } catch (error) {
      console.error('Error updating thread tags:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [tags, onConfirm]);

  const handleCancel = useCallback(() => {
    setTags([...currentTags]);
    setNewTag('');
    onOpenChange(false);
  }, [currentTags, onOpenChange]);

  const hasChanges = JSON.stringify(tags.sort()) !== JSON.stringify([...currentTags].sort());

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Tags</DialogTitle>
          <DialogDescription>
            Add tags to organize and categorize this conversation.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Current Tags */}
            {tags.length > 0 && (
              <div className="grid gap-2">
                <Label>Current Tags</Label>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="flex items-center gap-1 px-2 py-1"
                    >
                      {tag}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-3 w-3 p-0 hover:bg-destructive hover:text-destructive-foreground"
                        onClick={() => handleRemoveTag(tag)}
                        disabled={isSubmitting}
                      >
                        <X className="h-2 w-2" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Add New Tag */}
            <div className="grid gap-2">
              <Label htmlFor="new-tag">Add New Tag</Label>
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
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleAddTag}
                  disabled={!newTag.trim() || tags.includes(newTag.trim().toLowerCase()) || tags.length >= 10 || isSubmitting}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {tags.length >= 10 && (
                <p className="text-xs text-muted-foreground">
                  Maximum of 10 tags allowed.
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!hasChanges || isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Save Tags'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
