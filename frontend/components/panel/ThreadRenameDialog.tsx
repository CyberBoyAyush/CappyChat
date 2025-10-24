import { useState, useCallback, useEffect } from "react";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
} from "@/frontend/components/ui/dialog";
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";

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
      <DialogContent className="sm:max-w-md gap-0 bg-card border-border">
        <VisuallyHidden>
          <DialogTitle>Rename chat</DialogTitle>
        </VisuallyHidden>

        <div className="p-3 md:p-5">
          <h2 className="text-xl md:text-2xl font-bold text-foreground mb-3">
            Rename chat
          </h2>

          <form onSubmit={handleSubmit} className="space-y-3">
            <Input
              id="thread-title"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="File generation in cappychat"
              maxLength={100}
              autoFocus
              disabled={isSubmitting}
              className="h-12 rounded-lg bg-background border-1 border-primary/40 focus:ring-primary/50 focus:ring-1 text-base"
            />

            <DialogFooter className="flex gap-3 pt-2">
              <Button
                type="button"
                onClick={handleCancel}
                disabled={isSubmitting}
                className="flex-1 h-9 md:h-11  font-medium bg-border/45 border-border/30 text-foreground hover:bg-border/60"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!isValid || isSubmitting}
                className="flex-1 h-9 md:h-11 bg-primary hover:bg-primary/80 text-black  font-medium"
              >
                {isSubmitting ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};
