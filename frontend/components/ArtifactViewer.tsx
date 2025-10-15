"use client";
import React from "react";
import { PlanArtifact } from "@/lib/appwriteDB";
import ShikiHighlighter from "react-shiki";
import { useTheme } from "next-themes";
import { Eye, Code2 } from "lucide-react";

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
    <div
      ref={ref}
      className="h-full overflow-auto no-xy-scrollbar bg-white dark:bg-zinc-900 m-2 p-2 rounded"
    />
  );
}

function SvgBlock({ svg }: { svg: string }) {
  return (
    <div
      className="h-full overflow-auto no-xy-scrollbar bg-white dark:bg-zinc-900 p-2 rounded"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
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
