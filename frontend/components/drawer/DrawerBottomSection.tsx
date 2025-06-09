import { memo } from 'react';
import { Link, useParams } from 'react-router';
/**
 * DrawerBottomSection Component
 *
 * Used in: frontend/components/drawer/SidebarContainer.tsx (via index.ts export)
 * Purpose: Bottom section of the sidebar containing settings link and theme toggle.
 * Provides access to application settings and theme switching functionality.
 */

import { SidebarFooter } from '@/frontend/components/ui/sidebar';
import { buttonVariants } from '../ui/button';

// Settings navigation component
const SettingsNavigation = memo(() => {
  const { id: sessionId } = useParams();
  
  const generateSettingsUrl = () => {
    const baseUrl = "/settings";
    if (sessionId) {
      return `${baseUrl}?from=${encodeURIComponent(sessionId)}`;
    }
    return baseUrl;
  };

  return (
    <Link
      to={generateSettingsUrl()}
      className={buttonVariants({ variant: "default" })}
    >
      Settings
    </Link>
  );
});

// Bottom section of drawer containing footer elements
const BottomSection = () => {
  return (
    <SidebarFooter>
      <SettingsNavigation />
    </SidebarFooter>
  );
};

export const DrawerBottomSection = memo(BottomSection);
export default DrawerBottomSection;
