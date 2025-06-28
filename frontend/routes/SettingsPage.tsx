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
  Trash2,
  ArrowLeft,
  Keyboard,
  MessageSquareMore,
  Sparkles,
} from "lucide-react";
import ThemeToggleButton from "../components/ui/ThemeComponents";
import { useTheme } from "next-themes";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import React, { useState, useEffect } from "react";
import { useBYOKStore } from "@/frontend/stores/BYOKStore";
import { useFontStore, FONT_OPTIONS } from "@/frontend/stores/FontStore";
import { useAuth } from "../contexts/AuthContext";
import { format } from "date-fns";
import { getUserTierInfo, getTierDisplayInfo } from "@/lib/tierSystem";
import {
  getUserCustomProfile,
  updateUserCustomProfile,
  clearUserCustomProfile,
  UserCustomProfile,
} from "@/lib/appwrite";
import { GitHubIcon, GoogleIcon, XIcon } from "../components/ui/icons";
import SessionManager from "../components/SessionManager";
import MemorySettings from "../components/MemorySettings";
import FileManager from "../components/FileManager";

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
  const { user, updateProfile, logout, getDetailedSessionInfo } = useAuth();

  // Platform detection helper
  const isMac =
    typeof window !== "undefined" &&
    (window.navigator.userAgent.includes("Mac") ||
      window.navigator.userAgent.includes("iPhone"));

  // Section navigation state - check for BYOK redirect
  const [activeSection, setActiveSection] = useState(() => {
    // Check if user was redirected for BYOK management
    const urlParams = new URLSearchParams(location.search);
    const section = urlParams.get("section");
    if (section === "byok" || section === "application") {
      return "application";
    }
    return "profile";
  });

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

  // Session info for provider detection
  const [sessionInfo, setSessionInfo] = useState<any>(null);

  // Get provider icon
  const getProviderIcon = (provider: string) => {
    switch (provider?.toLowerCase()) {
      case 'google':
        return <GoogleIcon className="w-4 h-4" />;
      case 'github':
        return <GitHubIcon className="w-4 h-4" />;
      case 'email':
        return <Mail className="w-4 h-4" />;
      default:
        return <Lock className="w-4 h-4" />;
    }
  };

  // Font store
  const { selectedFont, setFont } = useFontStore();

  // Apply font on component mount
  useEffect(() => {
    const font = FONT_OPTIONS.find((f) => f.id === selectedFont);
    if (font) {
      const root = document.documentElement;
      root.style.setProperty("--font-sans", font.fontFamily);
      document.body.style.fontFamily = font.fontFamily;
    }
  }, [selectedFont]);

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

  // Load session info for provider detection
  useEffect(() => {
    const loadSessionInfo = async () => {
      if (!user) return;

      try {
        const info = await getDetailedSessionInfo();
        setSessionInfo(info);
      } catch (error) {
        console.error("Error loading session info:", error);
      }
    };

    loadSessionInfo();
  }, [user, getDetailedSessionInfo]);

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
    if (
      !confirm(
        "Are you sure you want to clear your custom profile? This will remove all personalization from AI responses."
      )
    ) {
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="w-full px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between">
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
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Notification */}
          {notification && (
            <div
              className={`mb-6 p-4 rounded-lg border flex items-center space-x-3 ${
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

          {/* Settings Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Left Sidebar - User Profile */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 ">
                {/* User Profile Card */}
                <div className="p-6 border rounded-xl bg-card shadow-sm space-y-4">
                  {/* Profile Avatar */}
                  <div className="flex flex-col items-center text-center space-y-3">
                    <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary/20">
                      <User className="w-10 h-10 md:w-14 md:h-14 text-primary" />
                    </div>
                    <div className="space-y-1 w-full">
                      {/* Inline Name Editing */}
                      {isEditing ? (
                        <div className="space-y-2">
                          <Input
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            placeholder="Enter your name"
                            className="text-center text-lg font-semibold"
                            disabled={isLoading}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                handleUpdateProfile();
                              } else if (e.key === "Escape") {
                                handleCancel();
                              }
                            }}
                            autoFocus
                          />
                          <div className="flex gap-1 justify-center">
                            <Button
                              onClick={handleUpdateProfile}
                              size="sm"
                              disabled={isLoading}
                              className="h-7 px-2"
                            >
                              <Save className="w-3 h-3" />
                              Save
                            </Button>
                            <Button
                              onClick={handleCancel}
                              size="sm"
                              disabled={isLoading}
                              className="h-7 px-2 hover:bg-primary/25 bg-muted"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div
                          className="group cursor-pointer"
                          onClick={() => setIsEditing(true)}
                        >
                          <h3 className="text-lg font-semibold text-primary transition-colors flex items-center justify-center gap-1">
                            {user?.name || "Anonymous User"}
                            <Edit2 className="w-3 h-3 ml-2 opacity-100 transition-opacity" />
                          </h3>
                        </div>
                      )}
                      <p className="text-sm text-muted-foreground">
                        {user?.email || "No email"}
                      </p>
                      {user?.registration && (
                        <p className="text-xs text-muted-foreground">
                          Joined{" "}
                          {format(new Date(user.registration), "MMM d, yyyy")}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                {/* Keyboard Shortcuts */}
                <div className="p-4 border rounded-xl bg-card mt-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <Keyboard className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-medium">Keyboard Shortcuts</h3>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    {[
                      {
                        action: "New Chat",
                        keys: isMac ? ["Cmd", "O"] : ["Ctrl", "Shift", "O"],
                      },
                      {
                        action: "Search Chats",
                        keys: isMac ? ["Cmd", "K"] : ["Ctrl", "Shift", "K"],
                      },
                      {
                        action: "Toggle Sidebar",
                        keys: isMac ? ["Cmd", "B"] : ["Ctrl", "B"],
                      },
                    ].map(({ action, keys }) => (
                      <div
                        key={action}
                        className="flex items-center justify-between rounded-lg bg-muted/30"
                      >
                        <span className="text-sm">{action}</span>
                        <div className="flex items-center gap-1">
                          {keys.map((key, index) => (
                            <React.Fragment key={index}>
                              <kbd className="px-2 py-1 text-xs font-mono bg-background border border-border rounded">
                                {key}
                              </kbd>
                              {index < keys.length - 1 && (
                                <span className="text-muted-foreground">+</span>
                              )}
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Content - Settings Sections */}
            <div className="lg:col-span-3">
              {/* Section Navigation Tabs */}
              <div className="flex flex-wrap justify-around mb-8 p-2 bg-primary/10 dark:bg-accent/10 border-[1px] border-primary/30 rounded-lg">
                {[
                  { id: "profile", label: "Profile", icon: User },
                  {
                    id: "customization",
                    label: "Customization",
                    icon: Sparkles,
                  },
                  { id: "privacy", label: "Storage", icon: Database },
                  {
                    id: "application",
                    label: "Application",
                    icon: SettingsIcon,
                  },
                  {
                    id: "contact",
                    label: "Contact Us",
                    icon: MessageSquareMore,
                  },
                ].map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setActiveSection(id)}
                    className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-all ${
                      activeSection === id
                        ? "bg-background text-primary shadow-sm border border-border"
                        : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{label}</span>
                  </button>
                ))}
              </div>

              {/* Settings Content */}
              <div className="space-y-6">
                {/* Profile Section */}
                {activeSection === "profile" && (
                  <div className="space-y-6">
                    {/* Profile Edit Form */}
                    {isEditing && (
                      <div className="p-6 border rounded-xl bg-card shadow-sm">
                        <h3 className="text-lg font-medium mb-4 pb-2 border-b border-border">
                          Edit Profile
                        </h3>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium">
                              Display Name
                            </label>
                            <Input
                              value={displayName}
                              onChange={(e) => setDisplayName(e.target.value)}
                              placeholder="Enter your name"
                              disabled={isLoading}
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button
                              onClick={handleUpdateProfile}
                              disabled={isLoading}
                              className="flex items-center gap-1"
                            >
                              <Save className="w-4 h-4" />
                              {isLoading ? "Saving..." : "Save Changes"}
                            </Button>
                            <Button
                              onClick={handleCancel}
                              variant="outline"
                              disabled={isLoading}
                            >
                              <X className="w-4 h-4 mr-1" />
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Account Information */}
                    <div className="p-6 border rounded-xl bg-card shadow-sm">
                      <h3 className="text-lg font-medium mb-4 pb-2 border-b border-border">
                        Account Information
                      </h3>
                      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <dt className="text-sm text-muted-foreground flex items-center gap-2">
                            <Shield className="w-4 h-4" />
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
                          <dt className="text-sm text-muted-foreground flex items-center gap-2">
                            <Lock className="w-4 h-4" />
                            Authentication
                          </dt>
                          <dd className="font-medium flex items-center gap-2">
                            {sessionInfo?.currentSession?.provider ? (
                              <>
                                {getProviderIcon(sessionInfo.currentSession.provider)}
                                <span className="capitalize">{sessionInfo.currentSession.provider}</span>
                              </>
                            ) : (
                              "Email"
                            )}
                          </dd>
                        </div>
                        <div className="space-y-1">
                          <dt className="text-sm text-muted-foreground flex items-center gap-2">
                            <Mail className="w-4 h-4" />
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
                          <dt className="text-sm text-muted-foreground flex items-center gap-2">
                            <Database className="w-4 h-4" />
                            User ID
                          </dt>
                          <dd className="font-mono text-xs text-muted-foreground">
                            {user?.$id || "N/A"}
                          </dd>
                        </div>
                      </dl>

                      {/* Upgrade to Pro Button - Only for Free Users */}
                      {tierInfo && tierInfo.tier === "free" && (
                        <div className="mt-6 pt-4 border-t border-border">
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <h4 className="text-sm font-medium text-muted-foreground">
                                Upgrade Your Plan
                              </h4>
                              <p className="text-xs text-muted-foreground mt-1">
                                Get more credits and access to premium features
                              </p>
                            </div>
                            <Button
                              onClick={() => {
                                window.location.href = 'mailto:hi@aysh.me?subject=Upgrade%20to%20Pro%20in%20AVChat';
                              }}
                              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200"
                            >
                              <Sparkles className="w-4 h-4 mr-2" />
                              Upgrade to Pro
                            </Button>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border border-purple-200/50 dark:border-purple-800/50">
                            <div className="space-y-2">
                              <h5 className="text-sm font-medium text-purple-700 dark:text-purple-300">
                                Pro Plan Benefits
                              </h5>
                              <ul className="text-xs text-purple-600 dark:text-purple-400 space-y-1">
                                <li>• 1,500 Free Model Credits</li>
                                <li>• 600 Premium Credits</li>
                                <li>• 20 Super Premium Credits</li>
                                <li>• Priority Support</li>
                              </ul>
                            </div>
                            <div className="space-y-2">
                              <h5 className="text-sm font-medium text-purple-700 dark:text-purple-300">
                                Current Free Plan
                              </h5>
                              <ul className="text-xs text-muted-foreground space-y-1">
                                <li>• 200 Free Model Credits</li>
                                <li>• 20 Premium Credits</li>
                                <li>• 2 Super Premium Credits</li>
                                <li>• Community Support</li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      )}

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
                            <p>
                              • Credits reset monthly on the 1st of each month
                            </p>
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

                    {/* Session Management */}
                    <SessionManager />
                  </div>
                )}

                {/* Privacy & Security Section */}
                {activeSection === "privacy" && (
                  <div className="space-y-6">

                    {/* File Management Section */}
                    <div className="p-6 border rounded-xl bg-card shadow-sm">
                      <h3 className="text-lg font-medium mb-4 pb-2 border-b border-border">
                        File Management
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        View and manage all files you've uploaded to AV Chat. You can download or delete files to free up storage space.
                      </p>
                      <FileManager />
                    </div>

                    {/* Global Memory Settings */}
                    <MemorySettings />

                  </div>
                )}

                {/* Customization Section */}
                {activeSection === "customization" && (
                  <div className="space-y-6">
                    {/* Preferred Name Section */}
                    <div className="p-6 border rounded-xl bg-card shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <User className="h-5 w-5 text-primary" />
                            <h3 className="text-lg font-medium">
                              Preferred Name
                            </h3>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            How would you like the AI to address you in
                            conversations?
                          </p>
                        </div>
                        {!isEditingProfile &&
                          (customProfile.customName ||
                            customProfile.aboutUser) && (
                            <Button
                              onClick={handleClearCustomProfile}
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                              disabled={profileLoading}
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Clear
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
                              onChange={(e) =>
                                setTempCustomName(e.target.value)
                              }
                              placeholder="How would you like the AI to address you?"
                              disabled={profileLoading}
                            />
                            <p className="text-xs text-muted-foreground">
                              The AI will use this name when addressing you in
                              conversations
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
                              This information helps the AI provide more
                              personalized and relevant responses (
                              {tempAboutUser.length}/500 characters)
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
                          {customProfile.customName ||
                          customProfile.aboutUser ? (
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
                                <span>
                                  Custom profile is active - AI responses will
                                  be personalized
                                </span>
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
                                    Set up a custom profile to personalize your
                                    AI chat experience.
                                  </p>
                                  <p className="text-sm text-muted-foreground mt-2">
                                    Add your preferred name and information
                                    about yourself to help the AI provide more
                                    relevant and personalized responses.
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
                            {customProfile.customName || customProfile.aboutUser
                              ? "Edit Profile"
                              : "Set Up Profile"}
                          </Button>
                        </div>
                      )}
                    </div>

                    
                    {/* Font Selection */}
                    <div className="p-6 border rounded-xl bg-card shadow-sm">
                      <div className="flex items-center gap-2 mb-4">
                        <Settings className="h-5 w-5 text-primary" />
                        <h3 className="text-lg font-medium">Font Selection</h3>
                      </div>
                      <p className="text-sm text-muted-foreground mb-6">
                        Choose a font that makes reading comfortable for you.
                        Changes apply to the entire website.
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {FONT_OPTIONS.map((font) => (
                          <div
                            key={font.id}
                            onClick={() => setFont(font.id)}
                            className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                              selectedFont === font.id
                                ? "border-primary bg-primary/5 shadow-sm"
                                : "border-border hover:border-primary/50"
                            }`}
                          >
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <h4 className="font-medium text-sm">
                                  {font.displayName}
                                </h4>
                                <span
                                  className={`px-2 py-1 text-xs rounded-full ${
                                    font.category === "modern"
                                      ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                                      : font.category === "stylish"
                                      ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                                      : font.category === "classic"
                                      ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                                      : font.category === "artistic"
                                      ? "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300"
                                      : "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300"
                                  }`}
                                >
                                  {font.category}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {font.description}
                              </p>

                              {/* Font Preview */}
                              <div
                                className="p-3 rounded-md bg-muted/30 border"
                                style={{ fontFamily: font.fontFamily }}
                              >
                                <div className="space-y-2">
                                  <p className="text-sm font-medium">
                                    Hello! How can I help you today?
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    This is how your messages will look with{" "}
                                    {font.displayName}.
                                  </p>
                                </div>
                              </div>

                              {selectedFont === font.id && (
                                <div className="flex items-center gap-1 text-xs text-primary">
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>Currently selected</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Application Settings Section */}
                {activeSection === "application" && (
                  <div className="space-y-6">
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
                          Use your own OpenRouter API key for unlimited access
                          to AI models
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
                              ✓ Your API key is stored securely in your browser
                              only
                            </p>
                            <p>
                              ✓ Models will show a key icon when using your API
                              key
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
                                <p className="text-sm text-red-600">
                                  {keyError}
                                </p>
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
                          <h3 className="text-lg font-medium">
                            OpenAI API Key
                          </h3>
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
                              ✓ Used exclusively for voice input transcription
                              via Whisper
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
                                  Add your OpenAI API key to use your own
                                  credits for voice input transcription.
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
                                  className={
                                    openAIKeyError ? "border-red-500" : ""
                                  }
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                                  onClick={() =>
                                    setShowOpenAIKey(!showOpenAIKey)
                                  }
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

                  </div>
                )}

                {/* Contact Us Section */}
                {activeSection === "contact" && (
                  <div className="space-y-6">
                    {/* Contact Information */}
                    <div className="p-6 border rounded-xl bg-card shadow-sm">
                      <div className="flex items-center gap-2 mb-4">
                        <MessageSquareMore className="h-5 w-5 text-primary" />
                        <h3 className="text-lg font-medium">Get in Touch</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/30">
                            <Mail className="w-5 h-5 text-primary mt-0.5" />
                            <div>
                              <h4 className="font-medium text-sm">
                                Email Support
                              </h4>
                              <p className="text-xs text-muted-foreground mt-1">
                                Get help with your account or technical issues
                              </p>
                              <a
                                href="mailto:avchat@aysh.me"
                                className="text-sm text-primary hover:underline mt-2 inline-block"
                              >
                                avchat@aysh.me
                              </a>
                            </div>
                          </div>
                          <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/30">
                            <AlertTriangle className="w-5 h-5 text-primary mt-0.5" />
                            <div>
                              <h4 className="font-medium text-sm">
                                Report a Bug
                              </h4>
                              <p className="text-xs text-muted-foreground mt-1">
                                Found an issue? Let us know so we can fix it
                              </p>
                              <a
                                href="mailto:connect@vrandacodz.in"
                                className="text-sm text-primary hover:underline mt-2 inline-block"
                              >
                                connect@vrandacodz.in
                              </a>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/30">
                            <XIcon className="w-5 h-5 text-primary mt-0.5" />
                            <div>
                              <h4 className="font-medium text-sm">X (Twitter)</h4>
                              <p className="text-xs text-muted-foreground mt-1">
                                Connect on X
                              </p>
                              <a
                                href="https://x.com/CyberBoyAyush"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-primary hover:underline mt-2 inline-block"
                              >
                                @CyberBoyAyush
                              </a>
                            </div>
                          </div>
                          <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/30">
                            <GitHubIcon className="w-5 h-5 text-primary mt-0.5" />
                            <div>
                              <h4 className="font-medium text-sm">Github</h4>
                              <p className="text-xs text-muted-foreground mt-1">
                                Self Host or Contribute
                              </p>
                              <a
                                href="https://github.com/CyberBoyAyush/AVChat"
                                className="text-sm text-primary hover:underline mt-2 inline-block"
                              >
                                View on Github
                              </a>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
