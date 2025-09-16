/**
 * Admin Dashboard
 *
 * Clean, focused admin interface with only essential functions.
 * Only accessible to admin users.
 */

import { useState, useEffect } from "react";
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/frontend/components/ui/card";
import { useAuth } from "@/frontend/contexts/AuthContext";
import { getUserTierInfo } from "@/lib/tierSystem";
import {
  adminService,
  type AdminUser,
  type AdminStats,
} from "@/lib/adminService";
import {
  Shield,
  User,
  AlertTriangle,
  CheckCircle2,
  Database,
  Server,
  Users,
  RefreshCw,
  LogOut,
  ArrowLeft,
  Trash2,
  UserX,
  RotateCcw,
  Eye,
  Search,
  Activity,
  TrendingUp,
  CreditCard,
} from "lucide-react";
import { toast } from "@/frontend/components/ui/toast";
import { useNavigate } from "react-router-dom";
import { devError } from "@/lib/logger";
import SubscriptionManagement from "@/frontend/components/admin/SubscriptionManagement";

export default function AdminPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [adminKey, setAdminKey] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // User management
  const [userEmail, setUserEmail] = useState("");
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);

  // Statistics
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  // All users list
  const [allUsers, setAllUsers] = useState<AdminUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [showAllUsers, setShowAllUsers] = useState(false);

  // Check if current user is admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) return;

      try {
        const tierInfo = await getUserTierInfo();
        setIsAdmin(tierInfo?.tier === "admin");
      } catch (error) {
        devError("Error checking admin status:", error);
      }
    };

    checkAdminStatus();
  }, [user]);

  // Load platform statistics
  const handleLoadStats = async () => {
    if (!adminKey.trim()) {
      toast.error("Please enter admin key");
      return;
    }

    setLoadingStats(true);
    try {
      const stats = await adminService.getStats(adminKey.trim());
      setAdminStats(stats);
      toast.success("Statistics loaded successfully");
    } catch (error) {
      devError("Error loading stats:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to load statistics"
      );
    } finally {
      setLoadingStats(false);
    }
  };

  // Search user by email
  const handleSearchUser = async () => {
    if (!adminKey.trim() || !userEmail.trim()) {
      toast.error("Please enter admin key and user email");
      return;
    }

    setIsLoading(true);
    try {
      const user = await adminService.getUserByEmail(
        adminKey.trim(),
        userEmail.trim()
      );
      setSelectedUser(user);
      toast.success("User found successfully");
    } catch (error) {
      devError("Error searching user:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to search user"
      );
      setSelectedUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Update user tier
  const handleUpdateUserTier = async (
    newTier: "free" | "premium" | "admin"
  ) => {
    if (!selectedUser || !adminKey.trim()) {
      toast.error("Please select a user and enter admin key");
      return;
    }

    setIsLoading(true);
    try {
      await adminService.updateUserTier(
        adminKey.trim(),
        selectedUser.$id,
        newTier
      );
      toast.success(`User tier updated to ${newTier}`);
      handleSearchUser(); // Refresh user data
    } catch (error) {
      devError("Error updating user tier:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update user tier"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Update any user's tier (for pro users management)
  const handleUpdateAnyUserTier = async (
    userId: string,
    newTier: "free" | "premium" | "admin"
  ) => {
    if (!adminKey.trim()) {
      toast.error("Please enter admin key");
      return;
    }

    setIsLoading(true);
    try {
      await adminService.updateUserTier(adminKey.trim(), userId, newTier);
      toast.success(`User tier updated to ${newTier}`);
      handleLoadStats(); // Refresh stats to update pro users list
    } catch (error) {
      devError("Error updating user tier:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update user tier"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Monthly reset - reset all user credits
  const handleMonthlyReset = async () => {
    if (!adminKey.trim()) {
      toast.error("Please enter admin key");
      return;
    }

    const confirmMessage =
      "⚠️ This will reset ALL user credits to their tier limits. Are you sure?";
    if (!confirm(confirmMessage)) {
      return;
    }

    setIsLoading(true);
    try {
      const result = await adminService.resetAllUserLimits(adminKey.trim());
      toast.success(result.message || "Monthly reset completed successfully");
      if (adminStats) {
        handleLoadStats(); // Refresh stats
      }
    } catch (error) {
      devError("Error performing monthly reset:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to perform monthly reset"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Logout all users with chunked processing
  const handleLogoutAllUsers = async () => {
    if (!adminKey.trim()) {
      toast.error("Please enter admin key");
      return;
    }

    const confirmMessage =
      "⚠️ This will logout ALL users from ALL devices. This operation may take some time for large user bases. Are you sure?";
    if (!confirm(confirmMessage)) {
      return;
    }

    setIsLoading(true);
    try {
      // First get user count to show progress
      const totalUsers = await adminService.getUserCount(adminKey.trim());

      if (totalUsers === 0) {
        toast.info("No users found to logout");
        return;
      }

      toast.info(`Starting logout process for ${totalUsers} users...`);

      // Perform chunked logout
      const result = await adminService.logoutAllUsers(
        adminKey.trim(),
        25,
        25000
      );

      if (result.details) {
        const { processedUsers, loggedOutUsers, timeElapsed } = result.details;
        const timeInSeconds = Math.round(timeElapsed / 1000);

        if (processedUsers === totalUsers) {
          toast.success(
            `✅ Successfully processed all ${processedUsers} users (${loggedOutUsers} had active sessions) in ${timeInSeconds}s`
          );
        } else {
          toast.warning(
            `⚠️ Processed ${processedUsers}/${totalUsers} users (${loggedOutUsers} logged out) in ${timeInSeconds}s. Some users may need manual processing.`
          );
        }
      } else {
        toast.success(result.message || "Logout operation completed");
      }

      if (adminStats) {
        handleLoadStats(); // Refresh stats
      }
    } catch (error) {
      devError("Error logging out all users:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to logout all users"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Load all users
  const handleLoadAllUsers = async () => {
    if (!adminKey.trim()) {
      toast.error("Please enter admin key");
      return;
    }

    setLoadingUsers(true);
    try {
      const users = await adminService.getAllUsers(adminKey.trim());
      setAllUsers(users);
      setShowAllUsers(true);
      toast.success(`Loaded ${users.length} users`);
    } catch (error) {
      devError("Error loading users:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to load users"
      );
    } finally {
      setLoadingUsers(false);
    }
  };

  // Clear user session
  const handleClearUserSession = async (userId: string) => {
    if (!adminKey.trim()) {
      toast.error("Please enter admin key");
      return;
    }

    const confirmMessage =
      "⚠️ This will clear all sessions for this user. Are you sure?";
    if (!confirm(confirmMessage)) {
      return;
    }

    setIsLoading(true);
    try {
      await adminService.clearUserSession(adminKey.trim(), userId);
      toast.success("User session cleared successfully");
    } catch (error) {
      devError("Error clearing user session:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to clear user session"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Reset user credits
  const handleResetUserCredits = async (userId: string) => {
    if (!adminKey.trim()) {
      toast.error("Please enter admin key");
      return;
    }

    const confirmMessage =
      "⚠️ This will reset this user's credits to their tier limits. Are you sure?";
    if (!confirm(confirmMessage)) {
      return;
    }

    setIsLoading(true);
    try {
      await adminService.resetUserCredits(adminKey.trim(), userId);
      toast.success("User credits reset successfully");
      if (selectedUser && selectedUser.$id === userId) {
        handleSearchUser(); // Refresh selected user data
      }
    } catch (error) {
      devError("Error resetting user credits:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to reset user credits"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Delete user data
  const handleDeleteUserData = async (userId: string, email?: string) => {
    if (!adminKey.trim()) {
      toast.error("Please enter admin key");
      return;
    }

    const confirmMessage = `⚠️ This will permanently delete ALL data (threads, messages, projects, summaries) for this user. This action cannot be undone. Are you sure?`;
    if (!confirm(confirmMessage)) {
      return;
    }

    setIsLoading(true);
    try {
      const result = await adminService.deleteUserData(
        adminKey.trim(),
        userId,
        email
      );
      toast.success(result.message || "User data deleted successfully");
      if (adminStats) {
        handleLoadStats(); // Refresh stats
      }
    } catch (error) {
      devError("Error deleting user data:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete user data"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Delete all database data
  const handleDeleteAllData = async () => {
    if (!adminKey.trim()) {
      toast.error("Please enter admin key");
      return;
    }

    const confirmMessage = `⚠️ DANGER: This will permanently delete ALL data from the entire database (threads, messages, projects, summaries) for ALL users. This action cannot be undone. Type "DELETE ALL DATA" to confirm.`;
    const confirmation = prompt(confirmMessage);

    if (confirmation?.trim().toUpperCase() !== "DELETE ALL DATA") {
      toast.error("Confirmation text did not match. Operation cancelled.");
      return;
    }

    setIsLoading(true);
    try {
      const result = await adminService.deleteAllData(adminKey.trim());
      toast.success(result.message || "All database data deleted successfully");
      if (adminStats) {
        handleLoadStats(); // Refresh stats
      }
    } catch (error) {
      devError("Error deleting all data:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete all data"
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Access Denied
            </CardTitle>
            <CardDescription>
              Please log in to access the admin panel.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-red-500" />
              Admin Access Required
            </CardTitle>
            <CardDescription>
              You need admin privileges to access this page.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl pb-11 mx-auto space-y-6">
        {/* Header with Back Button */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => navigate("/")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Button>
          <div className="text-center flex-1">
            <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
              <Shield className="h-8 w-8 text-primary" />
              Admin Dashboard
            </h1>
            <p className="text-muted-foreground mt-2">
              Comprehensive system administration and user management
            </p>
          </div>
          <div className="w-32"></div> {/* Spacer for centering */}
        </div>

        {/* Admin Key Input */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Admin Authentication
            </CardTitle>
            <CardDescription>
              Enter the admin secret key to perform administrative operations.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Input
              type="password"
              placeholder="Enter admin secret key"
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              className="max-w-md"
            />
          </CardContent>
        </Card>

        {/* Platform Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Platform Statistics
            </CardTitle>
            <CardDescription>
              Real-time system metrics and analytics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center mb-4">
              <Button
                onClick={handleLoadStats}
                disabled={loadingStats || !adminKey.trim()}
                size="sm"
              >
                {loadingStats ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <Server className="h-4 w-4 mr-2" />
                    Load Stats
                  </>
                )}
              </Button>
            </div>

            {adminStats ? (
              <div className="space-y-6">
                {/* User Statistics */}
                <div className="space-y-4">
                  <h5 className="text-sm font-semibold flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    User Statistics
                  </h5>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg text-center">
                      <User className="h-5 w-5 mx-auto mb-2 text-slate-600" />
                      <p className="text-2xl font-bold">
                        {adminStats.users?.total || "0"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Total Users
                      </p>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg text-center">
                      <CheckCircle2 className="h-5 w-5 mx-auto mb-2 text-green-600" />
                      <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                        {adminStats.users?.verified || "0"}
                      </p>
                      <p className="text-xs text-green-600">Verified</p>
                    </div>
                    <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg text-center">
                      <AlertTriangle className="h-5 w-5 mx-auto mb-2 text-amber-600" />
                      <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">
                        {adminStats.users?.unverified || "0"}
                      </p>
                      <p className="text-xs text-amber-600">Unverified</p>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg text-center">
                      <Database className="h-5 w-5 mx-auto mb-2 text-blue-600" />
                      <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                        {adminStats.database?.threads || "0"}
                      </p>
                      <p className="text-xs text-blue-600">Total Threads</p>
                    </div>
                  </div>
                </div>

                {/* Database Statistics */}
                <div className="space-y-4">
                  <h5 className="text-sm font-semibold flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    Database Statistics
                  </h5>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg text-center">
                      <Activity className="h-5 w-5 mx-auto mb-2 text-purple-600" />
                      <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                        {adminStats.database?.messages || "0"}
                      </p>
                      <p className="text-xs text-purple-600">Total Messages</p>
                    </div>
                    <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg text-center">
                      <Server className="h-5 w-5 mx-auto mb-2 text-indigo-600" />
                      <p className="text-2xl font-bold text-indigo-700 dark:text-indigo-300">
                        {adminStats.database?.projects || "0"}
                      </p>
                      <p className="text-xs text-indigo-600">Total Projects</p>
                    </div>
                    <div className="bg-teal-50 dark:bg-teal-900/20 p-4 rounded-lg text-center">
                      <TrendingUp className="h-5 w-5 mx-auto mb-2 text-teal-600" />
                      <p className="text-2xl font-bold text-teal-700 dark:text-teal-300">
                        {adminStats.tiers?.totalUsers || "0"}
                      </p>
                      <p className="text-xs text-teal-600">Active Users</p>
                    </div>
                  </div>
                </div>

                {/* Tier Distribution */}
                <div className="space-y-4">
                  <h5 className="text-sm font-semibold flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Tier Distribution
                  </h5>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-zinc-50 dark:bg-zinc-800 p-4 rounded-lg text-center">
                      <User className="h-5 w-5 mx-auto mb-2 text-zinc-600" />
                      <p className="text-2xl font-bold text-zinc-700 dark:text-zinc-300">
                        {adminStats.tiers?.distribution?.free || "0"}
                      </p>
                      <p className="text-xs text-zinc-600">Free Users</p>
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg text-center">
                      <Shield className="h-5 w-5 mx-auto mb-2 text-purple-600" />
                      <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                        {adminStats.tiers?.distribution?.premium || "0"}
                      </p>
                      <p className="text-xs text-purple-600">Premium Users</p>
                    </div>
                    <div className="bg-black/5 dark:bg-white/10 p-4 rounded-lg text-center">
                      <Shield className="h-5 w-5 mx-auto mb-2 text-black dark:text-white" />
                      <p className="text-2xl font-bold text-black dark:text-white">
                        {adminStats.tiers?.distribution?.admin || "0"}
                      </p>
                      <p className="text-xs text-black/80 dark:text-white/80">
                        Admin Users
                      </p>
                    </div>
                    <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg text-center">
                      <AlertTriangle className="h-5 w-5 mx-auto mb-2 text-red-600" />
                      <p className="text-2xl font-bold text-red-700 dark:text-red-300">
                        {adminStats.tiers?.distribution?.uninitialized || "0"}
                      </p>
                      <p className="text-xs text-red-600">Uninitialized</p>
                    </div>
                  </div>
                </div>

                {/* Credit Statistics */}
                <div className="space-y-4">
                  <h5 className="text-sm font-semibold flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Credit Statistics
                  </h5>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                      <div className="text-center">
                        <p className="text-lg font-bold text-green-700 dark:text-green-300">
                          {adminStats.tiers?.credits?.totalFreeCredits || "0"}
                        </p>
                        <p className="text-xs text-green-600">Remaining Free</p>
                      </div>
                      <div className="text-center mt-2">
                        <p className="text-sm font-semibold text-green-600">
                          {adminStats.tiers?.credits?.usedFreeCredits || "0"}
                        </p>
                        <p className="text-xs text-green-500">Used Free</p>
                      </div>
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                      <div className="text-center">
                        <p className="text-lg font-bold text-purple-700 dark:text-purple-300">
                          {adminStats.tiers?.credits?.totalPremiumCredits ||
                            "0"}
                        </p>
                        <p className="text-xs text-purple-600">
                          Remaining Premium
                        </p>
                      </div>
                      <div className="text-center mt-2">
                        <p className="text-sm font-semibold text-purple-600">
                          {adminStats.tiers?.credits?.usedPremiumCredits || "0"}
                        </p>
                        <p className="text-xs text-purple-500">Used Premium</p>
                      </div>
                    </div>
                    <div className="bg-black/5 dark:bg-white/10 p-4 rounded-lg">
                      <div>
                        <p className="text-lg font-bold text-black dark:text-white">
                          {adminStats.tiers?.credits
                            ?.totalSuperPremiumCredits || 0}
                        </p>
                        <p className="text-xs text-black/80 dark:text-white/80">
                          Remaining Super
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-black/90 dark:text-white/90">
                          {adminStats.tiers?.credits?.usedSuperPremiumCredits ||
                            0}
                        </p>
                        <p className="text-xs text-black/70 dark:text-white/70">
                          Used Super
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-xs text-muted-foreground">
                  Last updated:{" "}
                  {adminStats.lastUpdated
                    ? new Date(adminStats.lastUpdated).toLocaleString()
                    : "N/A"}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">
                  Click "Load Stats" to view comprehensive platform statistics
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* User Search */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              User Management
            </CardTitle>
            <CardDescription>Search and manage user accounts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3 mb-4">
              <Input
                placeholder="Enter user email address"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                className="flex-1"
              />
              <Button
                onClick={handleSearchUser}
                disabled={isLoading || !adminKey.trim() || !userEmail.trim()}
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <User className="h-4 w-4 mr-2" />
                    Search
                  </>
                )}
              </Button>
            </div>

            {selectedUser && (
              <div className="bg-muted/30 p-4 rounded-lg space-y-4">
                <div>
                  <h5 className="text-sm font-semibold mb-2">
                    User Information
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="font-medium">Email:</span>{" "}
                      {selectedUser.email}
                    </div>
                    <div>
                      <span className="font-medium">Name:</span>{" "}
                      {selectedUser.name || "N/A"}
                    </div>
                    <div>
                      <span className="font-medium">Tier:</span>{" "}
                      {selectedUser.preferences?.tier || "N/A"}
                    </div>
                    <div>
                      <span className="font-medium">Verified:</span>{" "}
                      {selectedUser.emailVerification ? "Yes" : "No"}
                    </div>
                    <div>
                      <span className="font-medium">Free Credits:</span>{" "}
                      {selectedUser.preferences?.freeCredits || 0}
                    </div>
                    <div>
                      <span className="font-medium">Premium Credits:</span>{" "}
                      {selectedUser.preferences?.premiumCredits || 0}
                    </div>
                    <div>
                      <span className="font-medium">Super Credits:</span>{" "}
                      {selectedUser.preferences?.superPremiumCredits || 0}
                    </div>
                    <div>
                      <span className="font-medium">Last Reset:</span>{" "}
                      {selectedUser.preferences?.lastResetDate
                        ? new Date(
                            selectedUser.preferences.lastResetDate
                          ).toLocaleDateString()
                        : "N/A"}
                    </div>
                  </div>
                </div>

                <div>
                  <h5 className="text-sm font-semibold mb-2">Update Tier</h5>
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUpdateUserTier("free")}
                      disabled={isLoading}
                    >
                      Set Free
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUpdateUserTier("premium")}
                      disabled={isLoading}
                      className="border-purple-300 text-purple-700 hover:bg-purple-50"
                    >
                      Set Premium
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUpdateUserTier("admin")}
                      disabled={isLoading}
                      className="border-zinc-300 text-zinc-700 hover:bg-zinc-50"
                    >
                      Set Admin
                    </Button>
                  </div>
                </div>

                <div>
                  <h5 className="text-sm font-semibold mb-2">User Actions</h5>
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleResetUserCredits(selectedUser.$id)}
                      disabled={isLoading}
                      className="border-blue-300 text-blue-700 hover:bg-blue-50"
                    >
                      <RotateCcw className="h-4 w-4 mr-1" />
                      Reset Credits
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleClearUserSession(selectedUser.$id)}
                      disabled={isLoading}
                      className="border-yellow-300 text-yellow-700 hover:bg-yellow-50"
                    >
                      <UserX className="h-4 w-4 mr-1" />
                      Clear Session
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handleDeleteUserData(
                          selectedUser.$id,
                          selectedUser.email
                        )
                      }
                      disabled={isLoading}
                      className="border-red-300 text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete Data
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* All Users Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              All Users Management
            </CardTitle>
            <CardDescription>
              View and manage all users in the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center mb-4">
              <Button
                onClick={handleLoadAllUsers}
                disabled={loadingUsers || !adminKey.trim()}
                size="sm"
              >
                {loadingUsers ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Load All Users
                  </>
                )}
              </Button>
              {showAllUsers && (
                <Button
                  onClick={() => setShowAllUsers(false)}
                  variant="outline"
                  size="sm"
                >
                  Hide Users
                </Button>
              )}
            </div>

            {showAllUsers && allUsers.length > 0 && (
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  Showing {allUsers.length} users
                </div>
                <div className="max-h-96 overflow-y-auto space-y-2">
                  {allUsers.map((user) => (
                    <div key={user.$id} className="bg-muted/30 p-3 rounded-lg">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-sm">
                        <div>
                          <span className="font-medium">Email:</span>{" "}
                          {user.email}
                        </div>
                        <div>
                          <span className="font-medium">Name:</span>{" "}
                          {user.name || "N/A"}
                        </div>
                        <div>
                          <span className="font-medium">Tier:</span>{" "}
                          {user.preferences?.tier || "N/A"}
                        </div>
                        <div>
                          <span className="font-medium">Verified:</span>{" "}
                          {user.emailVerification ? "Yes" : "No"}
                        </div>
                        <div>
                          <span className="font-medium">Credits:</span>{" "}
                          {user.preferences?.freeCredits || 0}/
                          {user.preferences?.premiumCredits || 0}/
                          {user.preferences?.superPremiumCredits || 0}
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleResetUserCredits(user.$id)}
                            disabled={isLoading}
                            className="text-xs px-2 py-1 h-6"
                          >
                            Reset
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleClearUserSession(user.$id)}
                            disabled={isLoading}
                            className="text-xs px-2 py-1 h-6"
                          >
                            Logout
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handleDeleteUserData(user.$id, user.email)
                            }
                            disabled={isLoading}
                            className="text-xs px-2 py-1 h-6 text-red-600 border-red-300 hover:bg-red-50"
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Credits Overview */}
        {adminStats && (
          <Card className="border-blue-200 dark:border-blue-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-600">
                <CreditCard className="h-5 w-5" />
                Monthly Credits Overview
              </CardTitle>
              <CardDescription>
                Current month credits issued and usage statistics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* Total Credits Issued */}
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg text-center">
                  <TrendingUp className="h-6 w-6 mx-auto mb-2 text-green-600" />
                  <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                    {adminStats.monthlyCredits.totalCreditsIssued.total.toLocaleString()}
                  </p>
                  <p className="text-xs text-green-600">Total Credits Issued</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {adminStats.monthlyCredits.usersResetThisMonth} users reset
                    this month
                  </p>
                </div>

                {/* Credits Used */}
                <div className="bg-black/5 dark:bg-white/10 p-4 rounded-lg text-center">
                  <Activity className="h-6 w-6 mx-auto mb-2 text-black dark:text-white" />
                  <p className="text-2xl font-bold text-black dark:text-white">
                    {adminStats.monthlyCredits?.creditsUsed?.total || "0"}
                  </p>
                  <p className="text-xs text-black/80 dark:text-white/80">
                    Credits Used
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {adminStats.monthlyCredits.utilizationRate}% utilization
                  </p>
                </div>

                {/* Free Credits Breakdown */}
                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg text-center">
                  <div className="text-xs text-muted-foreground mb-2">
                    Free Credits
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>Issued:</span>
                      <span className="font-medium">
                        {adminStats.monthlyCredits.totalCreditsIssued.free.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>Used:</span>
                      <span className="font-medium">
                        {adminStats.monthlyCredits.creditsUsed.free.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Premium Credits Breakdown */}
                <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg text-center">
                  <div className="text-xs text-purple-600 mb-2">
                    Premium Credits
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>Issued:</span>
                      <span className="font-medium">
                        {adminStats.monthlyCredits.totalCreditsIssued.premium.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>Used:</span>
                      <span className="font-medium">
                        {adminStats.monthlyCredits.creditsUsed.premium.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Super Premium Credits Breakdown */}
                <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg text-center">
                  <div className="text-xs text-indigo-600 mb-2">
                    Super Premium
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>Issued:</span>
                      <span className="font-medium">
                        {adminStats.monthlyCredits.totalCreditsIssued.superPremium.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>Used:</span>
                      <span className="font-medium">
                        {adminStats.monthlyCredits.creditsUsed.superPremium.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Utilization Progress Bar */}
              <div className="mt-4">
                <div className="flex justify-between text-sm mb-2">
                  <span>Overall Utilization</span>
                  <span className="font-medium">
                    {adminStats.monthlyCredits.utilizationRate}%
                  </span>
                </div>
                <div className="w-full bg-zinc-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(
                        adminStats.monthlyCredits.utilizationRate,
                        100
                      )}%`,
                    }}
                  ></div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pro Users Management */}
        {adminStats && adminStats.proUsers.totalCount > 0 && (
          <Card className="border-purple-200 dark:border-purple-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-600">
                <Users className="h-5 w-5" />
                Pro Users Management
              </CardTitle>
              <CardDescription>
                Manage premium tier users ({adminStats.proUsers.totalCount}{" "}
                total, {adminStats.proUsers.activeCount} active,{" "}
                {adminStats.proUsers.verifiedCount} verified)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Pro Users Stats */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg text-center">
                    <p className="text-lg font-bold text-purple-700 dark:text-purple-300">
                      {adminStats.proUsers.totalCount}
                    </p>
                    <p className="text-xs text-purple-600">Total Pro Users</p>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg text-center">
                    <p className="text-lg font-bold text-green-700 dark:text-green-300">
                      {adminStats.proUsers.activeCount}
                    </p>
                    <p className="text-xs text-green-600">Active Users</p>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg text-center">
                    <p className="text-lg font-bold text-blue-700 dark:text-blue-300">
                      {adminStats.proUsers.verifiedCount}
                    </p>
                    <p className="text-xs text-blue-600">Verified Users</p>
                  </div>
                </div>

                {/* Pro Users List */}
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {adminStats.proUsers.users.slice(0, 10).map((user) => (
                    <div
                      key={user.$id}
                      className="border rounded-lg p-4 bg-slate-50 dark:bg-slate-800"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h6 className="font-medium text-sm">
                              {user.email}
                            </h6>
                            {user.emailVerification && (
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                            )}
                            {!user.status && (
                              <AlertTriangle className="h-4 w-4 text-zinc-500" />
                            )}
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                            <div>Name: {user.name}</div>
                            <div>
                              Registered:{" "}
                              {new Date(user.registration).toLocaleDateString()}
                            </div>
                            <div>Free: {user.freeCredits}</div>
                            <div>Premium: {user.premiumCredits}</div>
                            <div>Super: {user.superPremiumCredits}</div>
                            <div>
                              Reset:{" "}
                              {user.lastResetDate
                                ? new Date(
                                    user.lastResetDate
                                  ).toLocaleDateString()
                                : "Never"}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-1 ml-4">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handleUpdateAnyUserTier(user.$id, "free")
                            }
                            disabled={isLoading}
                            className="text-xs px-2 py-1 h-6"
                          >
                            Downgrade
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleResetUserCredits(user.$id)}
                            disabled={isLoading}
                            className="text-xs px-2 py-1 h-6"
                          >
                            Reset
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleClearUserSession(user.$id)}
                            disabled={isLoading}
                            className="text-xs px-2 py-1 h-6"
                          >
                            Logout
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {adminStats.proUsers.totalCount > 10 && (
                  <div className="text-center text-sm text-muted-foreground">
                    Showing first 10 of {adminStats.proUsers.totalCount} pro
                    users
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* System Operations */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-zinc-200 dark:border-zinc-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-black dark:text-white">
                <RefreshCw className="h-5 w-5" />
                Monthly Reset
              </CardTitle>
              <CardDescription>
                Reset all user credits to their tier limits
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handleMonthlyReset}
                disabled={isLoading || !adminKey.trim()}
                className="w-full bg-black hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 dark:text-black"
              >
                {isLoading ? "Processing..." : "Run Monthly Reset"}
              </Button>
            </CardContent>
          </Card>

          <Card className="border-red-200 dark:border-red-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <LogOut className="h-5 w-5" />
                Emergency Logout
              </CardTitle>
              <CardDescription>
                Force logout all users from the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handleLogoutAllUsers}
                disabled={isLoading || !adminKey.trim()}
                variant="destructive"
                className="w-full"
              >
                {isLoading ? "Processing..." : "Logout All Users"}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Subscription Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Subscription Management
            </CardTitle>
            <CardDescription>
              Manage all premium subscriptions and user preferences
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SubscriptionManagement />
          </CardContent>
        </Card>

        {/* Dangerous Operations */}
        <Card className="border-red-500 dark:border-red-500 bg-red-50/50 dark:bg-red-900/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Dangerous Operations
            </CardTitle>
            <CardDescription className="text-red-600">
              ⚠️ These operations are irreversible and will permanently delete
              data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-red-100 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <h5 className="text-sm font-semibold text-red-800 dark:text-red-200 mb-2">
                  Delete All Database Data
                </h5>
                <p className="text-xs text-red-700 dark:text-red-300 mb-3">
                  This will permanently delete ALL threads, messages, projects,
                  and summaries for ALL users. User accounts will remain but all
                  their data will be lost.
                </p>
                <Button
                  onClick={handleDeleteAllData}
                  disabled={isLoading || !adminKey.trim()}
                  variant="destructive"
                  className="w-full bg-red-600 hover:bg-red-700"
                >
                  {isLoading ? "Processing..." : "🗑️ DELETE ALL DATABASE DATA"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
