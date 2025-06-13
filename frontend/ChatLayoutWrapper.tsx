/**
 * ChatLayoutWrapper Component
 *
 * Used in: frontend/ChatAppRouter.tsx (as layout wrapper for chat routes)
 * Purpose: Main layout wrapper that provides sidebar functionality and outlet for chat pages.
 * Sets up the sidebar provider and renders the main chat interface structure.
 */

import { SidebarProvider, useSidebar } from "@/frontend/components/ui/sidebar";
import ChatSidebarPanel from "@/frontend/components/ChatSidebarPanel";
import { Outlet } from "react-router";
import { useState, useEffect } from "react";
import { useIsMobile } from "@/hooks/useMobileDetection";
import { Button } from "@/frontend/components/ui/button";
import { PanelLeftIcon } from "lucide-react";

export default function ChatLayoutWrapper() {
  const [sidebarWidth, setSidebarWidth] = useState(300); // Default width
  const [isDragging, setIsDragging] = useState(false);
  const isMobile = useIsMobile();

  // Default sidebar open state - only close by default on mobile
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);

  // Define minimum and maximum sidebar width
  const minWidth = 260;
  const maxWidth = 1000;

  // Handle mouse down event to start dragging
  const handleMouseDown = () => {
    if (isMobile) return;
    setIsDragging(true);
    document.body.style.userSelect = "none"; // Prevent text selection while dragging
  };

  // Update sidebar state when mobile status changes
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
      localStorage.setItem("sidebarOpen", "false");
    } else {
      // For non-mobile devices, initialize from localStorage or default to true
      const savedState = localStorage.getItem("sidebarOpen");
      if (savedState !== null) {
        setSidebarOpen(savedState === "true");
      }
    }
  }, [isMobile]);

  // Enhanced toggle function that also updates localStorage
  const toggleSidebar = () => {
    console.log("Toggling sidebar from", sidebarOpen, "to", !sidebarOpen);
    setSidebarOpen((prev) => {
      const newState = !prev;
      localStorage.setItem("sidebarOpen", String(newState));
      return newState;
    });
  };

  // Handle mouse move event for dragging
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;

      // Calculate new width based on mouse position
      const newWidth = Math.max(minWidth, Math.min(maxWidth, e.clientX));
      setSidebarWidth(newWidth);
    };

    // Handle mouse up event to stop dragging
    const handleMouseUp = () => {
      setIsDragging(false);
      document.body.style.userSelect = ""; // Restore text selection
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.userSelect = "none";
    };
  }, [isDragging]);

  return (
    <SidebarProvider
      defaultOpen={!isMobile}
      open={sidebarOpen}
      onOpenChange={setSidebarOpen}
    >
      <div className="flex h-screen w-full overflow-hidden">
        {/* Sidebar section with dynamic width */}
        <div
          className="relative z-50 h-screen bg-sidebar border-r border-border"
          style={{
            width: isMobile ? "80%" : `${sidebarWidth}px`,
            flexShrink: 0,
            display: sidebarOpen ? "block" : "none",
          }}
        >
          <ChatSidebarPanel />

          {/* Draggable resizer */}
          {!isMobile && (
            <div
              className="absolute top-0 flex justify-end right-0 w-5 h-full  cursor-col-resize z-50"
              onMouseDown={handleMouseDown}
            >
              <div className="w-[1px] h-full bg-border cursor-col-resize z-50"></div>
            </div>
          )}
        </div>

        {/* Main content area that flexes with sidebar width */}
        <div className="flex-1 relative min-h-screen bg-background overflow-hidden">
          <Outlet
            context={{
              sidebarWidth,
              toggleSidebar,
              state: sidebarOpen ? "open" : "collapsed",
              isMobile,
            }}
          />
        </div>
      </div>
    </SidebarProvider>
  );
}
