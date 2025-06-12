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
} from "lucide-react";
import ThemeToggleButton from "../components/ui/ThemeComponents";
import { useTheme } from "next-themes";
import { Button } from "../components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function SettingsPage() {
  const [searchParams] = useSearchParams();
  const chatId = searchParams.get("from");
  const { setTheme, theme } = useTheme();

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

            {/* API Configuration Card */}
            <div className="p-6 border rounded-xl bg-card shadow-sm transition-shadow hover:shadow-md">
              <div className="space-y-1 mb-4">
                <h3 className="text-lg font-medium">API Configuration</h3>
                <p className="text-sm text-muted-foreground">
                  Language model access and authentication settings
                </p>
              </div>

              <div className="rounded-lg bg-muted/50 p-4 mt-2">
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-full bg-muted">
                    <SettingsIcon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm">
                      For security purposes, API keys are managed via
                      environment variables. This approach ensures your
                      credentials remain protected and are never exposed
                      client-side.
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      If you need access to additional language models or have
                      questions about API configuration, please contact your
                      system administrator.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center mt-6 pt-4 border-t text-sm text-muted-foreground">
                <p>
                  Current model configuration is managed by your administrator
                </p>
              </div>
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
