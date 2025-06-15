/**
 * SettingsPage Route Component
 *
 * Used in: frontend/ChatAppRouter.tsx (as "/settings" route)
 * Purpose: Settings page for application preferences and configuration.
 * Provides access to theme settings and other configuration options.
 */

import { Link, useSearchParams } from "react-router-dom";
import { buttonVariants } from "../components/ui/button";

import {
  ArrowLeftIcon,
  Settings as SettingsIcon,
  Moon,
  Sun,
  Laptop,
  Key,
  Eye,
  EyeOff,
  Check,
  X,
} from "lucide-react";
import ThemeToggleButton from "../components/ui/ThemeComponents";
import { useTheme } from "next-themes";
import { Button } from "../components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Input } from "../components/ui/input";
import { useState } from "react";
import { useBYOKStore } from "../stores/BYOKStore";

export default function SettingsPage() {
  const [searchParams] = useSearchParams();
  const chatId = searchParams.get("from");
  const { setTheme, theme } = useTheme();

  // BYOK state
  const { openRouterApiKey, setOpenRouterApiKey, hasOpenRouterKey, clearAllKeys, validateOpenRouterKey } = useBYOKStore();
  const [keyInput, setKeyInput] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [keyError, setKeyError] = useState("");
  const [keySaved, setKeySaved] = useState(false);

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
              Application Settings
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base">
              Configure your preferences and customize your AT Chat experience.
            </p>
            <div className="h-px bg-border mt-4"></div>
          </div>

          {/* Settings Content */}
          <div className="grid gap-6">
            {/* Theme Settings Card */}
            <div className="p-6 border rounded-xl bg-card shadow-sm transition-shadow hover:shadow-md">
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
            <div className="p-6 border rounded-xl bg-card shadow-sm transition-shadow hover:shadow-md">
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
                    className="hover:text-primary transition-colors"
                  >
                    Profile
                  </Link>
                  <Link
                    to="/privacy"
                    className="hover:text-primary transition-colors"
                  >
                    Privacy
                  </Link>
                  <Link to="/settings" className=" text-primary font-medium">
                    Settings
                  </Link>
                </div>
              </div>
            </footer>
          </div>
        </div>
      </main>
    </div>
  );
}
