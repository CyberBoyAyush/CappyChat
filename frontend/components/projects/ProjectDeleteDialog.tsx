/**
 * Project Delete Dialog Component
 *
 * Purpose: Confirmation dialog for deleting projects with options for thread reassignment.
 * Provides safety confirmation and thread management options.
 */

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/frontend/components/ui/dialog';
import { Button } from '@/frontend/components/ui/button';
import { Label } from '@/frontend/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/frontend/components/ui/dropdown-menu';
import { ProjectData } from '@/frontend/hooks/useProjectManager';
import { AlertTriangle, ChevronDown } from 'lucide-react';

interface ProjectDeleteDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reassignToProjectId?: string) => Promise<void>;
  project: ProjectData;
  otherProjects: ProjectData[];
  threadCount: number;
}

export const ProjectDeleteDialog: React.FC<ProjectDeleteDialogProps> = ({
  isOpen,
  onOpenChange,
  onConfirm,
  project,
  otherProjects,
  threadCount,
}) => {
  const [reassignToProjectId, setReassignToProjectId] = useState<string>('');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSubmit = async () => {
    setIsDeleting(true);

    try {
      await onConfirm(reassignToProjectId || undefined);
      setReassignToProjectId('');
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to delete project:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancel = () => {
    setReassignToProjectId('');
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Delete Project
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete "{project.name}"? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {threadCount > 0 && (
            <div className="space-y-3">
              <div className="text-sm text-muted-foreground">
                This project contains {threadCount} conversation{threadCount > 1 ? 's' : ''}. 
                What would you like to do with them?
              </div>

              {otherProjects.length > 0 && (
                <div className="space-y-2">
                  <Label>Move conversations to:</Label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="w-full justify-between">
                        {reassignToProjectId 
                          ? otherProjects.find(p => p.id === reassignToProjectId)?.name 
                          : "Select a project or leave unassigned"
                        }
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-full">
                      <DropdownMenuItem onClick={() => setReassignToProjectId('')}>
                        Leave unassigned
                      </DropdownMenuItem>
                      {otherProjects.map((proj) => (
                        <DropdownMenuItem 
                          key={proj.id} 
                          onClick={() => setReassignToProjectId(proj.id)}
                        >
                          {proj.name}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}

              {otherProjects.length === 0 && (
                <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                  All conversations will be moved to the main conversation list.
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete Project'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectDeleteDialog;
