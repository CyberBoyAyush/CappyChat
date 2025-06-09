/**
 * PanelFooter Component
 *
 * Used in: frontend/components/panel/ConversationPanel.tsx
 * Purpose: Footer section of the conversation panel containing settings link and theme toggle.
 * Provides access to application settings and theme switching functionality.
 */

import { memo } from 'react';
import { Link, useParams } from 'react-router';
import { SidebarFooter } from '@/frontend/components/ui/sidebar';
import { buttonVariants } from '../ui/button';

// Settings link component
const SettingsLink = () => {
  const { id: activeSessionId } = useParams();
  
  const buildSettingsPath = () => {
    if (activeSessionId) {
      return `/settings?from=${encodeURIComponent(activeSessionId)}`;
    }
    return "/settings";
  };

  return (
    <Link
      to={buildSettingsPath()}
      className={buttonVariants({ variant: "default" })}
    >
      Settings
    </Link>
  );
};

// Main panel footer component
const PanelFooterComponent = () => {
  return (
    <SidebarFooter>
      <SettingsLink />
    </SidebarFooter>
  );
};

export const PanelFooter = memo(PanelFooterComponent);
export default PanelFooter;
