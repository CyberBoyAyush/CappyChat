"use client";
import React from "react";
import { PlanArtifact } from "@/lib/appwriteDB";
import ShikiHighlighter from "react-shiki";
import { useTheme } from "next-themes";
import { Eye, Code2, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";

export default function ArtifactViewer({
  artifact,
  view,
  setView,
  codeTab,
  setCodeTab,
}: {
  artifact: PlanArtifact;
  view?: "preview" | "code";
  setView?: (view: "preview" | "code") => void;
  codeTab?: "html" | "css" | "js";
  setCodeTab?: (tab: "html" | "css" | "js") => void;
}) {
  if (artifact.type === "mvp") {
    return (
      <MVPViewer
        artifact={artifact}
        view={view}
        setView={setView}
        codeTab={codeTab}
        setCodeTab={setCodeTab}
      />
    );
  }
  return <DiagramViewer artifact={artifact} />;
}

function MVPViewer({
  artifact,
  view: externalView,
  setView: externalSetView,
  codeTab: externalCodeTab,
  setCodeTab: externalSetCodeTab,
}: {
  artifact: PlanArtifact;
  view?: "preview" | "code";
  setView?: (view: "preview" | "code") => void;
  codeTab?: "html" | "css" | "js";
  setCodeTab?: (tab: "html" | "css" | "js") => void;
}) {
  const [internalView, setInternalView] = React.useState<"preview" | "code">(
    "preview"
  );
  const [internalCodeTab, setInternalCodeTab] = React.useState<
    "html" | "css" | "js"
  >("html");

  // Use external state if provided, otherwise use internal state
  const view = externalView ?? internalView;
  const setView = externalSetView ?? setInternalView;
  const codeTab = externalCodeTab ?? internalCodeTab;
  const setCodeTab = externalSetCodeTab ?? setInternalCodeTab;

  const iframeRef = React.useRef<HTMLIFrameElement>(null);
  const { theme } = useTheme();
  const isDarkMode = theme === "dark" || theme === "capybara-dark";

  React.useEffect(() => {
    if (view !== "preview") return;
    const iframe = iframeRef.current;
    if (!iframe) return;
    const doc = iframe.contentDocument;
    if (!doc) return;
    const html = artifact.htmlCode || "";
    const css = artifact.cssCode || "";
    const js = artifact.jsCode || "";
    const full = `<!DOCTYPE html><html><head><meta charset=\"utf-8\" /><style>${css}</style></head><body>${html}<script>${js}<\/script></body></html>`;
    doc.open();
    doc.write(full);
    doc.close();
  }, [view, artifact.htmlCode, artifact.cssCode, artifact.jsCode]);

  return (
    <div className="flex flex-col h-full">
      {/* Content Area */}
      <div className="p-2 bg-background flex-1 min-h-0 overflow-hidden">
        {view === "preview" ? (
          <iframe
            ref={iframeRef}
            className="w-full bg-white rounded border h-full"
            sandbox="allow-scripts allow-same-origin"
          />
        ) : (
          <div className="h-full overflow-auto no-xy-scrollbar">
            <ShikiHighlighter
              language={
                codeTab === "html"
                  ? "html"
                  : codeTab === "css"
                  ? "css"
                  : "javascript"
              }
              theme={isDarkMode ? "github-dark" : "min-light"}
              className="text-xs sm:text-sm font-mono bg-transparent"
              showLanguage={false}
            >
              {codeTab === "html"
                ? artifact.htmlCode || "// No HTML content"
                : codeTab === "css"
                ? artifact.cssCode || "// No CSS content"
                : artifact.jsCode || "// No JavaScript content"}
            </ShikiHighlighter>
          </div>
        )}
      </div>
    </div>
  );
}

function DiagramViewer({ artifact }: { artifact: PlanArtifact }) {
  const primaryCode = artifact.diagramCode || "";
  const mermaidCode = artifact.mermaidCode || primaryCode;
  const hasMermaid =
    (artifact.outputFormat || "mermaid").toLowerCase() === "mermaid" ||
    !!artifact.mermaidCode;
  const hasSql = !!artifact.sqlSchema?.trim();
  const hasPrisma = !!artifact.prismaSchema?.trim();
  const hasTypeOrm = !!artifact.typeormEntities?.trim();
  const hasSvg = !!artifact.diagramSvg?.trim();
  const hasD3 = !!artifact.d3Code?.trim();
  const tabs = React.useMemo(() => {
    const candidates = [
      { id: "visual", label: "Visual", available: hasMermaid || hasSvg },
      { id: "mermaid", label: "Mermaid", available: !!mermaidCode },
      { id: "svg", label: "SVG", available: hasSvg },
      { id: "d3", label: "D3.js", available: hasD3 },
      { id: "sql", label: "SQL", available: hasSql },
      { id: "prisma", label: "Prisma", available: hasPrisma },
      { id: "typeorm", label: "TypeORM", available: hasTypeOrm },
    ];
    return candidates.filter((tab) => tab.available);
  }, [hasMermaid, hasSvg, hasD3, hasSql, hasPrisma, hasTypeOrm, mermaidCode]);

  const [tab, setTab] = React.useState<string>(tabs[0]?.id ?? "visual");

  React.useEffect(() => {
    if (!tabs.find((t) => t.id === tab)) {
      setTab(tabs[0]?.id ?? "visual");
    }
  }, [tabs, tab]);

  const getCurrentTabContent = () => {
    switch (tab) {
      case "visual":
        if (hasMermaid) {
          return mermaidCode;
        }
        if (artifact.diagramSvg) {
          return artifact.diagramSvg;
        }
        return primaryCode;
      case "mermaid":
        return mermaidCode;
      case "svg":
        return artifact.diagramSvg || "// No SVG content";
      case "d3":
        return artifact.d3Code?.trim() || "";
      case "sql":
        return artifact.sqlSchema?.trim() || "";
      case "prisma":
        return artifact.prismaSchema?.trim() || "";
      case "typeorm":
        return artifact.typeormEntities?.trim() || "";
      default:
        return primaryCode;
    }
  };

  const renderContent = () => {
    switch (tab) {
      case "visual":
        if (hasMermaid) {
          return <MermaidBlock code={mermaidCode} />;
        }
        if (artifact.diagramSvg) {
          return <SvgBlock svg={artifact.diagramSvg} />;
        }
        return <CodeBlock code={primaryCode} language="text" />;
      case "mermaid":
        return <CodeBlock code={mermaidCode} language="mermaid" />;
      case "svg":
        return hasSvg ? (
          <SvgBlock svg={artifact.diagramSvg!} />
        ) : (
          <CodeBlock code={"// No SVG content"} language="text" />
        );
      case "d3":
        return (
          <CodeBlock
            code={artifact.d3Code?.trim() || ""}
            language="javascript"
          />
        );
      case "sql":
        return (
          <CodeBlock code={artifact.sqlSchema?.trim() || ""} language="sql" />
        );
      case "prisma":
        return (
          <CodeBlock
            code={artifact.prismaSchema?.trim() || ""}
            language="prisma"
          />
        );
      case "typeorm":
        return (
          <CodeBlock
            code={artifact.typeormEntities?.trim() || ""}
            language="typescript"
          />
        );
      default:
        return <CodeBlock code={primaryCode} language="text" />;
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Simple Tab Bar */}
      {tabs.length > 1 && (
        <div className="flex items-center gap-1 bg-muted/30 px-3 py-2 border-b flex-shrink-0">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-3 py-1.5 rounded text-xs transition-colors ${
                tab === t.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-background hover:bg-muted"
              }`}
            >
              {t.label}
            </button>
          ))}
          <div className="ml-auto">
            <CopyButton text={getCurrentTabContent()} />
          </div>
        </div>
      )}
      {tabs.length === 1 && (
        <div className="flex items-center justify-end bg-muted/30 px-3 py-2 border-b flex-shrink-0">
          <CopyButton text={getCurrentTabContent()} />
        </div>
      )}
      <div className=" bg-background flex-1 min-h-0 overflow-hidden">
        {renderContent()}
      </div>
    </div>
  );
}

function ZoomableContainer({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const [zoom, setZoom] = React.useState(1);
  const [pan, setPan] = React.useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = React.useState(false);
  const dragStartRef = React.useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const panRef = React.useRef({ x: 0, y: 0 });
  const containerRef = React.useRef<HTMLDivElement>(null);
  const contentRef = React.useRef<HTMLDivElement>(null);
  const animationFrameRef = React.useRef<number | null>(null);
  const touchStartDistanceRef = React.useRef<number | null>(null);
  const touchStartZoomRef = React.useRef<number>(1);

  const MIN_ZOOM = 0.5;
  const MAX_ZOOM = 10;
  const ZOOM_STEP = 0.2;

  const handleZoom = (delta: number) => {
    setZoom((z) => Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, z + delta)));
  };

  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    panRef.current = { x: 0, y: 0 };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      panX: panRef.current.x,
      panY: panRef.current.y,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;

    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    animationFrameRef.current = requestAnimationFrame(() => {
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;

      const newPan = {
        x: dragStartRef.current.panX + dx,
        y: dragStartRef.current.panY + dy,
      };

      panRef.current = newPan;
      setPan(newPan);
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (!e.ctrlKey && !e.metaKey) return;
    e.preventDefault();
    const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
    handleZoom(delta);
  };

  const getDistance = (
    touch1: React.Touch | Touch,
    touch2: React.Touch | Touch
  ): number => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const distance = getDistance(e.touches[0], e.touches[1]);
      touchStartDistanceRef.current = distance;
      touchStartZoomRef.current = zoom;
      setIsDragging(false);
    } else if (e.touches.length === 1) {
      e.preventDefault();
      setIsDragging(true);
      dragStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        panX: panRef.current.x,
        panY: panRef.current.y,
      };
      touchStartDistanceRef.current = null;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && touchStartDistanceRef.current !== null) {
      // Pinch zoom
      e.preventDefault();
      const currentDistance = getDistance(e.touches[0], e.touches[1]);
      const scale = currentDistance / touchStartDistanceRef.current;
      const newZoom = Math.max(
        MIN_ZOOM,
        Math.min(MAX_ZOOM, touchStartZoomRef.current * scale)
      );
      setZoom(newZoom);
      setIsDragging(false);
    } else if (
      e.touches.length === 1 &&
      isDragging &&
      touchStartDistanceRef.current === null
    ) {
      // Single finger drag
      e.preventDefault();
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      animationFrameRef.current = requestAnimationFrame(() => {
        const dx = e.touches[0].clientX - dragStartRef.current.x;
        const dy = e.touches[0].clientY - dragStartRef.current.y;

        const newPan = {
          x: dragStartRef.current.panX + dx,
          y: dragStartRef.current.panY + dy,
        };

        panRef.current = newPan;
        setPan(newPan);
      });
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    touchStartDistanceRef.current = null;
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  };

  React.useEffect(() => {
    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative h-full flex flex-col bg-white dark:bg-zinc-900 rounded ${className}`}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        cursor: isDragging ? "grabbing" : "grab",
        touchAction: "none",
      }}
    >
      {/* Zoom Controls */}
      <div className="absolute top-2 left-2 z-10 flex gap-1 bg-background/80 backdrop-blur p-1 rounded border shadow-md">
        <button
          onClick={() => handleZoom(ZOOM_STEP)}
          className="p-1.5 hover:bg-muted rounded transition-colors hover:shadow-sm active:scale-95"
          title="Zoom In (Ctrl + Scroll)"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => handleZoom(-ZOOM_STEP)}
          className="p-1.5 hover:bg-muted rounded transition-colors hover:shadow-sm active:scale-95"
          title="Zoom Out (Ctrl + Scroll)"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <div className="px-2 py-1 text-xs font-mono text-muted-foreground select-none">
          {Math.round(zoom * 100)}%
        </div>
        <button
          onClick={handleReset}
          className="p-1.5 hover:bg-muted rounded transition-colors hover:shadow-sm active:scale-95"
          title="Reset Zoom & Pan"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Draggable Content */}
      <div
        ref={contentRef}
        className="flex-1 overflow-hidden select-none"
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        style={{
          cursor: isDragging ? "grabbing" : "grab",
          touchAction: "none",
        }}
      >
        <div
          className="h-full w-full origin-center"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: "center",
            willChange: isDragging ? "transform" : "auto",
            transition: isDragging ? "none" : "transform 0.3s ease-out",
          }}
        >
          <div className="w-full h-full flex items-center justify-center">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

function MermaidBlock({ code }: { code: string }) {
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!code || typeof window === "undefined") return;
      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({ startOnLoad: false, securityLevel: "loose" });
        const { svg } = await mermaid.render(
          `mmd-${Math.random().toString(36).slice(2)}`,
          code
        );
        if (!cancelled && ref.current) {
          ref.current.innerHTML = svg;
        }
      } catch (e) {
        if (!cancelled && ref.current) {
          ref.current.textContent = "Failed to render Mermaid diagram";
        }
      }
    })();
    return () => {
      cancelled = true;
      if (ref.current) ref.current.innerHTML = "";
    };
  }, [code]);
  return (
    <ZoomableContainer className="m-2">
      <div ref={ref} className="p-2" />
    </ZoomableContainer>
  );
}

function SvgBlock({ svg }: { svg: string }) {
  return (
    <ZoomableContainer className="p-2">
      <div dangerouslySetInnerHTML={{ __html: svg }} />
    </ZoomableContainer>
  );
}

function CodeBlock({ code, language }: { code: string; language: string }) {
  const { theme } = useTheme();
  const isDarkMode = theme === "dark" || theme === "capybara-dark";

  return (
    <div className="h-full overflow-auto no-xy-scrollbar bg-muted/30 rounded">
      <ShikiHighlighter
        language={language}
        theme={isDarkMode ? "github-dark" : "min-light"}
        className="text-xs sm:text-sm font-mono bg-transparent "
        showLanguage={false}
      >
        {code || `// No ${language} content`}
      </ShikiHighlighter>
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = React.useState(false);
  return (
    <button
      className="text-xs px-2 py-1 rounded border"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {}
      }}
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}
