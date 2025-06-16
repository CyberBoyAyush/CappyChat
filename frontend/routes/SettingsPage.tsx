/**
 * SettingsPage Route Component
 *
 * Used in: frontend/ChatAppRouter.tsx (as "/settings" route)
 * Purpose: Unified settings page combining profile, privacy, and application settings.
 * Provides access to all user preferences and configuration options.
 */

import { Link, useSearchParams, useLocation } from "react-router-dom";

import {
  Settings as SettingsIcon,
  Settings,
  Moon,
  Sun,
  Key,
  Eye,
  EyeOff,
  Check,
  X,
  User,
  Mail,
  Calendar,
  Edit2,
  LogOut,
  Save,
  AlertTriangle,
  CheckCircle2,
  Shield,
  Lock,
  Database,
  Server,
  FileCheck,
  Users,
  Trash2,
  ArrowLeft,
  Folder,
} from "lucide-react";
import ThemeToggleButton from "../components/ui/ThemeComponents";
import { useTheme } from "next-themes";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { useState, useEffect } from "react";
import { useBYOKStore } from "@/frontend/stores/BYOKStore";
import { useAuth } from "../contexts/AuthContext";
import { format } from "date-fns";
import { getUserTierInfo, getTierDisplayInfo } from "@/lib/tierSystem";
import { getUserCustomProfile, updateUserCustomProfile, clearUserCustomProfile, UserCustomProfile } from "@/lib/appwrite";

// Notification type
type NotificationType = {
  type: "success" | "error";
  message: string;
};

export default function SettingsPage() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const chatId = searchParams.get("from");
  const { setTheme, theme } = useTheme();
  const { user, updateProfile, logout } = useAuth();

  // Section navigation state
  const [activeSection, setActiveSection] = useState("profile");

  // Profile state
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [notification, setNotification] = useState<NotificationType | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);

  // Custom Profile State
  const [customProfile, setCustomProfile] = useState<UserCustomProfile>({});
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [tempCustomName, setTempCustomName] = useState("");
  const [tempAboutUser, setTempAboutUser] = useState("");

  // BYOK state
  const {
    openRouterApiKey,
    openAIApiKey,
    setOpenRouterApiKey,
    setOpenAIApiKey,
    hasOpenRouterKey,
    hasOpenAIKey,
    validateOpenRouterKey,
    validateOpenAIKey,
  } = useBYOKStore();

  const [keyInput, setKeyInput] = useState("");
  const [openAIKeyInput, setOpenAIKeyInput] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [showOpenAIKey, setShowOpenAIKey] = useState(false);
  const [keyError, setKeyError] = useState("");
  const [openAIKeyError, setOpenAIKeyError] = useState("");
  const [keySaved, setKeySaved] = useState(false);
  const [openAIKeySaved, setOpenAIKeySaved] = useState(false);

  // Tier management state
  const [tierInfo, setTierInfo] = useState<any>(null);
  const [loadingTier, setLoadingTier] = useState(true);

  // Admin dashboard state
  const [adminKey, setAdminKey] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [selectedUser, setSelectedUser] = useState<{
    $id: string;
    email: string;
    name?: string;
    preferences?: any;
  } | null>(null);
  const [isAdminLoading, setIsAdminLoading] = useState(false);
  const [adminStats, setAdminStats] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  // Initialize profile data and handle section navigation
  useEffect(() => {
    if (user?.name) {
      setDisplayName(user.name);
    }

    // Handle hash-based navigation
    const hash = location.hash.replace("#", "");
    if (hash && ["profile", "privacy", "settings"].includes(hash)) {
      setActiveSection(hash);
    }
  }, [user, location.hash]);

  // Load tier information - NO AUTOMATIC UPDATES
  useEffect(() => {
    const loadTierInfo = async () => {
      if (!user) return;

      try {
        setLoadingTier(true);
        // Just get current tier info without any modifications
        const info = await getUserTierInfo();
        setTierInfo(info);
      } catch (error) {
        console.error("Error loading tier info:", error);
      } finally {
        setLoadingTier(false);
      }
    };

    loadTierInfo();
  }, [user]);

  // Load custom profile data
  useEffect(() => {
    const loadCustomProfile = async () => {
      if (!user) return;

      try {
        const profile = await getUserCustomProfile();
        if (profile) {
          setCustomProfile(profile);
          setTempCustomName(profile.customName || "");
          setTempAboutUser(profile.aboutUser || "");
        }
      } catch (error) {
        console.error("Error loading custom profile:", error);
      }
    };

    loadCustomProfile();
  }, [user]);

  // Profile handlers
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
        message: (error as Error).message || "Failed to update profile",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setDisplayName(user?.name || "");
    setIsEditing(false);
  };

  // Custom Profile handlers
  const handleUpdateCustomProfile = async () => {
    setProfileLoading(true);
    try {
      const profileData: UserCustomProfile = {
        customName: tempCustomName.trim() || undefined,
        aboutUser: tempAboutUser.trim() || undefined,
      };

      await updateUserCustomProfile(profileData);
      setCustomProfile(profileData);
      setIsEditingProfile(false);

      setNotification({
        type: "success",
        message: "Custom profile updated successfully",
      });

      // Clear notification after 3 seconds
      setTimeout(() => {
        setNotification(null);
      }, 3000);
    } catch (error) {
      setNotification({
        type: "error",
        message: (error as Error).message || "Failed to update custom profile",
      });
    } finally {
      setProfileLoading(false);
    }
  };

  const handleCancelCustomProfile = () => {
    setTempCustomName(customProfile.customName || "");
    setTempAboutUser(customProfile.aboutUser || "");
    setIsEditingProfile(false);
  };

  const handleClearCustomProfile = async () => {
    if (!confirm("Are you sure you want to clear your custom profile? This will remove all personalization from AI responses.")) {
      return;
    }

    setProfileLoading(true);
    try {
      await clearUserCustomProfile();
      setCustomProfile({});
      setTempCustomName("");
      setTempAboutUser("");

      setNotification({
        type: "success",
        message: "Custom profile cleared successfully",
      });

      // Clear notification after 3 seconds
      setTimeout(() => {
        setNotification(null);
      }, 3000);
    } catch (error) {
      setNotification({
        type: "error",
        message: (error as Error).message || "Failed to clear custom profile",
      });
    } finally {
      setProfileLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  // BYOK handlers
  const handleSaveKey = () => {
    if (!keyInput.trim()) {
      setKeyError("Please enter an API key");
      return;
    }

    if (!validateOpenRouterKey(keyInput.trim())) {
      setKeyError(
        "Invalid API key format. OpenRouter keys should start with 'sk-or-'"
      );
      return;
    }

    setOpenRouterApiKey(keyInput.trim());
    setKeyInput("");
    setKeyError("");
    setKeySaved(true);
    setTimeout(() => setKeySaved(false), 3000);
  };

  const handleRemoveKey = () => {
    setOpenRouterApiKey(null);
    setKeyInput("");
    setKeyError("");
  };

  const handleSaveOpenAIKey = () => {
    if (!openAIKeyInput.trim()) {
      setOpenAIKeyError("Please enter an OpenAI API key");
      return;
    }

    if (!validateOpenAIKey(openAIKeyInput.trim())) {
      setOpenAIKeyError(
        "Invalid API key format. OpenAI keys should start with 'sk-'"
      );
      return;
    }

    setOpenAIApiKey(openAIKeyInput.trim());
    setOpenAIKeyInput("");
    setOpenAIKeyError("");
    setOpenAIKeySaved(true);
    setTimeout(() => setOpenAIKeySaved(false), 3000);
  };

  const handleRemoveOpenAIKey = () => {
    setOpenAIApiKey(null);
    setOpenAIKeyInput("");
    setOpenAIKeyError("");
  };

  const maskKey = (key: string) => {
    if (!key) return "";
    return key.substring(0, 8) + "..." + key.substring(key.length - 4);
  };

  // Admin functions
  const handleSearchUser = async () => {
    if (!adminKey.trim() || !userEmail.trim()) {
      setNotification({
        type: "error",
        message: "Please enter admin key and user email",
      });
      return;
    }

    setIsAdminLoading(true);
    try {
      const response = await fetch("/api/admin/manage-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          adminKey: adminKey.trim(),
          action: "getUserByEmail",
          email: userEmail.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSelectedUser(data.user);
        setNotification({
          type: "success",
          message: "User found successfully",
        });
      } else {
        setNotification({
          type: "error",
          message: data.error || "Failed to find user",
        });
      }
    } catch (error) {
      console.error("Error searching user:", error);
      setNotification({
        type: "error",
        message: "Network error occurred",
      });
    } finally {
      setIsAdminLoading(false);
    }
  };

  const handleUpdateUserTier = async (
    newTier: "free" | "premium" | "admin"
  ) => {
    if (!selectedUser || !adminKey.trim()) {
      setNotification({
        type: "error",
        message: "Please select a user and enter admin key",
      });
      return;
    }

    setIsAdminLoading(true);
    try {
      const response = await fetch("/api/admin/manage-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          adminKey: adminKey.trim(),
          action: "updateTier",
          userId: selectedUser.$id,
          tier: newTier,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setNotification({
          type: "success",
          message: `User tier updated to ${newTier}`,
        });
        // Refresh user data
        handleSearchUser();
      } else {
        setNotification({
          type: "error",
          message: data.error || "Failed to update user tier",
        });
      }
    } catch (error) {
      console.error("Error updating user tier:", error);
      setNotification({
        type: "error",
        message: "Network error occurred",
      });
    } finally {
      setIsAdminLoading(false);
    }
  };

  const handleResetUserCredits = async () => {
    if (!selectedUser || !adminKey.trim()) {
      setNotification({
        type: "error",
        message: "Please select a user and enter admin key",
      });
      return;
    }

    setIsAdminLoading(true);
    try {
      const response = await fetch("/api/admin/manage-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          adminKey: adminKey.trim(),
          action: "resetCredits",
          userId: selectedUser.$id,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setNotification({
          type: "success",
          message: "User credits reset successfully",
        });
        // Refresh user data
        handleSearchUser();
      } else {
        setNotification({
          type: "error",
          message: data.error || "Failed to reset user credits",
        });
      }
    } catch (error) {
      console.error("Error resetting user credits:", error);
      setNotification({
        type: "error",
        message: "Network error occurred",
      });
    } finally {
      setIsAdminLoading(false);
    }
  };

  // Load admin stats
  const handleLoadStats = async () => {
    if (!adminKey.trim()) {
      setNotification({
        type: "error",
        message: "Please enter admin key",
      });
      return;
    }

    setLoadingStats(true);
    try {
      const response = await fetch("/api/admin/stats", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          adminKey: adminKey.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setAdminStats(data.stats);
        setNotification({
          type: "success",
          message: "Statistics loaded successfully",
        });
      } else {
        setNotification({
          type: "error",
          message: data.error || "Failed to load statistics",
        });
      }
    } catch (error) {
      console.error("Error loading stats:", error);
      setNotification({
        type: "error",
        message: "Network error occurred",
      });
    } finally {
      setLoadingStats(false);
    }
  };

  // Monthly reset
  const handleMonthlyReset = async () => {
    if (!adminKey.trim()) {
      setNotification({
        type: "error",
        message: "Please enter admin key",
      });
      return;
    }

    if (
      !confirm(
        "Are you sure you want to reset all user credits? This action cannot be undone."
      )
    ) {
      return;
    }

    setIsAdminLoading(true);
    try {
      const response = await fetch("/api/admin/manage-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          adminKey: adminKey.trim(),
          action: "monthlyReset",
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setNotification({
          type: "success",
          message: data.message || "Monthly reset completed successfully",
        });
        // Refresh stats if they're loaded
        if (adminStats) {
          handleLoadStats();
        }
      } else {
        setNotification({
          type: "error",
          message: data.error || "Failed to perform monthly reset",
        });
      }
    } catch (error) {
      console.error("Error performing monthly reset:", error);
      setNotification({
        type: "error",
        message: "Network error occurred",
      });
    } finally {
      setIsAdminLoading(false);
    }
  };

  // Logout all users
  const handleLogoutAllUsers = async () => {
    if (!adminKey.trim()) {
      setNotification({
        type: "error",
        message: "Please enter admin key",
      });
      return;
    }

    if (
      !confirm(
        "⚠️ CRITICAL OPERATION ⚠️\n\nThis will immediately logout ALL active users from the system. This should only be used in emergency situations.\n\nAre you absolutely sure you want to proceed?"
      )
    ) {
      return;
    }

    // Double confirmation for this critical operation
    if (
      !confirm(
        "This is your final confirmation. All users will be logged out immediately. Continue?"
      )
    ) {
      return;
    }

    setIsAdminLoading(true);
    try {
      const response = await fetch("/api/admin/manage-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          adminKey: adminKey.trim(),
          action: "logoutAllUsers",
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setNotification({
          type: "success",
          message:
            data.message || "All users have been logged out successfully",
        });
        // Refresh stats if they're loaded
        if (adminStats) {
          handleLoadStats();
        }
      } else {
        setNotification({
          type: "error",
          message: data.error || "Failed to logout all users",
        });
      }
    } catch (error) {
      console.error("Error logging out all users:", error);
      setNotification({
        type: "error",
        message: "Network error occurred",
      });
    } finally {
      setIsAdminLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col align-middle justify-center">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className=" w-full px-4 sm:px-6 lg:px-14 flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              to={chatId ? `/chat/${chatId}` : "/chat"}
              className="flex items-center justify-center h-9 w-9 rounded-full border border-border bg-background hover:bg-muted transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="sr-only">Back</span>
            </Link>
            <div className="flex items-center gap-2">
              <SettingsIcon className="w-5 h-5 text-primary" />
              <h1 className="text-lg font-semibold">Settings</h1>
            </div>
          </div>
          <ThemeToggleButton variant="inline" />
        </div>
      </header>

      {/* Main Content */}
      <main className="container self-center px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8 max-w-4xl mx-auto">
          {/* Page Title and Description */}
          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Settings
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base">
              Manage your profile, privacy settings, and application
              preferences.
            </p>
            <div className="h-px bg-border mt-4"></div>
          </div>

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

          {/* Section Navigation */}
          <div className="flex flex-wrap justify-center gap-1 md:gap-2 border-b border-border">
            {[
              { id: "profile", label: "Profile", icon: User },
              { id: "privacy", label: "Privacy & Security", icon: Shield },
              { id: "settings", label: "Application", icon: SettingsIcon },
              ...(tierInfo?.tier === "admin"
                ? [{ id: "admin", label: "Admin Dashboard", icon: Shield }]
                : []),
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveSection(id)}
                className={`flex items-center gap-2 px-2 md:px-4 py-2 text-xs md:text-sm font-medium border-b-2 transition-colors ${
                  activeSection === id
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>

          {/* Settings Content */}
          <div className="space-y-6">
            {/* Profile Section */}
            {activeSection === "profile" && (
              <div className="space-y-6">
                {/* Profile Header Card */}
                <div className="p-6 border rounded-xl bg-card shadow-sm">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-8 h-8 text-primary" />
                    </div>
                    <div className="flex-1 space-y-2">
                      {isEditing ? (
                        <div className="flex flex-col sm:flex-row gap-2">
                          <Input
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            placeholder="Enter your name"
                            className="flex-1"
                            disabled={isLoading}
                          />
                          <div className="flex gap-2">
                            <Button
                              onClick={handleUpdateProfile}
                              size="sm"
                              disabled={isLoading}
                              className="flex items-center gap-1"
                            >
                              <Save className="w-4 h-4" />
                              {isLoading ? "Saving..." : "Save"}
                            </Button>
                            <Button
                              onClick={handleCancel}
                              variant="outline"
                              size="sm"
                              disabled={isLoading}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                          <h3 className="text-xl font-semibold">
                            {user?.name || "Anonymous User"}
                          </h3>
                          <Button
                            onClick={() => setIsEditing(true)}
                            variant="ghost"
                            size="sm"
                            className="self-start sm:self-center"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="w-4 h-4" />
                        <span>{user?.email || "No email"}</span>
                      </div>
                      {user?.registration && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          <span>
                            Joined{" "}
                            {format(
                              new Date(user.registration),
                              "MMMM d, yyyy"
                            )}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Account Information */}
                <div className="p-6 border rounded-xl bg-card shadow-sm">
                  <h3 className="text-lg font-medium mb-4 pb-2 border-b border-border">
                    Account Information
                  </h3>
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <dt className="text-sm text-muted-foreground">
                        Account Type
                      </dt>
                      <dd className="font-medium flex items-center gap-2">
                        {tierInfo ? (
                          <>
                            <span className="capitalize">
                              {getTierDisplayInfo(tierInfo.tier).name} Plan
                            </span>
                            {tierInfo.tier === "premium" && (
                              <span className="px-2 py-0.5 text-xs font-medium bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full">
                                PRO
                              </span>
                            )}
                            {tierInfo.tier === "admin" && (
                              <span className="px-2 py-0.5 text-xs font-medium bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full">
                                ADMIN
                              </span>
                            )}
                          </>
                        ) : (
                          "Loading..."
                        )}
                      </dd>
                    </div>
                    <div className="space-y-1">
                      <dt className="text-sm text-muted-foreground">
                        Authentication
                      </dt>
                      <dd className="font-medium">Email</dd>
                    </div>
                    <div className="space-y-1">
                      <dt className="text-sm text-muted-foreground">
                        Email Status
                      </dt>
                      <dd className="flex items-center gap-1">
                        {user?.emailVerification ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            <span className="text-emerald-600 dark:text-emerald-400">
                              Verified
                            </span>
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="w-4 h-4 text-amber-500" />
                            <span className="text-amber-600 dark:text-amber-400">
                              Unverified
                            </span>
                          </>
                        )}
                      </dd>
                    </div>
                    <div className="space-y-1">
                      <dt className="text-sm text-muted-foreground">User ID</dt>
                      <dd className="font-mono text-xs text-muted-foreground">
                        {user?.$id || "N/A"}
                      </dd>
                    </div>
                  </dl>

                  {/* Current Plan Limits */}
                  {tierInfo && tierInfo.tier !== "admin" && (
                    <div className="mt-6 pt-4 border-t border-border">
                      <h4 className="text-sm font-medium text-muted-foreground mb-3">
                        Current Usage
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">
                              Free Models
                            </span>
                            <span className="font-medium">
                              {tierInfo.freeCredits} /{" "}
                              {
                                getTierDisplayInfo(tierInfo.tier).limits
                                  .freeCredits
                              }
                            </span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div
                              className="bg-green-500 h-2 rounded-full transition-all duration-300"
                              style={{
                                width: `${Math.max(
                                  0,
                                  Math.min(
                                    100,
                                    (tierInfo.freeCredits /
                                      getTierDisplayInfo(tierInfo.tier).limits
                                        .freeCredits) *
                                      100
                                  )
                                )}%`,
                              }}
                            ></div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">
                              Premium
                            </span>
                            <span className="font-medium">
                              {tierInfo.premiumCredits} /{" "}
                              {
                                getTierDisplayInfo(tierInfo.tier).limits
                                  .premiumCredits
                              }
                            </span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div
                              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                              style={{
                                width: `${Math.max(
                                  0,
                                  Math.min(
                                    100,
                                    (tierInfo.premiumCredits /
                                      getTierDisplayInfo(tierInfo.tier).limits
                                        .premiumCredits) *
                                      100
                                  )
                                )}%`,
                              }}
                            ></div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">
                              Super Premium
                            </span>
                            <span className="font-medium">
                              {tierInfo.superPremiumCredits} /{" "}
                              {
                                getTierDisplayInfo(tierInfo.tier).limits
                                  .superPremiumCredits
                              }
                            </span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div
                              className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                              style={{
                                width: `${Math.max(
                                  0,
                                  Math.min(
                                    100,
                                    (tierInfo.superPremiumCredits /
                                      getTierDisplayInfo(tierInfo.tier).limits
                                        .superPremiumCredits) *
                                      100
                                  )
                                )}%`,
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 text-xs text-muted-foreground">
                        {tierInfo.lastResetDate && (
                          <p>
                            • Last reset:{" "}
                            {format(
                              new Date(tierInfo.lastResetDate),
                              "MMMM d, yyyy"
                            )}
                          </p>
                        )}
                        <p>• Credits reset monthly on the 1st of each month</p>
                      </div>
                    </div>
                  )}

                  {tierInfo?.tier === "admin" && (
                    <div className="mt-6 pt-4 border-t border-border">
                      <div className="text-center py-4">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20 rounded-lg">
                          <Shield className="w-4 h-4 text-orange-500" />
                          <span className="text-sm font-medium text-orange-600 dark:text-orange-400">
                            Administrator - Unlimited Access
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Custom Profile Section */}
                <div className="p-6 border rounded-xl bg-card shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <User className="h-5 w-5 text-primary" />
                        <h3 className="text-lg font-medium">Custom Profile</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Personalize your AI chat experience with custom information
                      </p>
                    </div>
                    {!isEditingProfile && (customProfile.customName || customProfile.aboutUser) && (
                      <Button
                        onClick={handleClearCustomProfile}
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                        disabled={profileLoading}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Clear Profile
                      </Button>
                    )}
                  </div>

                  {isEditingProfile ? (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">
                          Preferred Name
                        </label>
                        <Input
                          value={tempCustomName}
                          onChange={(e) => setTempCustomName(e.target.value)}
                          placeholder="How would you like the AI to address you?"
                          disabled={profileLoading}
                        />
                        <p className="text-xs text-muted-foreground">
                          The AI will use this name when addressing you in conversations
                        </p>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">
                          About You
                        </label>
                        <Textarea
                          value={tempAboutUser}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value.length <= 500) {
                              setTempAboutUser(value);
                            }
                          }}
                          placeholder="Tell the AI about yourself, your interests, profession, or anything that would help personalize responses..."
                          className="min-h-[100px] resize-none"
                          disabled={profileLoading}
                        />
                        <p className="text-xs text-muted-foreground">
                          This information helps the AI provide more personalized and relevant responses ({tempAboutUser.length}/500 characters)
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={handleUpdateCustomProfile}
                          disabled={profileLoading}
                          className="flex items-center gap-1"
                        >
                          <Save className="w-4 h-4" />
                          {profileLoading ? "Saving..." : "Save Profile"}
                        </Button>
                        <Button
                          onClick={handleCancelCustomProfile}
                          variant="outline"
                          disabled={profileLoading}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {customProfile.customName || customProfile.aboutUser ? (
                        <div className="space-y-3">
                          {customProfile.customName && (
                            <div className="p-3 rounded-lg bg-muted/30">
                              <div className="text-sm font-medium text-foreground mb-1">
                                Preferred Name
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {customProfile.customName}
                              </div>
                            </div>
                          )}

                          {customProfile.aboutUser && (
                            <div className="p-3 rounded-lg bg-muted/30">
                              <div className="text-sm font-medium text-foreground mb-1">
                                About You
                              </div>
                              <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                                {customProfile.aboutUser}
                              </div>
                            </div>
                          )}

                          <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Custom profile is active - AI responses will be personalized</span>
                          </div>
                        </div>
                      ) : (
                        <div className="rounded-lg bg-muted/50 p-4">
                          <div className="flex items-start gap-4">
                            <div className="p-2 rounded-full bg-muted">
                              <User className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm">
                                Set up a custom profile to personalize your AI chat experience.
                              </p>
                              <p className="text-sm text-muted-foreground mt-2">
                                Add your preferred name and information about yourself to help the AI provide more relevant and personalized responses.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      <Button
                        onClick={() => setIsEditingProfile(true)}
                        variant="outline"
                        className="flex items-center gap-2"
                      >
                        <Edit2 className="w-4 h-4" />
                        {customProfile.customName || customProfile.aboutUser ? "Edit Profile" : "Set Up Profile"}
                      </Button>
                    </div>
                  )}
                </div>

                {/* Account Actions */}
                <div className="p-6 border rounded-xl bg-card shadow-sm">
                  <h3 className="text-lg font-medium mb-4 pb-2 border-b border-border">
                    Account Actions
                  </h3>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button
                      onClick={handleLogout}
                      variant="destructive"
                      className="flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Privacy & Security Section */}
            {activeSection === "privacy" && (
              <div className="space-y-6">
                {/* Privacy Principles */}
                <div className="p-6 border rounded-xl bg-card shadow-sm">
                  <h3 className="text-lg font-medium mb-4 pb-2 border-b border-border">
                    Privacy Principles
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                      <Lock className="w-5 h-5 text-primary mt-0.5" />
                      <div>
                        <h4 className="font-medium text-sm">
                          End-to-End Encryption
                        </h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          Your conversations are encrypted in transit and at
                          rest.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                      <Eye className="w-5 h-5 text-primary mt-0.5" />
                      <div>
                        <h4 className="font-medium text-sm">
                          Data Transparency
                        </h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          We clearly explain what data we collect and how we use
                          it.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                      <Database className="w-5 h-5 text-primary mt-0.5" />
                      <div>
                        <h4 className="font-medium text-sm">
                          Minimal Data Collection
                        </h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          We only collect information necessary to provide our
                          services.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                      <Trash2 className="w-5 h-5 text-primary mt-0.5" />
                      <div>
                        <h4 className="font-medium text-sm">
                          Data Deletion Controls
                        </h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          You have full control over your data and can delete it
                          anytime.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Security Measures */}
                <div className="p-6 border rounded-xl bg-card shadow-sm">
                  <h3 className="text-lg font-medium mb-4 pb-2 border-b border-border">
                    Security Measures
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                      <Server className="w-5 h-5 text-primary mt-0.5" />
                      <div>
                        <h4 className="font-medium text-sm">
                          Secure Infrastructure
                        </h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          Industry-leading cloud providers with rigorous
                          security controls.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                      <FileCheck className="w-5 h-5 text-primary mt-0.5" />
                      <div>
                        <h4 className="font-medium text-sm">Regular Audits</h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          Regular security assessments and vulnerability
                          testing.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                      <Users className="w-5 h-5 text-primary mt-0.5" />
                      <div>
                        <h4 className="font-medium text-sm">Access Controls</h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          Strict internal access controls with comprehensive
                          audit logging.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                      <Shield className="w-5 h-5 text-primary mt-0.5" />
                      <div>
                        <h4 className="font-medium text-sm">Compliance</h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          We follow industry standards and best practices for
                          data protection.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Data Information */}
                <div className="p-6 border rounded-xl bg-card shadow-sm">
                  <h3 className="text-lg font-medium mb-4 pb-2 border-b border-border">
                    Your Data
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-emerald-500 mt-0.5" />
                      <span>
                        Your conversations are stored securely and encrypted
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-emerald-500 mt-0.5" />
                      <span>
                        We never sell your personal data to third parties
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-emerald-500 mt-0.5" />
                      <span>
                        You can export or delete your data at any time
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-emerald-500 mt-0.5" />
                      <span>
                        API keys are stored locally in your browser only
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Application Settings Section */}
            {activeSection === "settings" && (
              <div className="space-y-6">
                {/* Theme Settings Card */}
                <div className="p-6 border rounded-xl bg-card shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="space-y-1">
                      <h3 className="text-lg font-medium">Theme Settings</h3>
                      <p className="text-sm text-muted-foreground">
                        Customize the visual appearance of AT Chat
                      </p>
                    </div>
                    <ThemeToggleButton variant="inline" />
                  </div>

                  <div className="flex justify-center">
                    <div className="grid grid-cols-2 sm:grid-cols-2 gap-4 mt-6 max-w-md">
                      <div
                        onClick={() => setTheme("light")}
                        className={`flex flex-col items-center gap-2 p-4 rounded-lg border ${
                          theme === "light" ? "border-primary" : ""
                        } bg-background/50 cursor-pointer hover:bg-background/80 transition-colors`}
                      >
                        <Sun className="h-6 w-6 text-amber-500" />
                        <span className="text-sm font-medium">Light</span>
                        <span className="text-xs text-muted-foreground">
                          For bright environments
                        </span>
                      </div>
                      <div
                        onClick={() => setTheme("dark")}
                        className={`flex flex-col items-center gap-2 p-4 rounded-lg border ${
                          theme === "dark" ? "border-primary" : ""
                        } bg-background/50 cursor-pointer hover:bg-background/80 transition-colors`}
                      >
                        <Moon className="h-6 w-6 text-indigo-500" />
                        <span className="text-sm font-medium">Dark</span>
                        <span className="text-xs text-muted-foreground">
                          Reduce eye strain
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bring Your Own Key (BYOK) Card */}
                <div className="p-6 border rounded-xl bg-card shadow-sm">
                  <div className="space-y-1 mb-4">
                    <div className="flex items-center gap-2">
                      <Key className="h-5 w-5 text-primary" />
                      <h3 className="text-lg font-medium">
                        Bring Your Own Key
                      </h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Use your own OpenRouter API key for unlimited access to AI
                      models
                    </p>
                  </div>

                  {hasOpenRouterKey() ? (
                    // Key is configured
                    <div className="space-y-4">
                      <div className="rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 p-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/30">
                            <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-green-800 dark:text-green-200">
                              OpenRouter API Key Configured
                            </p>
                            <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                              Key: {maskKey(openRouterApiKey || "")}
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleRemoveKey}
                            className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                          >
                            <X className="h-4 w-4 mr-1" />
                            Remove
                          </Button>
                        </div>
                      </div>

                      <div className="text-xs text-muted-foreground">
                        <p>
                          ✓ Your API key is stored securely in your browser only
                        </p>
                        <p>
                          ✓ Models will show a key icon when using your API key
                        </p>
                        <p>✓ Fallback to system key if your key fails</p>
                      </div>
                    </div>
                  ) : (
                    // No key configured
                    <div className="space-y-4">
                      <div className="rounded-lg bg-muted/50 p-4">
                        <div className="flex items-start gap-4">
                          <div className="p-2 rounded-full bg-muted">
                            <Key className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm">
                              Add your OpenRouter API key to use your own
                              credits and access all available models.
                            </p>
                            <p className="text-sm text-muted-foreground mt-2">
                              Get your API key from{" "}
                              <a
                                href="https://openrouter.ai/settings/keys"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline"
                              >
                                OpenRouter Settings
                              </a>
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">
                            OpenRouter API Key
                          </label>
                          <div className="relative">
                            <Input
                              type={showKey ? "text" : "password"}
                              placeholder="sk-or-..."
                              value={keyInput}
                              onChange={(e) => {
                                setKeyInput(e.target.value);
                                setKeyError("");
                              }}
                              className={keyError ? "border-red-500" : ""}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                              onClick={() => setShowKey(!showKey)}
                            >
                              {showKey ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                          {keyError && (
                            <p className="text-sm text-red-600">{keyError}</p>
                          )}
                          {keySaved && (
                            <p className="text-sm text-green-600">
                              ✓ API key saved successfully!
                            </p>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <Button
                            onClick={handleSaveKey}
                            disabled={!keyInput.trim()}
                          >
                            <Key className="h-4 w-4 mr-2" />
                            Save API Key
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* OpenAI API Key (for Voice Input) Card */}
                <div className="p-6 border rounded-xl bg-card shadow-sm">
                  <div className="space-y-1 mb-4">
                    <div className="flex items-center gap-2">
                      <Key className="h-5 w-5 text-primary" />
                      <h3 className="text-lg font-medium">OpenAI API Key</h3>
                      <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full">
                        Voice Input
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Use your own OpenAI API key for voice input powered by
                      Whisper
                    </p>
                  </div>

                  {hasOpenAIKey() ? (
                    // OpenAI Key is configured
                    <div className="space-y-4">
                      <div className="rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 p-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/30">
                            <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-green-800 dark:text-green-200">
                              OpenAI API Key Configured
                            </p>
                            <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                              Key: {maskKey(openAIApiKey || "")}
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleRemoveOpenAIKey}
                            className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Remove
                          </Button>
                        </div>
                      </div>

                      <div className="text-xs text-muted-foreground">
                        <p>
                          ✓ Your OpenAI API key is stored securely in your
                          browser only
                        </p>
                        <p>
                          ✓ Used exclusively for voice input transcription via
                          Whisper
                        </p>
                        <p>✓ Fallback to system key if your key fails</p>
                      </div>
                    </div>
                  ) : (
                    // No OpenAI key configured
                    <div className="space-y-4">
                      <div className="rounded-lg bg-muted/50 p-4">
                        <div className="flex items-start gap-4">
                          <div className="p-2 rounded-full bg-muted">
                            <Key className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm">
                              Add your OpenAI API key to use your own credits
                              for voice input transcription.
                            </p>
                            <p className="text-sm text-muted-foreground mt-2">
                              Get your API key from{" "}
                              <a
                                href="https://platform.openai.com/api-keys"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline"
                              >
                                OpenAI Platform
                              </a>
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">
                            OpenAI API Key
                          </label>
                          <div className="relative">
                            <Input
                              type={showOpenAIKey ? "text" : "password"}
                              placeholder="sk-..."
                              value={openAIKeyInput}
                              onChange={(e) => {
                                setOpenAIKeyInput(e.target.value);
                                setOpenAIKeyError("");
                              }}
                              className={openAIKeyError ? "border-red-500" : ""}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                              onClick={() => setShowOpenAIKey(!showOpenAIKey)}
                            >
                              {showOpenAIKey ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                          {openAIKeyError && (
                            <p className="text-sm text-red-600">
                              {openAIKeyError}
                            </p>
                          )}
                          {openAIKeySaved && (
                            <p className="text-sm text-green-600">
                              ✓ OpenAI API key saved successfully!
                            </p>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <Button
                            onClick={handleSaveOpenAIKey}
                            disabled={!openAIKeyInput.trim()}
                          >
                            <Key className="h-4 w-4 mr-2" />
                            Save OpenAI Key
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Tier Management Card */}
                <div className="p-6 border rounded-xl bg-card shadow-sm">
                  <div className="space-y-1 mb-4">
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-primary" />
                      <h3 className="text-lg font-medium">Usage & Plan</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      View your current plan and usage limits
                    </p>
                  </div>

                  {loadingTier ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : tierInfo ? (
                    <div className="space-y-4">
                      {/* Current Plan */}
                      <div className="rounded-lg bg-primary/5 border border-primary/20 p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="font-semibold text-primary capitalize">
                              {getTierDisplayInfo(tierInfo.tier).name} Plan
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              {tierInfo.tier === "admin"
                                ? "Unlimited access to all models"
                                : "Monthly credit limits"}
                            </p>
                          </div>
                          {tierInfo.tier !== "admin" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                window.open(
                                  "mailto:ayush@atchat.app?subject=Upgrade Plan Request",
                                  "_blank"
                                )
                              }
                              className="text-primary border-primary hover:bg-primary hover:text-primary-foreground"
                            >
                              Upgrade Plan
                            </Button>
                          )}
                        </div>

                        {/* Usage Stats */}
                        {tierInfo.tier !== "admin" && (
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">
                                  Free Models
                                </span>
                                <span className="font-medium">
                                  {tierInfo.freeCredits} /{" "}
                                  {
                                    getTierDisplayInfo(tierInfo.tier).limits
                                      .freeCredits
                                  }
                                </span>
                              </div>
                              <div className="w-full bg-muted rounded-full h-2">
                                <div
                                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
                                  style={{
                                    width: `${Math.max(
                                      0,
                                      Math.min(
                                        100,
                                        (tierInfo.freeCredits /
                                          getTierDisplayInfo(tierInfo.tier)
                                            .limits.freeCredits) *
                                          100
                                      )
                                    )}%`,
                                  }}
                                ></div>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">
                                  Premium Models
                                </span>
                                <span className="font-medium">
                                  {tierInfo.premiumCredits} /{" "}
                                  {
                                    getTierDisplayInfo(tierInfo.tier).limits
                                      .premiumCredits
                                  }
                                </span>
                              </div>
                              <div className="w-full bg-muted rounded-full h-2">
                                <div
                                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                  style={{
                                    width: `${Math.max(
                                      0,
                                      Math.min(
                                        100,
                                        (tierInfo.premiumCredits /
                                          getTierDisplayInfo(tierInfo.tier)
                                            .limits.premiumCredits) *
                                          100
                                      )
                                    )}%`,
                                  }}
                                ></div>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">
                                  Super Premium
                                </span>
                                <span className="font-medium">
                                  {tierInfo.superPremiumCredits} /{" "}
                                  {
                                    getTierDisplayInfo(tierInfo.tier).limits
                                      .superPremiumCredits
                                  }
                                </span>
                              </div>
                              <div className="w-full bg-muted rounded-full h-2">
                                <div
                                  className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                                  style={{
                                    width: `${Math.max(
                                      0,
                                      Math.min(
                                        100,
                                        (tierInfo.superPremiumCredits /
                                          getTierDisplayInfo(tierInfo.tier)
                                            .limits.superPremiumCredits) *
                                          100
                                      )
                                    )}%`,
                                  }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        )}

                        {tierInfo.tier === "admin" && (
                          <div className="text-center py-4">
                            <p className="text-sm text-muted-foreground">
                              ✨ You have unlimited access to all models
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Plan Information */}
                      <div className="text-xs text-muted-foreground space-y-1">
                        <p>• Credits reset monthly on the 1st of each month</p>
                        <p>
                          • Free models include basic AI models without premium
                          features
                        </p>
                        <p>
                          • Premium models include advanced AI models with
                          enhanced capabilities
                        </p>
                        <p>
                          • Super Premium models include the most advanced AI
                          models with cutting-edge features
                        </p>
                        {tierInfo.lastResetDate && (
                          <p>
                            • Last reset:{" "}
                            {format(
                              new Date(tierInfo.lastResetDate),
                              "MMMM d, yyyy"
                            )}
                          </p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-sm text-muted-foreground">
                        Unable to load tier information. Please refresh the
                        page.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Admin Dashboard Section */}
            {activeSection === "admin" && tierInfo?.tier === "admin" && (
              <div className="space-y-6">
                {/* Admin Dashboard Header */}
                <div className="p-6 border rounded-xl bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20 border-orange-200 dark:border-orange-800 shadow-lg">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-full bg-gradient-to-r from-orange-500 to-red-500">
                      <Shield className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-orange-800 dark:text-orange-200">
                        Admin Dashboard
                      </h3>
                      <p className="text-sm text-orange-600 dark:text-orange-400">
                        System administration and user management
                      </p>
                    </div>
                  </div>

                  <div className="bg-white/50 dark:bg-black/20 rounded-lg p-4 border border-orange-200/50 dark:border-orange-800/50">
                    <div className="flex items-start gap-3 mb-3">
                      <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                          Administrative Access Required
                        </p>
                        <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                          Enter your admin secret key to access system
                          management features
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Admin Secret Key
                      </label>
                      <Input
                        type="password"
                        placeholder="Enter admin secret key"
                        value={adminKey}
                        onChange={(e) => setAdminKey(e.target.value)}
                        className="bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600"
                      />
                    </div>
                  </div>
                </div>

                {/* Statistics Dashboard */}
                <div className="p-6 border rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800 shadow-lg">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500">
                        <Database className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-blue-800 dark:text-blue-200">
                          Platform Statistics
                        </h4>
                        <p className="text-sm text-blue-600 dark:text-blue-400">
                          Real-time system metrics and analytics
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={handleLoadStats}
                      disabled={loadingStats || !adminKey.trim()}
                      size="sm"
                      className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white border-0"
                    >
                      {loadingStats ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
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
                      <div className="bg-white/50 dark:bg-black/20 rounded-lg p-4 border border-blue-200/50 dark:border-blue-800/50">
                        <div className="flex items-center gap-2 mb-4">
                          <Users className="h-4 w-4 text-blue-600" />
                          <h5 className="text-sm font-semibold text-blue-800 dark:text-blue-200">
                            User Statistics
                          </h5>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                          <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 p-4 rounded-lg text-center border border-slate-200 dark:border-slate-700 shadow-sm">
                            <div className="flex items-center justify-center mb-2">
                              <User className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                            </div>
                            <p className="text-2xl font-bold text-slate-700 dark:text-slate-300">
                              {adminStats.users.total}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                              Total Users
                            </p>
                          </div>
                          <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-4 rounded-lg text-center border border-green-200 dark:border-green-700 shadow-sm">
                            <div className="flex items-center justify-center mb-2">
                              <CheckCircle2 className="h-5 w-5 text-green-600" />
                            </div>
                            <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                              {adminStats.users.verified}
                            </p>
                            <p className="text-xs text-green-600 dark:text-green-400 font-medium">
                              Verified
                            </p>
                          </div>
                          <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 p-4 rounded-lg text-center border border-amber-200 dark:border-amber-700 shadow-sm">
                            <div className="flex items-center justify-center mb-2">
                              <AlertTriangle className="h-5 w-5 text-amber-600" />
                            </div>
                            <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">
                              {adminStats.users.unverified}
                            </p>
                            <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                              Unverified
                            </p>
                          </div>
                          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-4 rounded-lg text-center border border-blue-200 dark:border-blue-700 shadow-sm">
                            <div className="flex items-center justify-center mb-2">
                              <Calendar className="h-5 w-5 text-blue-600" />
                            </div>
                            <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                              {adminStats.users.recentlyRegistered}
                            </p>
                            <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                              Last 30 Days
                            </p>
                          </div>
                          <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-4 rounded-lg text-center border border-purple-200 dark:border-purple-700 shadow-sm">
                            <div className="flex items-center justify-center mb-2">
                              <User className="h-5 w-5 text-purple-600" />
                            </div>
                            <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                              {adminStats.users.registeredToday}
                            </p>
                            <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">
                              Today
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Database Statistics */}
                      <div className="bg-white/50 dark:bg-black/20 rounded-lg p-4 border border-blue-200/50 dark:border-blue-800/50">
                        <div className="flex items-center gap-2 mb-4">
                          <Database className="h-4 w-4 text-blue-600" />
                          <h5 className="text-sm font-semibold text-blue-800 dark:text-blue-200">
                            Database Statistics
                          </h5>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/40 dark:to-indigo-800/40 p-4 rounded-lg text-center border border-indigo-200 dark:border-indigo-600 shadow-sm">
                            <div className="flex items-center justify-center mb-2">
                              <FileCheck className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <p className="text-2xl font-bold text-indigo-700 dark:text-indigo-200">
                              {adminStats.database.threads.toLocaleString()}
                            </p>
                            <p className="text-xs text-indigo-600 dark:text-indigo-300 font-medium">
                              Total Threads
                            </p>
                          </div>
                          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/40 dark:to-emerald-800/40 p-4 rounded-lg text-center border border-emerald-200 dark:border-emerald-600 shadow-sm">
                            <div className="flex items-center justify-center mb-2">
                              <Mail className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-200">
                              {adminStats.database.messages.toLocaleString()}
                            </p>
                            <p className="text-xs text-emerald-600 dark:text-emerald-300 font-medium">
                              Total Messages
                            </p>
                          </div>
                          <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/40 dark:to-orange-800/40 p-4 rounded-lg text-center border border-orange-200 dark:border-orange-600 shadow-sm">
                            <div className="flex items-center justify-center mb-2">
                              <Folder className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                            </div>
                            <p className="text-2xl font-bold text-orange-700 dark:text-orange-200">
                              {adminStats.database.projects.toLocaleString()}
                            </p>
                            <p className="text-xs text-orange-600 dark:text-orange-300 font-medium">
                              Total Projects
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Tier Distribution */}
                      <div className="bg-white/50 dark:bg-black/20 rounded-lg p-4 border border-blue-200/50 dark:border-blue-800/50">
                        <div className="flex items-center gap-2 mb-4">
                          <Users className="h-4 w-4 text-blue-600" />
                          <h5 className="text-sm font-semibold text-blue-800 dark:text-blue-200">
                            Tier Distribution
                          </h5>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 p-4 rounded-lg text-center border border-gray-200 dark:border-gray-700 shadow-sm">
                            <div className="flex items-center justify-center mb-2">
                              <User className="h-5 w-5 text-gray-600" />
                            </div>
                            <p className="text-2xl font-bold text-gray-700 dark:text-gray-300">
                              {adminStats.tiers.distribution.free}
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                              Free Users
                            </p>
                          </div>
                          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-4 rounded-lg text-center border border-blue-200 dark:border-blue-700 shadow-sm">
                            <div className="flex items-center justify-center mb-2">
                              <Shield className="h-5 w-5 text-blue-600" />
                            </div>
                            <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                              {adminStats.tiers.distribution.premium}
                            </p>
                            <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                              Premium Users
                            </p>
                          </div>
                          <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-4 rounded-lg text-center border border-purple-200 dark:border-purple-700 shadow-sm">
                            <div className="flex items-center justify-center mb-2">
                              <Shield className="h-5 w-5 text-purple-600" />
                            </div>
                            <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                              {adminStats.tiers.distribution.admin}
                            </p>
                            <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">
                              Admin Users
                            </p>
                          </div>
                          <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 p-4 rounded-lg text-center border border-red-200 dark:border-red-700 shadow-sm">
                            <div className="flex items-center justify-center mb-2">
                              <AlertTriangle className="h-5 w-5 text-red-600" />
                            </div>
                            <p className="text-2xl font-bold text-red-700 dark:text-red-300">
                              {adminStats.tiers.distribution.uninitialized}
                            </p>
                            <p className="text-xs text-red-600 dark:text-red-400 font-medium">
                              Uninitialized
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Credit Statistics */}
                      <div className="bg-white/50 dark:bg-black/20 rounded-lg p-4 border border-blue-200/50 dark:border-blue-800/50">
                        <div className="flex items-center gap-2 mb-4">
                          <Key className="h-4 w-4 text-blue-600" />
                          <h5 className="text-sm font-semibold text-blue-800 dark:text-blue-200">
                            Total Credits Remaining
                          </h5>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-4 rounded-lg text-center border border-green-200 dark:border-green-700 shadow-sm">
                            <div className="flex items-center justify-center mb-2">
                              <CheckCircle2 className="h-6 w-6 text-green-600" />
                            </div>
                            <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                              {adminStats.tiers.credits.totalFreeCredits.toLocaleString()}
                            </p>
                            <p className="text-xs text-green-600 dark:text-green-400 font-medium">
                              Free Credits
                            </p>
                          </div>
                          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-4 rounded-lg text-center border border-blue-200 dark:border-blue-700 shadow-sm">
                            <div className="flex items-center justify-center mb-2">
                              <Shield className="h-6 w-6 text-blue-600" />
                            </div>
                            <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                              {adminStats.tiers.credits.totalPremiumCredits.toLocaleString()}
                            </p>
                            <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                              Premium Credits
                            </p>
                          </div>
                          <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-4 rounded-lg text-center border border-purple-200 dark:border-purple-700 shadow-sm">
                            <div className="flex items-center justify-center mb-2">
                              <Key className="h-6 w-6 text-purple-600" />
                            </div>
                            <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                              {adminStats.tiers.credits.totalSuperPremiumCredits.toLocaleString()}
                            </p>
                            <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">
                              Super Premium Credits
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="text-xs text-muted-foreground">
                        Last updated:{" "}
                        {new Date(adminStats.lastUpdated).toLocaleString()}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-sm text-muted-foreground">
                        Click "Load Stats" to view platform statistics
                      </p>
                    </div>
                  )}
                </div>

                {/* System Operations */}
                <div className="p-6 border rounded-xl bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20 border-red-200 dark:border-red-800 shadow-lg">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 rounded-full bg-gradient-to-r from-red-500 to-orange-500">
                      <AlertTriangle className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-red-800 dark:text-red-200">
                        System Operations
                      </h4>
                      <p className="text-sm text-red-600 dark:text-red-400">
                        Critical system-wide operations
                      </p>
                    </div>
                  </div>

                  {/* Danger Warning */}
                  <div className="bg-red-100 dark:bg-red-900/30 border-2 border-red-300 dark:border-red-700 p-4 rounded-lg mb-6">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-bold text-red-800 dark:text-red-200 mb-1">
                          ⚠️ DANGER ZONE - CRITICAL OPERATIONS
                        </p>
                        <p className="text-xs text-red-700 dark:text-red-300 leading-relaxed">
                          These operations affect all users and cannot be
                          undone. Use extreme caution and ensure you have proper
                          authorization before proceeding. Always notify users
                          before performing system-wide operations.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* Monthly Credit Reset */}
                    <div className="bg-white/60 dark:bg-black/30 border border-red-200/50 dark:border-red-700/50 p-4 rounded-lg">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 rounded-full bg-red-100 dark:bg-red-900/30">
                          <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-red-800 dark:text-red-200">
                            Monthly Credit Reset
                          </p>
                          <p className="text-xs text-red-600 dark:text-red-400">
                            Reset all user credits to their tier limits (affects
                            all users)
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleMonthlyReset}
                        disabled={isAdminLoading || !adminKey.trim()}
                        className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
                      >
                        {isAdminLoading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Resetting...
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="h-4 w-4 mr-2" />
                            Perform Monthly Reset
                          </>
                        )}
                      </Button>
                    </div>

                    {/* Logout All Users */}
                    <div className="bg-white/60 dark:bg-black/30 border border-red-200/50 dark:border-red-700/50 p-4 rounded-lg">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 rounded-full bg-orange-100 dark:bg-orange-900/30">
                          <LogOut className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-red-800 dark:text-red-200">
                            Logout All Users
                          </p>
                          <p className="text-xs text-red-600 dark:text-red-400">
                            Force logout all active user sessions (emergency use
                            only)
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleLogoutAllUsers}
                        disabled={isAdminLoading || !adminKey.trim()}
                        className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                      >
                        {isAdminLoading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Processing...
                          </>
                        ) : (
                          <>
                            <LogOut className="h-4 w-4 mr-2" />
                            Logout All Users
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* User Search */}
                <div className="p-6 border rounded-xl bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-900/20 dark:to-gray-900/20 border-slate-200 dark:border-slate-700 shadow-lg">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-full bg-gradient-to-r from-slate-500 to-gray-500">
                      <User className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-slate-800 dark:text-slate-200">
                        Search User
                      </h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Find and manage user accounts
                      </p>
                    </div>
                  </div>

                  <div className="bg-white/50 dark:bg-black/20 rounded-lg p-4 border border-slate-200/50 dark:border-slate-700/50">
                    <div className="flex gap-3">
                      <Input
                        placeholder="Enter user email address"
                        value={userEmail}
                        onChange={(e) => setUserEmail(e.target.value)}
                        className="flex-1 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600"
                      />
                      <Button
                        onClick={handleSearchUser}
                        disabled={
                          isAdminLoading ||
                          !adminKey.trim() ||
                          !userEmail.trim()
                        }
                        className="bg-gradient-to-r from-slate-500 to-gray-500 hover:from-slate-600 hover:to-gray-600 text-white border-0"
                      >
                        {isAdminLoading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
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
                  </div>
                </div>

                {/* User Management */}
                {selectedUser && (
                  <div className="p-6 border rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border-emerald-200 dark:border-emerald-700 shadow-lg">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500">
                        <Settings className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-emerald-800 dark:text-emerald-200">
                          User Management
                        </h4>
                        <p className="text-sm text-emerald-600 dark:text-emerald-400">
                          Manage user account and permissions
                        </p>
                      </div>
                    </div>

                    {/* User Info */}
                    <div className="bg-white/60 dark:bg-black/30 p-5 rounded-lg mb-6 border border-emerald-200/50 dark:border-emerald-700/50">
                      <div className="flex items-center gap-3 mb-4">
                        <User className="h-5 w-5 text-emerald-600" />
                        <h5 className="text-md font-semibold text-emerald-800 dark:text-emerald-200">
                          User Information
                        </h5>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-emerald-50/50 dark:bg-emerald-900/20 p-3 rounded-lg border border-emerald-200/30 dark:border-emerald-700/30">
                          <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                            Email
                          </p>
                          <p className="font-semibold text-emerald-900 dark:text-emerald-100">
                            {selectedUser.email}
                          </p>
                        </div>
                        <div className="bg-emerald-50/50 dark:bg-emerald-900/20 p-3 rounded-lg border border-emerald-200/30 dark:border-emerald-700/30">
                          <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                            Name
                          </p>
                          <p className="font-semibold text-emerald-900 dark:text-emerald-100">
                            {selectedUser.name || "N/A"}
                          </p>
                        </div>
                        <div className="bg-emerald-50/50 dark:bg-emerald-900/20 p-3 rounded-lg border border-emerald-200/30 dark:border-emerald-700/30">
                          <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                            User ID
                          </p>
                          <p className="font-mono text-xs text-emerald-800 dark:text-emerald-200">
                            {selectedUser.$id}
                          </p>
                        </div>
                        <div className="bg-emerald-50/50 dark:bg-emerald-900/20 p-3 rounded-lg border border-emerald-200/30 dark:border-emerald-700/30">
                          <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                            Current Tier
                          </p>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-emerald-900 dark:text-emerald-100 capitalize">
                              {selectedUser.preferences?.tier || "N/A"}
                            </p>
                            {selectedUser.preferences?.tier === "premium" && (
                              <span className="px-2 py-0.5 text-xs font-medium bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full">
                                PRO
                              </span>
                            )}
                            {selectedUser.preferences?.tier === "admin" && (
                              <span className="px-2 py-0.5 text-xs font-medium bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full">
                                ADMIN
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Credits Info */}
                      {selectedUser.preferences && (
                        <div className="mt-4 pt-4 border-t border-emerald-200/50 dark:border-emerald-700/50">
                          <div className="flex items-center gap-2 mb-3">
                            <Key className="h-4 w-4 text-emerald-600" />
                            <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                              Current Credits
                            </p>
                          </div>
                          <div className="grid grid-cols-3 gap-3">
                            <div className="bg-green-50/50 dark:bg-green-900/20 p-3 rounded-lg border border-green-200/30 dark:border-green-700/30 text-center">
                              <div className="flex items-center justify-center mb-1">
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                              </div>
                              <p className="text-xs font-medium text-green-700 dark:text-green-300">
                                Free
                              </p>
                              <p className="text-lg font-bold text-green-800 dark:text-green-200">
                                {selectedUser.preferences.freeCredits}
                              </p>
                            </div>
                            <div className="bg-blue-50/50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200/30 dark:border-blue-700/30 text-center">
                              <div className="flex items-center justify-center mb-1">
                                <Shield className="h-4 w-4 text-blue-600" />
                              </div>
                              <p className="text-xs font-medium text-blue-700 dark:text-blue-300">
                                Premium
                              </p>
                              <p className="text-lg font-bold text-blue-800 dark:text-blue-200">
                                {selectedUser.preferences.premiumCredits}
                              </p>
                            </div>
                            <div className="bg-purple-50/50 dark:bg-purple-900/20 p-3 rounded-lg border border-purple-200/30 dark:border-purple-700/30 text-center">
                              <div className="flex items-center justify-center mb-1">
                                <Key className="h-4 w-4 text-purple-600" />
                              </div>
                              <p className="text-xs font-medium text-purple-700 dark:text-purple-300">
                                Super Premium
                              </p>
                              <p className="text-lg font-bold text-purple-800 dark:text-purple-200">
                                {selectedUser.preferences.superPremiumCredits}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="space-y-6">
                      <div className="bg-white/60 dark:bg-black/30 p-4 rounded-lg border border-emerald-200/50 dark:border-emerald-700/50">
                        <div className="flex items-center gap-2 mb-3">
                          <Settings className="h-4 w-4 text-emerald-600" />
                          <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                            Update Tier
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateUserTier("free")}
                            disabled={isAdminLoading}
                            className="border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800"
                          >
                            <User className="h-4 w-4 mr-1" />
                            Set Free
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateUserTier("premium")}
                            disabled={isAdminLoading}
                            className="border-purple-300 text-purple-700 hover:bg-purple-50 dark:border-purple-600 dark:text-purple-300 dark:hover:bg-purple-900/20"
                          >
                            <Shield className="h-4 w-4 mr-1" />
                            Set Premium
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateUserTier("admin")}
                            disabled={isAdminLoading}
                            className="border-orange-300 text-orange-700 hover:bg-orange-50 dark:border-orange-600 dark:text-orange-300 dark:hover:bg-orange-900/20"
                          >
                            <Shield className="h-4 w-4 mr-1" />
                            Set Admin
                          </Button>
                        </div>
                      </div>

                      <div className="bg-white/60 dark:bg-black/30 p-4 rounded-lg border border-emerald-200/50 dark:border-emerald-700/50">
                        <div className="flex items-center gap-2 mb-3">
                          <AlertTriangle className="h-4 w-4 text-red-600" />
                          <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                            Reset Credits
                          </p>
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={handleResetUserCredits}
                          disabled={isAdminLoading}
                          className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
                        >
                          {isAdminLoading ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Resetting...
                            </>
                          ) : (
                            <>
                              <Trash2 className="h-4 w-4 mr-2" />
                              Reset Credits to Tier Limits
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Minimal Footer */}
          <footer className="w-full flex justify-center border-t border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-4 mt-8">
            <div className="container max-w-4xl flex flex-col sm:flex-row justify-between items-center gap-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <img src="/logo.png" alt="AtChat Logo" className="h-5 w-5" />
                <span>© 2025 AtChat. All rights reserved.</span>
              </div>
              <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
                <button
                  onClick={() => setActiveSection("profile")}
                  className={`hover:text-primary transition-colors ${
                    activeSection === "profile"
                      ? "text-primary font-medium"
                      : ""
                  }`}
                >
                  Profile
                </button>
                <button
                  onClick={() => setActiveSection("privacy")}
                  className={`hover:text-primary transition-colors ${
                    activeSection === "privacy"
                      ? "text-primary font-medium"
                      : ""
                  }`}
                >
                  Privacy
                </button>
                <button
                  onClick={() => setActiveSection("settings")}
                  className={`hover:text-primary transition-colors ${
                    activeSection === "settings"
                      ? "text-primary font-medium"
                      : ""
                  }`}
                >
                  Settings
                </button>
              </div>
            </div>
          </footer>
        </div>
      </main>
    </div>
  );
}
