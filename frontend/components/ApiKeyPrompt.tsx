/**
 * ApiKeyPrompt Component
 *
 * Used in: frontend/components/ChatInputField.tsx
 * Purpose: Displays a floating prompt to configure API keys when they are missing.
 * Provides a link to the settings page for API key configuration.
 */

import { Button } from '@/frontend/components/ui/button';
import { Key } from 'lucide-react';
import { Link } from 'react-router';

export default function ApiKeyPrompt() {
  return (
    <div className="fixed bottom-6 left-1/2 z-50">
      <div className="flex items-center p-4 pr-5 border rounded-lg bg-background shadow-lg gap-4 max-w-md">
        <div className="bg-primary/10 p-2.5 rounded-full">
          <Key className="h-5 w-5 text-primary" />
        </div>

        <div>
          <p className="text-sm font-medium">API keys required</p>
          <p className="text-xs text-muted-foreground">
            Add keys to enable chat
          </p>
        </div>

        <Link to="/settings">
          <Button size="sm" variant="outline" className="ml-2 h-8 text-xs">
            Configure
          </Button>
        </Link>
      </div>
    </div>
  );
}
