/**
 * SettingsPage Route Component
 *
 * Used in: frontend/ChatAppRouter.tsx (as "/settings" route)
 * Purpose: Settings page for application preferences and configuration.
 * Provides access to theme settings and other configuration options.
 */

import { Link, useSearchParams } from 'react-router';
import { buttonVariants } from '../components/ui/button';
import { ArrowLeftIcon, Settings as SettingsIcon } from 'lucide-react';
import ThemeToggleButton from '../components/ui/ThemeToggleButton';

export default function SettingsPage() {
  const [searchParams] = useSearchParams();
  const chatId = searchParams.get("from");

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mobile-container mobile-padding flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              to={{
                pathname: "/chat",
                search: chatId ? `/${chatId}` : ""
              }}
              className={buttonVariants({
                variant: 'outline',
                size: 'sm',
                className: 'gap-2',
              })}
            >
              <ArrowLeftIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Back to Chat</span>
            </Link>
            <div className="flex items-center gap-2">
              <SettingsIcon className="w-5 h-5 text-primary" />
              <h1 className="text-lg font-semibold">Settings</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mobile-container mobile-padding py-8">
        <div className="space-y-8">
          {/* Page Title and Description */}
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Application Settings
            </h2>
            <p className="text-muted-foreground mobile-text max-w-2xl mx-auto">
              Configure your application preferences and settings.
            </p>
          </div>

          {/* Settings Content */}
          <div className="flex justify-center">
            <div className="w-full max-w-2xl mx-auto space-y-6">
              <div className="p-6 border rounded-lg bg-card">
                <h3 className="text-lg font-semibold mb-4">Theme Settings</h3>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Switch between light and dark themes
                  </span>
                  <ThemeToggleButton variant="inline" />
                </div>
              </div>

              <div className="p-6 border rounded-lg bg-card">
                <h3 className="text-lg font-semibold mb-2">API Configuration</h3>
                <p className="text-sm text-muted-foreground">
                  API keys are configured via environment variables for security.
                  Contact your administrator if you need access to different models.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
