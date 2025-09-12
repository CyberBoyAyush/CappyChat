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
import { useState, useEffect, useCallback, useRef, useMemo, memo } from "react";
import { useIsMobile } from "@/hooks/useMobileDetection";
import { cn } from "@/lib/utils";
import { useAuth } from "@/frontend/contexts/AuthContext";
import EmailVerificationGuard from "@/frontend/components/EmailVerificationGuard";
import { motion, AnimatePresence } from "framer-motion";

// Memoized sidebar panel to prevent unnecessary re-renders
const MemoizedChatSidebarPanel = memo(ChatSidebarPanel);

// Constants
const MIN_WIDTH = 260;
const MAX_WIDTH = 1000;
const DEFAULT_WIDTH = 300;

export default function ChatLayoutWrapper() {
  // Initialize sidebar width from localStorage if available
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("sidebarWidth");
      return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
    }
    return DEFAULT_WIDTH;
  });

  const [isDragging, setIsDragging] = useState(false);
  const isMobile = useIsMobile();
  const { isAuthenticated, isEmailVerified } = useAuth();

  // Refs for performance optimization
  const dragStateRef = useRef({ startX: 0, startWidth: 0 });
  const lastSaveRef = useRef<number>(0);

  // Initialize sidebar open state from localStorage or default based on device
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("sidebarOpen");
      if (saved !== null) return saved === "true";
    }
    return !isMobile;
  });

  // Debounced localStorage save for width
  const saveWidthToStorage = useCallback((width: number) => {
    const now = Date.now();
    if (now - lastSaveRef.current > 100) {
      // Debounce 100ms
      lastSaveRef.current = now;
      try {
        localStorage.setItem("sidebarWidth", String(width));
      } catch (e) {
        console.warn("Failed to save sidebar width:", e);
      }
    }
  }, []);

  // Optimized mouse down handler
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (isMobile) return;

      e.preventDefault(); // Prevent default drag behavior
      dragStateRef.current = {
        startX: e.clientX,
        startWidth: sidebarWidth,
      };
      setIsDragging(true);

      // Add class instead of inline style for better performance
      document.body.classList.add("select-none");
    },
    [isMobile, sidebarWidth]
  );

  // Update sidebar state when mobile status changes
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
      try {
        localStorage.setItem("sidebarOpen", "false");
      } catch (e) {
        console.warn("Failed to save sidebar state:", e);
      }
    } else {
      // For non-mobile devices, check localStorage
      try {
        const savedState = localStorage.getItem("sidebarOpen");
        if (savedState !== null) {
          setSidebarOpen(savedState === "true");
        }
      } catch (e) {
        console.warn("Failed to load sidebar state:", e);
      }
    }
  }, [isMobile]);

  // Optimized body scroll prevention
  useEffect(() => {
    if (isMobile && sidebarOpen) {
      document.body.classList.add("sidebar-open");
      const scrollY = window.scrollY;
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = "100%";

      return () => {
        document.body.classList.remove("sidebar-open");
        document.body.style.position = "";
        document.body.style.top = "";
        document.body.style.width = "";
        window.scrollTo(0, scrollY);
      };
    }

    return () => {
      document.body.classList.remove("sidebar-open");
    };
  }, [isMobile, sidebarOpen]);

  // Optimized toggle function with error handling
  const toggleSidebar = useCallback(() => {
    setSidebarOpen((prev) => {
      const newState = !prev;
      try {
        localStorage.setItem("sidebarOpen", String(newState));
      } catch (e) {
        console.warn("Failed to save sidebar state:", e);
      }
      return newState;
    });
  }, []);

  // Memoized onOpenChange handler
  const handleOpenChange = useCallback((open: boolean) => {
    setSidebarOpen(open);
    try {
      localStorage.setItem("sidebarOpen", String(open));
    } catch (e) {
      console.warn("Failed to save sidebar state:", e);
    }
  }, []);

  // Optimized drag handling with RAF and error boundaries
  useEffect(() => {
    if (!isDragging) return;

    let animationFrameId: number | null = null;

    const handleMouseMove = (e: MouseEvent) => {
      // Cancel previous animation frame if exists
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }

      // Use RAF for smooth updates
      animationFrameId = requestAnimationFrame(() => {
        try {
          const deltaX = e.clientX - dragStateRef.current.startX;
          const newWidth = dragStateRef.current.startWidth + deltaX;

          // Check if user is trying to resize below minimum width
          if (newWidth < MIN_WIDTH - 50) {
            // Auto-close with some tolerance
            setSidebarOpen(false);
            try {
              localStorage.setItem("sidebarOpen", "false");
            } catch (err) {
              console.warn("Failed to save sidebar state:", err);
            }
            setIsDragging(false);
            document.body.classList.remove("select-none");
            return;
          }

          // Clamp width between min and max
          const clampedWidth = Math.max(
            MIN_WIDTH,
            Math.min(MAX_WIDTH, newWidth)
          );
          setSidebarWidth(clampedWidth);
          saveWidthToStorage(clampedWidth);
        } catch (error) {
          console.error("Error during sidebar resize:", error);
          setIsDragging(false);
          document.body.classList.remove("select-none");
        }
      });
    };

    const handleMouseUp = () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      setIsDragging(false);
      document.body.classList.remove("select-none");

      // Final save to localStorage
      try {
        localStorage.setItem("sidebarWidth", String(sidebarWidth));
      } catch (e) {
        console.warn("Failed to save sidebar width:", e);
      }
    };

    // Add event listeners with error handling
    try {
      document.addEventListener("mousemove", handleMouseMove, {
        passive: false,
      });
      document.addEventListener("mouseup", handleMouseUp, { passive: true });
      document.addEventListener("mouseleave", handleMouseUp, { passive: true }); // Handle mouse leaving window
    } catch (error) {
      console.error("Failed to add drag event listeners:", error);
      setIsDragging(false);
      document.body.classList.remove("select-none");
    }

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      try {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        document.removeEventListener("mouseleave", handleMouseUp);
      } catch (error) {
        console.error("Failed to remove drag event listeners:", error);
      }
    };
  }, [isDragging, sidebarWidth, saveWidthToStorage]);

  // Memoized outlet context to prevent unnecessary re-renders
  const outletContext = useMemo(
    () => ({
      sidebarWidth,
      toggleSidebar,
      state: sidebarOpen ? "open" : "collapsed",
      isMobile,
    }),
    [sidebarWidth, toggleSidebar, sidebarOpen, isMobile]
  );

  // If user is authenticated but email is not verified, show verification guard
  if (isAuthenticated && !isEmailVerified) {
    return (
      <EmailVerificationGuard>
        <div></div>
      </EmailVerificationGuard>
    );
  }

  return (
    <SidebarProvider
      defaultOpen={!isMobile}
      open={sidebarOpen}
      onOpenChange={handleOpenChange}
    >
      <div className="flex h-screen w-full overflow-hidden relative">
        {/* Overlay for mobile when sidebar is open */}
        <AnimatePresence>
          {isMobile && sidebarOpen && (
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/50 z-40 md:hidden sidebar-mobile-overlay"
              onClick={toggleSidebar}
              role="button"
              aria-label="Close sidebar"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  toggleSidebar();
                }
              }}
            />
          )}
        </AnimatePresence>

        {/* Sidebar section with dynamic width and Framer Motion animations */}
        <AnimatePresence mode="wait">
          {sidebarOpen && (
            <motion.div
              key="sidebar"
              initial={isMobile ? { x: "-100%" } : { width: 0, opacity: 0 }}
              animate={
                isDragging
                  ? { width: `${sidebarWidth}px`, opacity: 1 } // Direct control during drag
                  : isMobile
                  ? { x: 0, opacity: 1 }
                  : { width: `${sidebarWidth}px`, opacity: 1 }
              }
              exit={isMobile ? { x: "-100%" } : { width: 0, opacity: 0 }}
              transition={
                isDragging
                  ? { duration: 0, ease: "linear" } // Instant updates during drag
                  : {
                      type: "spring",
                      stiffness: 300,
                      damping: 25,
                      mass: 0.5,
                    }
              }
              className={cn(
                "h-screen bg-gradient-to-t dark:from-zinc-950 dark:to-50% overflow-hidden",
                isMobile
                  ? "fixed top-0 left-0 z-50 bg-background"
                  : "relative z-50"
              )}
              style={
                isMobile
                  ? { width: "80%" }
                  : {
                      flexShrink: 0,
                    }
              }
            >
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: isDragging ? 0 : 0.1, duration: 0.2 }}
                className="h-full"
              >
                <MemoizedChatSidebarPanel />
              </motion.div>

              {/* Draggable resizer */}
              {!isMobile && (
                <div
                  className="absolute top-0 right-0 w-2 h-full cursor-col-resize z-50 transition-colors "
                  onMouseDown={handleMouseDown}
                  role="separator"
                  aria-orientation="vertical"
                  aria-label="Resize sidebar"
                  aria-valuenow={sidebarWidth}
                  aria-valuemin={MIN_WIDTH}
                  aria-valuemax={MAX_WIDTH}
                  style={{
                    touchAction: "none",
                  }}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main content area that flexes with sidebar width */}
        <div className="flex-1 relative min-h-screen bg-gradient-to-t from-background dark:from-zinc-950 dark:to-50% overflow-hidden">
          <Outlet context={outletContext} />
        </div>
      </div>
    </SidebarProvider>
  );
}
