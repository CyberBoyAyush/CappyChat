/**
 * ThreadRenameDialog Component
 *
 * Used in: frontend/components/panel/ThreadMenuDropdown.tsx
 * Purpose: Provides a dialog for renaming thread titles.
 * Allows users to edit thread names with validation and confirmation.
 */

import { useState, useCallback, useEffect } from 'react';
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
import { Label } from '@/frontend/components/ui/label';

interface ThreadRenameDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  currentTitle: string;
  onConfirm: (newTitle: string) => void;
}

export const ThreadRenameDialog = ({
  isOpen,
  onOpenChange,
  currentTitle,
  onConfirm,
}: ThreadRenameDialogProps) => {
  const [newTitle, setNewTitle] = useState(currentTitle);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset title when dialog opens
  useEffect(() => {
    if (isOpen) {
      setNewTitle(currentTitle);
    }
  }, [isOpen, currentTitle]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedTitle = newTitle.trim();
    if (!trimmedTitle || trimmedTitle === currentTitle) {
      onOpenChange(false);
      return;
    }

    setIsSubmitting(true);
    try {
      await onConfirm(trimmedTitle);
    } catch (error) {
      console.error('Error renaming thread:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [newTitle, currentTitle, onConfirm, onOpenChange]);

  const handleCancel = useCallback(() => {
    setNewTitle(currentTitle);
    onOpenChange(false);
  }, [currentTitle, onOpenChange]);

  const isValid = newTitle.trim().length > 0 && newTitle.trim() !== currentTitle;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Rename Conversation</DialogTitle>
          <DialogDescription>
            Enter a new name for this conversation.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="thread-title">Title</Label>
              <Input
                id="thread-title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Enter conversation title..."
                maxLength={100}
                autoFocus
                disabled={isSubmitting}
              />
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
              disabled={!isValid || isSubmitting}
            >
              {isSubmitting ? 'Renaming...' : 'Rename'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
