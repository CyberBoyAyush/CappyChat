/**
 * Project Members Dialog Component
 *
 * Purpose: Dialog for managing project members including adding and removing members.
 * Provides member list, invitation functionality, and role indicators.
 */

import React, { useState, useEffect } from "react";
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
import { Label } from "@/frontend/components/ui/label";
import { Badge } from "@/frontend/components/ui/badge";
import { 
  Users, 
  UserPlus, 
  UserMinus, 
  Crown, 
  Mail,
  Loader2,
  AlertCircle
} from "lucide-react";
import { HybridDB } from "@/lib/hybridDB";
import { useAuth } from "@/frontend/contexts/AuthContext";

interface ProjectMember {
  id: string;
  name: string;
  email: string;
  isOwner?: boolean;
}

interface ProjectMembersDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  projectName: string;
  isOwner: boolean;
}

export const ProjectMembersDialog: React.FC<ProjectMembersDialogProps> = ({
  isOpen,
  onOpenChange,
  projectId,
  projectName,
  isOwner,
}) => {
  const { user } = useAuth();
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Load members when dialog opens
  useEffect(() => {
    if (isOpen && projectId) {
      loadMembers();
    }
  }, [isOpen, projectId]);

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      setNewMemberEmail("");
      setError("");
      setSuccess("");
    }
  }, [isOpen]);

  const loadMembers = async () => {
    setIsLoading(true);
    setError("");
    
    try {
      const memberList = await HybridDB.getProjectMembers(projectId);
      setMembers(memberList);
    } catch (error: any) {
      console.error("Failed to load members:", error);
      setError("Failed to load project members");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMemberEmail.trim()) {
      setError("Email address is required");
      return;
    }

    if (!isOwner) {
      setError("Only project owners can add members");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newMemberEmail.trim())) {
      setError("Please enter a valid email address");
      return;
    }

    // Check if trying to add self (though backend should handle this)
    if (newMemberEmail.trim().toLowerCase() === user?.email?.toLowerCase()) {
      setError("You cannot add yourself as a member");
      return;
    }

    setIsAddingMember(true);
    setError("");
    setSuccess("");

    try {
      await HybridDB.addProjectMember(projectId, newMemberEmail.trim());
      setNewMemberEmail("");
      setSuccess("Member added successfully!");
      await loadMembers(); // Refresh member list
    } catch (error: any) {
      console.error("Failed to add member:", error);

      // Provide user-friendly error messages
      let errorMessage = "Failed to add member";

      if (error.message?.includes('not found')) {
        errorMessage = "No user found with this email address. The user must have an account to be added.";
      } else if (error.message?.includes('already a member')) {
        errorMessage = "This user is already a member of the project";
      } else if (error.message?.includes('not the owner')) {
        errorMessage = "Only project owners can add members";
      } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
        errorMessage = "Network error. Please check your connection and try again.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      setError(errorMessage);
    } finally {
      setIsAddingMember(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!isOwner) {
      setError("Only project owners can remove members");
      return;
    }

    // Prevent removing self (project owner)
    if (memberId === user?.$id) {
      setError("You cannot remove yourself from the project");
      return;
    }

    // Simple confirmation
    if (!confirm("Are you sure you want to remove this member from the project?")) {
      return;
    }

    setRemovingMemberId(memberId);
    setError("");
    setSuccess("");

    try {
      await HybridDB.removeProjectMember(projectId, memberId);
      setSuccess("Member removed successfully!");
      await loadMembers(); // Refresh member list
    } catch (error: any) {
      console.error("Failed to remove member:", error);

      // Provide user-friendly error messages
      let errorMessage = "Failed to remove member";

      if (error.message?.includes('not the owner')) {
        errorMessage = "Only project owners can remove members";
      } else if (error.message?.includes('not found')) {
        errorMessage = "Member not found or already removed";
      } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
        errorMessage = "Network error. Please check your connection and try again.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      setError(errorMessage);
    } finally {
      setRemovingMemberId(null);
    }
  };

  const handleClose = () => {
    setNewMemberEmail("");
    setError("");
    setSuccess("");
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[625px] p-5 max-h-[85vh] overflow-y-auto">
        <DialogHeader className="pb-2">
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Manage Members
          </DialogTitle>
          <DialogDescription>
            Manage members for "{projectName}". Members can view and create threads within this project.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Add Member Section - Only for owners */}
          {isOwner && (
            <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
              <div className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                <Label className="text-sm font-medium">Add New Member</Label>
              </div>
              
              <form onSubmit={handleAddMember} className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="member-email" className="text-xs">Email Address</Label>
                  <Input
                    id="member-email"
                    type="email"
                    placeholder="Enter member's email address..."
                    value={newMemberEmail}
                    onChange={(e) => setNewMemberEmail(e.target.value)}
                    disabled={isAddingMember}
                    className="bg-background"
                  />
                </div>
                
                <Button
                  type="submit"
                  disabled={isAddingMember || !newMemberEmail.trim()}
                  className="w-full"
                  size="sm"
                >
                  {isAddingMember ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Adding Member...
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add Member
                    </>
                  )}
                </Button>
              </form>
            </div>
          )}

          {/* Members List */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <Label className="text-sm font-medium">
                Project Members ({members.length}{members.length === 1 ? ' member' : ' members'})
              </Label>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2 text-sm text-muted-foreground">Loading members...</span>
              </div>
            ) : members.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No additional members in this project</p>
                {isOwner && (
                  <p className="text-xs mt-1">Add members using the form above</p>
                )}
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 border rounded-lg bg-background"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{member.name}</p>
                          <p className="text-xs text-muted-foreground">{member.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {member.isOwner && (
                          <Badge variant="default" className="text-xs">
                            <Crown className="h-3 w-3 mr-1" />
                            Owner
                          </Badge>
                        )}
                        {member.id === user?.$id && !member.isOwner && (
                          <Badge variant="secondary" className="text-xs">
                            You
                          </Badge>
                        )}
                      </div>
                    </div>

                    {isOwner && !member.isOwner && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveMember(member.id)}
                        disabled={removingMemberId === member.id}
                        className="text-destructive hover:text-destructive"
                        title="Remove member"
                      >
                        {removingMemberId === member.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <UserMinus className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Status Messages */}
          {error && (
            <div className="flex items-center gap-2 p-3 border border-destructive/20 rounded-lg bg-destructive/5">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <span className="text-sm text-destructive">{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 p-3 border border-green-500/20 rounded-lg bg-green-500/5">
              <div className="h-4 w-4 rounded-full bg-green-500 flex items-center justify-center">
                <div className="h-2 w-2 rounded-full bg-white" />
              </div>
              <span className="text-sm text-green-700">{success}</span>
            </div>
          )}
        </div>

        <DialogFooter className="mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            className="flex-1 sm:flex-none"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectMembersDialog;
