/**
 * PanelFooter Component
 *
 * Used in: frontend/components/panel/ConversationPanel.tsx
 * Purpose: Footer section of the conversation panel containing settings link and theme toggle.
 * Provides access to application settings and theme switching functionality.
 */

import { memo } from 'react';
import { Link, useParams } from 'react-router-dom'; // Changed from 'react-router'
import { buttonVariants } from '../ui/button';

// Settings link component
const SettingsLink = memo(() => {
  const { id: activeSessionId } = useParams();
  
  const buildSettingsPath = () => {
    if (activeSessionId) {
      return `/settings?from=${encodeURIComponent(activeSessionId)}`;
    }
    return "/settings";
  };

  const handleClick = (e: React.MouseEvent) => {
    console.log('Settings button clicked, navigating to:', buildSettingsPath());
    console.log('Click event:', e);
    console.log('Current activeSessionId:', activeSessionId);
  };

  return (
    <Link
      to={buildSettingsPath()}
      className={`${buttonVariants({ variant: "default" })} cursor-pointer pointer-events-auto`}
      onClick={handleClick}
    >
      Settings
    </Link>
  );
});

SettingsLink.displayName = 'SettingsLink';

// Main panel footer component
const PanelFooterComponent = () => {
  return (
    <div className="flex flex-col gap-2 p-2">
      <SettingsLink />
    </div>
  );
};

export const PanelFooter = memo(PanelFooterComponent);
export default PanelFooter;
