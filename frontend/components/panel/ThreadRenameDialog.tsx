/**
 * ThreadRenameDialog Component
 *
 * Used in: frontend/components/panel/ThreadMenuDropdown.tsx
 * Purpose: Provides a dialog for renaming thread titles.
 * Allows users to edit thread names with validation and confirmation.
 */

import { useState, useCallback, useEffect } from "react";
import { Edit3 } from "lucide-react";
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

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
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
        console.error("Error renaming thread:", error);
      } finally {
        setIsSubmitting(false);
      }
    },
    [newTitle, currentTitle, onConfirm, onOpenChange]
  );

  const handleCancel = useCallback(() => {
    setNewTitle(currentTitle);
    onOpenChange(false);
  }, [currentTitle, onOpenChange]);

  const isValid =
    newTitle.trim().length > 0 && newTitle.trim() !== currentTitle;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 max-h-[85vh] overflow-hidden bg-card border-border shadow-2xl">
        <DialogHeader className="px-6 py-5 border-b border-border/50 bg-gradient-to-r from-primary/5 to-primary/10">
          <DialogTitle className="text-center text-xl font-semibold text-foreground flex items-center justify-center gap-2">
            <Edit3 className="h-5 w-5 text-primary" />
            Rename Conversation
          </DialogTitle>
          <DialogDescription className="text-center text-sm text-muted-foreground max-w-sm mx-auto">
            Enter a new name for this conversation to better organize your
            chats.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="px-6 pb-6 space-y-6 overflow-y-auto max-h-[calc(85vh-200px)]">
            <div className="space-y-4 p-5 border border-border/50 rounded-xl bg-gradient-to-br from-card/50 to-muted/20 backdrop-blur-sm shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/30">
                  <Edit3 className="h-4 w-4 text-primary" />
                </div>
                <Label
                  htmlFor="thread-title"
                  className="text-base font-semibold text-foreground"
                >
                  Conversation Title
                </Label>
              </div>
              <div className="space-y-2">
                <Input
                  id="thread-title"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Enter conversation title..."
                  maxLength={100}
                  autoFocus
                  disabled={isSubmitting}
                  className="h-12 rounded-lg bg-background border-border/60 focus:border-primary/50 focus:ring-primary/20 transition-all duration-200 text-base"
                />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Choose a descriptive name for easy identification</span>
                  <span>{newTitle.length}/100</span>
                </div>
              </div>
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
              disabled={!isValid || isSubmitting}
              className="flex-1 h-11 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 shadow-sm transition-all duration-200 font-medium"
            >
              {isSubmitting ? "Renaming..." : "Rename"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
