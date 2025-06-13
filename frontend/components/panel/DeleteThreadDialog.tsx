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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <DialogTitle>Delete Thread</DialogTitle>
              <DialogDescription className="text-left">
                Are you sure you want to delete this thread?
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <div className="rounded-lg bg-muted/50 p-3">
          <p className="text-sm font-medium text-foreground/90">
            Thread: "{threadTitle}"
          </p>
        </div>

        <div className="space-y-2 text-sm text-muted-foreground">
          <p>This action will permanently delete:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>The thread and its title</li>
            <li>All messages in this thread</li>
            <li>All message summaries for this thread</li>
          </ul>
          <p className="font-medium text-destructive">
            This action cannot be undone.
          </p>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isDeleting}
            className="gap-2"
          >
            <Trash2 className="h-4 w-4" />
            {isDeleting ? "Deleting..." : "Delete Thread"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
