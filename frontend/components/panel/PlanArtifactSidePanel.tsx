/**
 * PlanArtifactSidePanel Component
 * 
 * Extracted from ChatInterface.tsx for reuse in SharedChatView
 * Provides a resizable side panel for viewing Plan Mode artifacts
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/frontend/components/ui/button";
import ArtifactViewer from "@/frontend/components/ArtifactViewer";
import type { PlanArtifact } from "@/lib/appwriteDB";
import { Eye, Code2, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface PlanArtifactSidePanelProps {
  panelState: {
    messageId: string;
    artifacts: PlanArtifact[];
    activeArtifactId: string;
  } | null;
  onClose: () => void;
  onSelectArtifact: (artifactId: string) => void;
}

export default function PlanArtifactSidePanel({
  panelState,
  onClose,
  onSelectArtifact,
}: PlanArtifactSidePanelProps) {
  const activeArtifact = panelState?.artifacts.find(
    (artifact) => artifact.id === panelState.activeArtifactId
  );

  // View state for MVP artifacts
  const [view, setView] = useState<"preview" | "code">("preview");
  const [codeTab, setCodeTab] = useState<"html" | "css" | "js">("html");

  // Constants for artifact panel sizing
  const ARTIFACT_MIN_WIDTH = 400;
  const ARTIFACT_MAX_WIDTH = 1200;
  const ARTIFACT_DEFAULT_WIDTH = 600;

  // Resizable panel state
  const [panelWidth, setPanelWidth] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("planArtifactPanelWidth");
      return saved ? parseInt(saved, 10) : ARTIFACT_DEFAULT_WIDTH;
    }
    return ARTIFACT_DEFAULT_WIDTH;
  });
  const [isResizing, setIsResizing] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Refs for performance optimization - similar to ChatLayoutWrapper
  const dragStateRef = useRef({ startX: 0, startWidth: 0 });
  const lastSaveRef = useRef<number>(0);

  // Detect mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Debounced localStorage save for width - similar to ChatLayoutWrapper
  const saveWidthToStorage = useCallback((width: number) => {
    const now = Date.now();
    if (now - lastSaveRef.current > 100) {
      // Debounce 100ms
      lastSaveRef.current = now;
      try {
        localStorage.setItem("planArtifactPanelWidth", String(width));
      } catch (e) {
        console.warn("Failed to save artifact panel width:", e);
      }
    }
  }, []);

  // Optimized mouse down handler - similar to ChatLayoutWrapper
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (isMobile) return;

      e.preventDefault(); // Prevent default drag behavior
      dragStateRef.current = {
        startX: e.clientX,
        startWidth: panelWidth,
      };
      setIsResizing(true);

      // Add class instead of inline style for better performance
      document.body.classList.add("select-none");
    },
    [isMobile, panelWidth]
  );

  // Optimized drag handling with RAF and error boundaries - matching ChatLayoutWrapper
  useEffect(() => {
    if (!isResizing) return;

    let animationFrameId: number | null = null;

    // Set cursor style during resize for better UX
    document.body.style.cursor = "col-resize";

    const handleMouseMove = (e: MouseEvent) => {
      // Cancel previous animation frame if exists
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }

      // Use RAF for smooth updates
      animationFrameId = requestAnimationFrame(() => {
        try {
          const deltaX = dragStateRef.current.startX - e.clientX; // Inverted for right-side panel
          const newWidth = dragStateRef.current.startWidth + deltaX;

          // Clamp width between min and max
          const clampedWidth = Math.max(
            ARTIFACT_MIN_WIDTH,
            Math.min(
              ARTIFACT_MAX_WIDTH,
              Math.min(newWidth, window.innerWidth * 0.8)
            )
          );

          // Only update if width changed significantly (reduce re-renders)
          if (Math.abs(clampedWidth - panelWidth) > 1) {
            setPanelWidth(clampedWidth);
            // Save to storage will be debounced automatically
            saveWidthToStorage(clampedWidth);
          }
        } catch (error) {
          console.error("Error during artifact panel resize:", error);
          setIsResizing(false);
          document.body.classList.remove("select-none");
          document.body.style.cursor = "";
        }
      });
    };

    const handleMouseUp = () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      setIsResizing(false);
      document.body.classList.remove("select-none");
      document.body.style.cursor = "";

      // Final save to localStorage
      try {
        localStorage.setItem("planArtifactPanelWidth", String(panelWidth));
      } catch (e) {
        console.warn("Failed to save artifact panel width:", e);
      }
    };

    // Add event listeners with error handling
    try {
      document.addEventListener("mousemove", handleMouseMove, {
        passive: false,
      });
      document.addEventListener("mouseup", handleMouseUp, { passive: false });
      document.addEventListener("mouseleave", handleMouseUp, { passive: false });
    } catch (error) {
      console.error("Failed to add drag event listeners:", error);
      setIsResizing(false);
    }

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      // Clean up cursor style
      document.body.style.cursor = "";

      try {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        document.removeEventListener("mouseleave", handleMouseUp);
      } catch (error) {
        console.error("Failed to remove drag event listeners:", error);
      }
    };
  }, [isResizing, panelWidth, saveWidthToStorage]);

  return (
    <AnimatePresence>
      {panelState && activeArtifact && (
        <>
          <motion.div
            key="plan-panel-overlay"
            className="fixed inset-0 z-[70] bg-background/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            key="plan-panel"
            className="fixed right-0 top-0 bottom-0 z-[71] bg-background shadow-2xl border-l flex flex-col"
            style={{
              width: isMobile ? "100%" : `${panelWidth}px`,
              minWidth: isMobile ? undefined : `${ARTIFACT_MIN_WIDTH}px`,
              transform: "translateZ(0)", // Force GPU acceleration
              backfaceVisibility: "hidden", // Improve rendering performance
              willChange: isResizing ? "width" : "auto", // Optimize during resize
            }}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 400 }}
          >
            {/* Resize Handle - Only visible on desktop */}
            {!isMobile && (
              <div
                className={cn(
                  "absolute -left-1 top-0 bottom-0 w-2 cursor-col-resize transition-colors group z-10 hover:bg-primary/5",
                  isResizing && "bg-primary/10"
                )}
                onMouseDown={handleMouseDown}
                role="separator"
                aria-orientation="vertical"
                aria-label="Resize artifact panel"
                aria-valuenow={panelWidth}
                aria-valuemin={ARTIFACT_MIN_WIDTH}
                aria-valuemax={ARTIFACT_MAX_WIDTH}
                style={{
                  touchAction: "none",
                }}
              >
                {/* Visual indicator */}
                <div
                  className={cn(
                    "absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 w-1 h-16 bg-border rounded-full transition-all",
                    isResizing
                      ? "bg-primary h-24"
                      : "group-hover:bg-primary/70 group-hover:h-20"
                  )}
                />
                {/* Hover area for easier grabbing */}
                <div className="absolute -left-2 top-0 bottom-0 w-6" />
              </div>
            )}
            {/* First Row: Preview/Code Toggle, Title, Close Button */}
            <div className="flex items-center gap-3 bg-muted/30 px-4 py-3 border-b flex-shrink-0">
              {/* Left: Preview/Code Toggle (only for MVP artifacts) */}
              {activeArtifact.type === "mvp" && (
                <div className="flex items-center gap-0.5 border rounded-md overflow-hidden">
                  <button
                    onClick={() => setView("preview")}
                    className={`p-1.5 transition-colors ${
                      view === "preview"
                        ? "bg-primary text-primary-foreground"
                        : "bg-background hover:bg-muted"
                    }`}
                    title="Preview"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setView("code")}
                    className={`p-1.5 transition-colors ${
                      view === "code"
                        ? "bg-primary text-primary-foreground"
                        : "bg-background hover:bg-muted"
                    }`}
                    title="Code"
                  >
                    <Code2 className="h-4 w-4" />
                  </button>
                </div>
              )}

              {/* Middle: Artifact Title */}
              <h3 className="flex-1 text-sm font-medium truncate text-center">
                {activeArtifact.title}
              </h3>

              {/* Right: Close Button */}
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Second Row: HTML/CSS/JS Tabs (only when code view is active for MVP) */}
            {activeArtifact.type === "mvp" && view === "code" && (
              <div className="flex items-center gap-1 bg-muted/20 px-4 py-2 border-b flex-shrink-0">
                {(["html", "css", "js"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setCodeTab(t)}
                    className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                      codeTab === t
                        ? "bg-primary text-primary-foreground"
                        : "bg-background hover:bg-muted"
                    }`}
                  >
                    {t.toUpperCase()}
                  </button>
                ))}
              </div>
            )}

            {/* Multiple Artifacts Selector */}
            {panelState.artifacts.length > 1 && (
              <div className="flex flex-wrap gap-2 border-b px-4 py-2 flex-shrink-0">
                {panelState.artifacts.map((artifact) => (
                  <button
                    key={artifact.id}
                    onClick={() => onSelectArtifact(artifact.id)}
                    className={cn(
                      "px-2 py-1 rounded-md text-xs border transition",
                      artifact.id === panelState.activeArtifactId
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-card border-border hover:border-primary"
                    )}
                  >
                    {artifact.title}
                  </button>
                ))}
              </div>
            )}

            {/* Content Area */}
            <div className="flex-1 min-h-0">
              <ArtifactViewer
                artifact={activeArtifact}
                view={view}
                setView={setView}
                codeTab={codeTab}
                setCodeTab={setCodeTab}
              />
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
