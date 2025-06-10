/**
 * SettingsPage Route Component
 *
 * Used in: frontend/ChatAppRouter.tsx (as "/settings" route)
 * Purpose: Settings page for configuring API keys and application preferences.
 * Provides access to API key management and other configuration options.
 */

import ApiKeyConfigForm from '@/frontend/components/ApiKeyConfigForm';
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
          <ThemeToggleButton variant="inline" />
        </div>
      </header>

      {/* Main Content */}
      <main className="mobile-container mobile-padding py-8">
        <div className="space-y-8">
          {/* Page Title and Description */}
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Configure Your API Keys
            </h2>
            <p className="text-muted-foreground mobile-text max-w-2xl mx-auto">
              Add your API keys to start chatting with AI models. All keys are stored securely in your browser's local storage.
            </p>
          </div>

          {/* API Key Form */}
          <div className="flex justify-center">
            <ApiKeyConfigForm />
          </div>
        </div>
      </main>
    </div>
  );
}
