/**
 * SidebarContainer Component
 *
 * Used in: Exported via frontend/components/drawer/index.ts (main sidebar component)
 * Purpose: Main sidebar container that orchestrates all sidebar sections.
 * Combines top section, conversations list, and bottom section into a cohesive sidebar layout.
 */

import { Sidebar, SidebarContent } from '@/frontend/components/ui/sidebar';
import { DrawerTopSection } from './DrawerTopSection';
import { DrawerBottomSection } from './DrawerBottomSection';
import { ConversationsList } from './ConversationsList';

// Main sidebar container with different structure
export const SidebarContainer = () => {
  return (
    <Sidebar className="border-r border-sidebar-border">
      <div className="flex flex-col h-full p-2 bg-sidebar text-sidebar-foreground">
        <DrawerTopSection />
        <SidebarContent className="no-scrollbar">
          <ConversationsList />
        </SidebarContent>
        <DrawerBottomSection />
      </div>
    </Sidebar>
  );
};

export default SidebarContainer;
