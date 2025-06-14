/**
 * Profile Page Component
 *
 * Used in: frontend/ChatAppRouter.tsx (as "/profile" route)
 * Purpose: Displays and manages user profile information.
 * Allows users to view and update profile settings.
 */

import React, { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "@/frontend/contexts/AuthContext";
import { ThemeToggleButton } from "@/frontend/components/ui/ThemeComponents";
import {
  ArrowLeft,
  User,
  Mail,
  Calendar,
  Edit2,
  LogOut,
  Save,
  X,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import { format } from "date-fns";

export default function ProfilePage() {
  const { user, updateProfile, logout } = useAuth();
  const [searchParams] = useSearchParams();
  const chatId = searchParams.get("from");

  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [notification, setNotification] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user?.name) {
      setDisplayName(user.name);
    }
  }, [user]);

  const handleUpdateProfile = async () => {
    if (!displayName.trim()) {
      setNotification({
        type: "error",
        message: "Name cannot be empty",
      });
      return;
    }

    setIsLoading(true);
    try {
      await updateProfile(displayName.trim());
      setNotification({
        type: "success",
        message: "Profile updated successfully",
      });
      setIsEditing(false);

      // Clear notification after 3 seconds
      setTimeout(() => {
        setNotification(null);
      }, 3000);
    } catch (error) {
      setNotification({
        type: "error",
        message: error.message || "Failed to update profile",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setDisplayName(user?.name || "");
    setIsEditing(false);
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  // Format registration date if available
  const formattedDate = user?.registration
    ? format(new Date(user.registration), "MMMM d, yyyy")
    : "N/A";

  // Get user initials for avatar
  const getInitials = (name) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="w-full px-4 sm:px-6 lg:px-14 flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              to={chatId ? `/chat/${chatId}` : "/chat"}
              className="flex items-center justify-center h-9 w-9 rounded-full border border-border bg-background hover:bg-muted transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="sr-only">Back</span>
            </Link>
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              <h1 className="text-lg font-semibold">Profile</h1>
            </div>
          </div>
          <ThemeToggleButton variant="inline" />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="space-y-8">
          {/* Notification */}
          {notification && (
            <div
              className={`p-4 rounded-lg border flex items-center space-x-3 ${
                notification.type === "error"
                  ? "bg-destructive/10 text-destructive border-destructive/30"
                  : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
              }`}
            >
              {notification.type === "error" ? (
                <AlertTriangle className="h-5 w-5 flex-shrink-0" />
              ) : (
                <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
              )}
              <span>{notification.message}</span>
            </div>
          )}

          {/* Profile Card */}
          <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
            {/* Profile Header */}
            <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 sm:p-8 flex flex-col sm:flex-row gap-6 items-center sm:items-start">
              {/* Avatar */}
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-primary/90 flex items-center justify-center text-2xl sm:text-3xl font-semibold text-primary-foreground shadow-lg">
                {getInitials(user?.name)}
              </div>

              {/* User Details */}
              <div className="flex-1 space-y-2 text-center sm:text-left">
                {isEditing ? (
                  <div className="mb-2">
                    <Input
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="h-10 text-lg font-medium bg-background border-border focus:border-primary"
                      placeholder="Your name"
                      maxLength={40}
                    />
                  </div>
                ) : (
                  <h2 className="text-xl sm:text-2xl font-semibold text-foreground">
                    {user?.name || "User"}
                  </h2>
                )}
                <p className="text-muted-foreground text-sm sm:text-base flex items-center justify-center sm:justify-start gap-2">
                  <Mail className="h-4 w-4" />
                  {user?.email || "email@example.com"}
                </p>
                <p className="text-muted-foreground text-sm flex items-center justify-center sm:justify-start gap-2">
                  <Calendar className="h-4 w-4" />
                  Member since {formattedDate}
                </p>

                {/* Edit Profile Controls */}
                <div className="pt-4 flex justify-center sm:justify-start space-x-3">
                  {isEditing ? (
                    <>
                      <Button
                        onClick={handleUpdateProfile}
                        disabled={isLoading}
                        className="flex items-center space-x-2 bg-primary hover:bg-primary/90 text-primary-foreground"
                      >
                        {isLoading ? (
                          <div className="animate-spin h-4 w-4 border-2 border-white border-r-transparent rounded-full mr-2" />
                        ) : (
                          <Save className="h-4 w-4 mr-1" />
                        )}
                        <span>Save</span>
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleCancel}
                        disabled={isLoading}
                        className="border-border hover:bg-muted"
                      >
                        <X className="h-4 w-4 mr-1" />
                        <span>Cancel</span>
                      </Button>
                    </>
                  ) : (
                    <Button
                      onClick={() => setIsEditing(true)}
                      variant="outline"
                      className="border-border hover:bg-muted"
                    >
                      <Edit2 className="h-4 w-4 mr-2" />
                      <span>Edit Profile</span>
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Profile Details Sections */}
            <div className="p-6 sm:p-8 space-y-8">
              {/* Account Information */}
              <section>
                <h3 className="text-lg font-medium text-foreground mb-4 pb-2 border-b border-border">
                  Account Information
                </h3>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <dt className="text-sm text-muted-foreground">
                      Account Type
                    </dt>
                    <dd className="font-medium">Free Plan</dd>
                  </div>
                  <div className="space-y-1">
                    <dt className="text-sm text-muted-foreground">
                      Authentication
                    </dt>
                    <dd className="font-medium">{user?.provider || "Email"}</dd>
                  </div>
                  <div className="space-y-1">
                    <dt className="text-sm text-muted-foreground">
                      Email Status
                    </dt>
                    <dd className="flex items-center gap-1">
                      {user?.emailVerification ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                            Verified
                          </span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="h-4 w-4 text-amber-500" />
                          <span className="text-amber-600 dark:text-amber-400 font-medium">
                            Not Verified
                          </span>
                        </>
                      )}
                    </dd>
                  </div>
                  <div className="space-y-1">
                    <dt className="text-sm text-muted-foreground">User ID</dt>
                    <dd className="font-mono text-xs text-muted-foreground truncate">
                      {user?.$id || "Not available"}
                    </dd>
                  </div>
                </dl>
              </section>

              {/* Usage Statistics */}
              <section>
                <h3 className="text-lg font-medium text-foreground mb-4 pb-2 border-b border-border">
                  Usage Statistics
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="bg-muted/40 rounded-xl p-4 text-center">
                    <div className="text-3xl font-bold text-primary mb-1">
                      23
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Conversations
                    </div>
                  </div>
                  <div className="bg-muted/40 rounded-xl p-4 text-center">
                    <div className="text-3xl font-bold text-primary mb-1">
                      142
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Messages Sent
                    </div>
                  </div>
                  <div className="bg-muted/40 rounded-xl p-4 text-center">
                    <div className="text-3xl font-bold text-primary mb-1">
                      18
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Credit(s) Left
                    </div>
                  </div>
                </div>
              </section>

              {/* Account Actions */}
              <section>
                <h3 className="text-lg font-medium text-foreground mb-4 pb-2 border-b border-border">
                  Account Actions
                </h3>
                <div className="flex flex-wrap gap-4">
                  <Button
                    variant="outline"
                    className="border-destructive text-destructive hover:bg-destructive/10"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </Button>
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="w-full flex justify-center border-t border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-4">
        <div className="container max-w-4xl flex flex-col sm:flex-row justify-between items-center gap-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="AtChat Logo" className="h-5 w-5" />
            <span>© 2025 AtChat. All rights reserved.</span>
          </div>
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
            <Link
              to="/profile"
              className="text-primary font-medium transition-colors"
            >
              Profile
            </Link>
            <Link
              to="/privacy"
              className="hover:text-primary transition-colors"
            >
              Privacy
            </Link>
            <Link
              to="/settings"
              className="hover:text-primary transition-colors"
            >
              Settings
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
