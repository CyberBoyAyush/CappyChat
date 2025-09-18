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
  AlertCircle,
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

      if (error.message?.includes("not found")) {
        errorMessage =
          "No user found with this email address. The user must have an account to be added.";
      } else if (error.message?.includes("already a member")) {
        errorMessage = "This user is already a member of the project";
      } else if (error.message?.includes("not the owner")) {
        errorMessage = "Only project owners can add members";
      } else if (
        error.message?.includes("network") ||
        error.message?.includes("fetch")
      ) {
        errorMessage =
          "Network error. Please check your connection and try again.";
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
    if (
      !confirm("Are you sure you want to remove this member from the project?")
    ) {
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

      if (error.message?.includes("not the owner")) {
        errorMessage = "Only project owners can remove members";
      } else if (error.message?.includes("not found")) {
        errorMessage = "Member not found or already removed";
      } else if (
        error.message?.includes("network") ||
        error.message?.includes("fetch")
      ) {
        errorMessage =
          "Network error. Please check your connection and try again.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      setError(errorMessage);
    } finally {
      setRemovingMemberId(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] p-0 max-h-[90vh] overflow-hidden bg-card border-border shadow-2xl">
        <DialogHeader className="px-6 py-5 border-b border-border/50 bg-gradient-to-r from-primary/5 to-primary/10">
          <DialogTitle className="text-center text-xl font-semibold text-foreground">
            Manage Members
          </DialogTitle>
          <DialogDescription className="text-center text-sm text-muted-foreground max-w-md mx-auto">
            Manage members for{" "}
            <span className="font-medium text-foreground">"{projectName}"</span>
            . Members can view and create threads within this project.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-6 space-y-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Add Member Section - Only for owners */}
          {isOwner && (
            <div className="space-y-4 p-5 border border-border/50 rounded-xl bg-gradient-to-br from-card/50 to-muted/20 backdrop-blur-sm shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/30">
                  <UserPlus className="h-4 w-4 text-primary" />
                </div>
                <Label className="text-base font-semibold text-foreground">
                  Add New Member
                </Label>
              </div>

              <form onSubmit={handleAddMember} className="space-y-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="member-email"
                    className="text-sm font-medium text-foreground"
                  >
                    Email Address
                  </Label>
                  <Input
                    id="member-email"
                    type="email"
                    placeholder="Enter member's email address..."
                    value={newMemberEmail}
                    onChange={(e) => setNewMemberEmail(e.target.value)}
                    disabled={isAddingMember}
                    className="h-11 rounded-lg bg-background border-border/60 focus:border-primary/50 focus:ring-primary/20 transition-all duration-200"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isAddingMember || !newMemberEmail.trim()}
                  className="w-full h-11 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 shadow-sm transition-all duration-200 font-medium"
                  size="default"
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
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/30">
                <Users className="h-4 w-4 text-primary" />
              </div>
              <Label className="text-base font-semibold text-foreground">
                Project Members ({members.length}
                {members.length === 1 ? " member" : " members"})
              </Label>
            </div>

            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/30">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
                <span className="text-sm text-muted-foreground font-medium">
                  Loading members...
                </span>
              </div>
            ) : members.length === 0 ? (
              <div className="text-center py-12 space-y-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-muted/50 to-muted/30 border border-border/50 mx-auto">
                  <Users className="h-8 w-8 text-muted-foreground/60" />
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">
                    No additional members in this project
                  </p>
                  {isOwner && (
                    <p className="text-xs text-muted-foreground">
                      Add members using the form above
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="group flex items-center justify-between p-4 border border-border/50 rounded-xl bg-gradient-to-br from-card/50 to-background/50 backdrop-blur-sm shadow-sm hover:shadow-md hover:border-border/70 transition-all duration-200"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/30">
                        <Mail className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-semibold text-foreground truncate">
                            {member.name}
                          </p>
                          <div className="flex items-center gap-2">
                            {member.isOwner && (
                              <Badge
                                variant="default"
                                className="text-xs px-2 py-1 bg-gradient-to-r from-primary to-primary/90 border-0"
                              >
                                <Crown className="h-3 w-3 mr-1" />
                                Owner
                              </Badge>
                            )}
                            {member.id === user?.$id && !member.isOwner && (
                              <Badge
                                variant="secondary"
                                className="text-xs px-2 py-1 bg-gradient-to-r from-muted to-muted/80 border border-border/50"
                              >
                                You
                              </Badge>
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {member.email}
                        </p>
                      </div>
                    </div>

                    {isOwner && !member.isOwner && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveMember(member.id)}
                        disabled={removingMemberId === member.id}
                        className="h-9 w-9 p-0 border-destructive/30 text-destructive hover:bg-destructive/10 hover:border-destructive/50 transition-all duration-200 opacity-0 group-hover:opacity-100"
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
            <div className="flex items-center gap-3 p-4 border border-destructive/30 rounded-xl bg-gradient-to-r from-destructive/10 to-destructive/5 backdrop-blur-sm shadow-sm">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-destructive/20 border border-destructive/30">
                <AlertCircle className="h-4 w-4 text-destructive" />
              </div>
              <span className="text-sm font-medium text-destructive">
                {error}
              </span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-3 p-4 border border-green-500/30 rounded-xl bg-gradient-to-r from-green-500/10 to-green-500/5 backdrop-blur-sm shadow-sm">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500/20 border border-green-500/30">
                <div className="h-4 w-4 rounded-full bg-green-500 flex items-center justify-center">
                  <div className="h-2 w-2 rounded-full bg-white" />
                </div>
              </div>
              <span className="text-sm font-medium text-green-700 dark:text-green-600">
                {success}
              </span>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectMembersDialog;
