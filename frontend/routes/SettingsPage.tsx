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
} from "lucide-react";
import ThemeToggleButton from "../components/ui/ThemeComponents";
import { useTheme } from "next-themes";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { useState, useEffect } from "react";
import { useBYOKStore } from "@/frontend/stores/BYOKStore";
import { useAuth } from "../contexts/AuthContext";
import { format } from "date-fns";

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
  const [notification, setNotification] = useState<NotificationType | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // BYOK state
  const {
    openRouterApiKey,
    openAIApiKey,
    setOpenRouterApiKey,
    setOpenAIApiKey,
    hasOpenRouterKey,
    hasOpenAIKey,
    validateOpenRouterKey,
    validateOpenAIKey
  } = useBYOKStore();

  const [keyInput, setKeyInput] = useState("");
  const [openAIKeyInput, setOpenAIKeyInput] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [showOpenAIKey, setShowOpenAIKey] = useState(false);
  const [keyError, setKeyError] = useState("");
  const [openAIKeyError, setOpenAIKeyError] = useState("");
  const [keySaved, setKeySaved] = useState(false);
  const [openAIKeySaved, setOpenAIKeySaved] = useState(false);

  // Initialize profile data and handle section navigation
  useEffect(() => {
    if (user?.name) {
      setDisplayName(user.name);
    }

    // Handle hash-based navigation
    const hash = location.hash.replace('#', '');
    if (hash && ['profile', 'privacy', 'settings'].includes(hash)) {
      setActiveSection(hash);
    }
  }, [user, location.hash]);

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
      setKeyError("Invalid API key format. OpenRouter keys should start with 'sk-or-'");
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
      setOpenAIKeyError("Invalid API key format. OpenAI keys should start with 'sk-'");
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
              Manage your profile, privacy settings, and application preferences.
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
          <div className="flex flex-wrap gap-2 border-b border-border">
            {[
              { id: "profile", label: "Profile", icon: User },
              { id: "privacy", label: "Privacy & Security", icon: Shield },
              { id: "settings", label: "Application", icon: SettingsIcon },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveSection(id)}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
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
                          <h3 className="text-xl font-semibold">{user?.name || "Anonymous User"}</h3>
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
                          <span>Joined {format(new Date(user.registration), "MMMM d, yyyy")}</span>
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
                      <dt className="text-sm text-muted-foreground">Account Type</dt>
                      <dd className="font-medium">Free Plan</dd>
                    </div>
                    <div className="space-y-1">
                      <dt className="text-sm text-muted-foreground">Authentication</dt>
                      <dd className="font-medium">Email</dd>
                    </div>
                    <div className="space-y-1">
                      <dt className="text-sm text-muted-foreground">Email Status</dt>
                      <dd className="flex items-center gap-1">
                        {user?.emailVerification ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            <span className="text-emerald-600 dark:text-emerald-400">Verified</span>
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="w-4 h-4 text-amber-500" />
                            <span className="text-amber-600 dark:text-amber-400">Unverified</span>
                          </>
                        )}
                      </dd>
                    </div>
                    <div className="space-y-1">
                      <dt className="text-sm text-muted-foreground">User ID</dt>
                      <dd className="font-mono text-xs text-muted-foreground">{user?.$id || "N/A"}</dd>
                    </div>
                  </dl>
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
                        <h4 className="font-medium text-sm">End-to-End Encryption</h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          Your conversations are encrypted in transit and at rest.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                      <Eye className="w-5 h-5 text-primary mt-0.5" />
                      <div>
                        <h4 className="font-medium text-sm">Data Transparency</h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          We clearly explain what data we collect and how we use it.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                      <Database className="w-5 h-5 text-primary mt-0.5" />
                      <div>
                        <h4 className="font-medium text-sm">Minimal Data Collection</h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          We only collect information necessary to provide our services.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                      <Trash2 className="w-5 h-5 text-primary mt-0.5" />
                      <div>
                        <h4 className="font-medium text-sm">Data Deletion Controls</h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          You have full control over your data and can delete it anytime.
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
                        <h4 className="font-medium text-sm">Secure Infrastructure</h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          Industry-leading cloud providers with rigorous security controls.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                      <FileCheck className="w-5 h-5 text-primary mt-0.5" />
                      <div>
                        <h4 className="font-medium text-sm">Regular Audits</h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          Regular security assessments and vulnerability testing.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                      <Users className="w-5 h-5 text-primary mt-0.5" />
                      <div>
                        <h4 className="font-medium text-sm">Access Controls</h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          Strict internal access controls with comprehensive audit logging.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                      <Shield className="w-5 h-5 text-primary mt-0.5" />
                      <div>
                        <h4 className="font-medium text-sm">Compliance</h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          We follow industry standards and best practices for data protection.
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
                      <span>Your conversations are stored securely and encrypted</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-emerald-500 mt-0.5" />
                      <span>We never sell your personal data to third parties</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-emerald-500 mt-0.5" />
                      <span>You can export or delete your data at any time</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-emerald-500 mt-0.5" />
                      <span>API keys are stored locally in your browser only</span>
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
                      <h3 className="text-lg font-medium">Bring Your Own Key</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Use your own OpenRouter API key for unlimited access to AI models
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
                    <p>✓ Your API key is stored securely in your browser only</p>
                    <p>✓ Models will show a key icon when using your API key</p>
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
                          Add your OpenRouter API key to use your own credits and access all available models.
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
                      <label className="text-sm font-medium">OpenRouter API Key</label>
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
                          {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                      {keyError && (
                        <p className="text-sm text-red-600">{keyError}</p>
                      )}
                      {keySaved && (
                        <p className="text-sm text-green-600">✓ API key saved successfully!</p>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button onClick={handleSaveKey} disabled={!keyInput.trim()}>
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
                      Use your own OpenAI API key for voice input powered by Whisper
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
                    <p>✓ Your OpenAI API key is stored securely in your browser only</p>
                    <p>✓ Used exclusively for voice input transcription via Whisper</p>
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
                          Add your OpenAI API key to use your own credits for voice input transcription.
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
                      <label className="text-sm font-medium">OpenAI API Key</label>
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
                          {showOpenAIKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                      {openAIKeyError && (
                        <p className="text-sm text-red-600">{openAIKeyError}</p>
                      )}
                      {openAIKeySaved && (
                        <p className="text-sm text-green-600">✓ OpenAI API key saved successfully!</p>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button onClick={handleSaveOpenAIKey} disabled={!openAIKeyInput.trim()}>
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
                    activeSection === "profile" ? "text-primary font-medium" : ""
                  }`}
                >
                  Profile
                </button>
                <button
                  onClick={() => setActiveSection("privacy")}
                  className={`hover:text-primary transition-colors ${
                    activeSection === "privacy" ? "text-primary font-medium" : ""
                  }`}
                >
                  Privacy
                </button>
                <button
                  onClick={() => setActiveSection("settings")}
                  className={`hover:text-primary transition-colors ${
                    activeSection === "settings" ? "text-primary font-medium" : ""
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
