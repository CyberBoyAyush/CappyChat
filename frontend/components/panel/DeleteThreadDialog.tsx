/**
 * DeleteThreadDialog Component
 *
 * Used in: frontend/components/panel/PanelComponents.tsx
 * Purpose: Provides a confirmation dialog for deleting threads.
 * Shows warning message and handles the deletion of thread, messages, and summaries.
 */

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Trash2, AlertTriangle } from "lucide-react";

interface DeleteThreadDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  threadTitle: string;
  onConfirm: () => void;
  isDeleting?: boolean;
}

export const DeleteThreadDialog = ({
  isOpen,
  onOpenChange,
  threadTitle,
  onConfirm,
  isDeleting = false,
}: DeleteThreadDialogProps) => {
  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm border-border shadow-lg bg-background">
        <DialogHeader className="space-y-4 pb-2">
          <div className="flex items-center justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/30">
              <Trash2 className="h-5 w-5 text-primary" />
            </div>
          </div>
          <div className="text-center space-y-2">
            <DialogTitle className="text-lg font-semibold text-foreground">
              Delete Thread?
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              This will permanently remove the conversation
            </DialogDescription>
          </div>
        </DialogHeader>
        
        <div className="rounded-lg bg-gradient-to-r from-secondary/80 to-muted/60 border border-border/50 p-4 my-2">
          <div className="flex items-center gap-2 mb-1">
            <div className="h-1.5 w-1.5 bg-primary rounded-full"></div>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Thread</span>
          </div>
          <p className="text-sm font-medium text-foreground truncate">
            "{threadTitle}"
          </p>
        </div>

        <DialogFooter className="gap-3 pt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
            className="flex-1 h-10 font-medium border-border hover:bg-accent hover:text-accent-foreground transition-all duration-200"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isDeleting}
            className="flex-1 h-10 font-medium bg-gradient-to-r from-destructive to-destructive/90 hover:from-destructive/90 hover:to-destructive/80 shadow-sm transition-all duration-200 gap-2"
          >
            <Trash2 className="h-4 w-4" />
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
