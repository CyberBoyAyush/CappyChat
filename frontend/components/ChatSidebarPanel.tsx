// Option 1: Using panel structure
/**
 * ChatSidebarPanel Component
 *
 * Used in: frontend/ChatLayoutWrapper.tsx
 * Purpose: Main application panel wrapper that contains the conversation sidebar panel.
 * Provides theme-aware styling and responsive layout structure for the chat application.
 */

import { ConversationPanel } from './panel';

// Option 2: Using drawer structure
// import { SidebarContainer } from './drawer';

export default function ChatSidebarPanel() {
  // Option 1: Panel-based structure
  return <ConversationPanel />;

  // Option 2: Drawer-based structure (uncomment to use)
  // return <SidebarContainer />;
}
