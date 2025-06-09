/**
 * DrawerTopSection Component
 *
 * Used in: frontend/components/drawer/SidebarContainer.tsx (via index.ts export)
 * Purpose: Top section of the sidebar containing the app title and new chat button.
 * Provides branding and quick access to start new conversations.
 */

import { memo } from 'react';
import { Link } from 'react-router';
import { SidebarHeader, SidebarTrigger } from '@/frontend/components/ui/sidebar';
import { buttonVariants } from '../ui/button';

// Brand/Logo component with improved design
const BrandLogo = memo(() => (
  <div className="flex items-center gap-2">
    {/* Logo Icon */}
    <div className="relative">
      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-sm">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          className="text-primary-foreground"
        >
          <path
            d="M12 2L2 7L12 12L22 7L12 2Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M2 17L12 22L22 17"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M2 12L12 17L22 12"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      {/* Subtle glow effect */}
      <div className="absolute inset-0 w-8 h-8 rounded-lg bg-primary/20 blur-sm -z-10"></div>
    </div>

    {/* Logo Text */}
    <div className="flex items-baseline">
      <span className="text-xl font-bold text-sidebar-foreground tracking-tight">
        AT
      </span>
      <span className="text-xl font-bold text-primary tracking-tight">
        Chat
      </span>
      <div className="w-1.5 h-1.5 rounded-full bg-primary ml-0.5 animate-pulse"></div>
    </div>
  </div>
));

BrandLogo.displayName = 'ATChatLogo';

// Create new conversation button
const CreateConversationButton = memo(() => (
  <Link
    to="/chat"
    className={buttonVariants({
      variant: 'default',
      className: 'w-full',
    })}
  >
    New Chat
  </Link>
));

// Toggle sidebar button
const SidebarToggle = memo(() => (
  <SidebarTrigger className="absolute right-1 top-2.5" />
));

// Top section of drawer containing header elements
const TopSection = () => {
  return (
    <SidebarHeader className="flex justify-between items-center gap-4 relative">
      <SidebarToggle />
      <BrandLogo />
      <CreateConversationButton />
    </SidebarHeader>
  );
};

export const DrawerTopSection = memo(TopSection);
export default DrawerTopSection;
