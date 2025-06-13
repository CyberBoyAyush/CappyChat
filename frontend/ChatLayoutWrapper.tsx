/**
 * ChatLayoutWrapper Component
 *
 * Used in: frontend/ChatAppRouter.tsx (as layout wrapper for chat routes)
 * Purpose: Main layout wrapper that provides sidebar functionality and outlet for chat pages.
 * Sets up the sidebar provider and renders the main chat interface structure.
 */

import { SidebarProvider } from "@/frontend/components/ui/sidebar";
import ChatSidebarPanel from "@/frontend/components/ChatSidebarPanel";
import { Outlet } from "react-router";

export default function ChatLayoutWrapper() {
  return (
    <SidebarProvider defaultOpen={true}>
      <ChatSidebarPanel />
      <div className="flex-1 relative min-h-screen bg-background">
        <Outlet />
      </div>
    </SidebarProvider>
  );
}
