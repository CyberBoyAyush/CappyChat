/**
 * MarkdownRenderer Component
 *
 * Used in: frontend/components/Message.tsx, frontend/components/ChatMessageReasoning.tsx
 * Purpose: Renders markdown content with syntax highlighting, math support, and copy functionality.
 * Optimized with memoization for performance. Supports code blocks, LaTeX math, and GFM features.
 */

import {
  memo,
  useMemo,
  useState,
  createContext,
  useContext,
  useEffect,
} from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { marked } from "marked";
import ShikiHighlighter from "react-shiki";
import type { ComponentProps } from "react";
import type { ExtraProps } from "react-markdown";
import { Check, Copy, ExternalLink } from "lucide-react";

// Theme detection that supports both default and Capybara dark themes
function useThemeDetection() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const computeIsDark = () => {
      const root = document.documentElement;
      return (
        root.classList.contains("dark") ||
        root.classList.contains("capybara-dark")
      );
    };

    // Initial
    setIsDarkMode(computeIsDark());

    // Watch for theme class changes
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.attributeName === "class") {
          setIsDarkMode(computeIsDark());
        }
      }
    });
    observer.observe(document.documentElement, { attributes: true });

    return () => observer.disconnect();
  }, []);

  return isDarkMode;
}

type CodeComponentProps = ComponentProps<"code"> & ExtraProps;
type LinkComponentProps = ComponentProps<"a"> & ExtraProps;
type MarkdownSize = "default" | "small";

// Context to pass size down to components
const MarkdownSizeContext = createContext<MarkdownSize>("default");

const components: Components = {
  code: CodeBlock as Components["code"],
  pre: ({ children }) => <>{children}</>,
  a: LinkComponent as Components["a"],
  hr: ({ ...props }) => (
    <hr className="my-6 border-0 h-px bg-ring/30" {...props} />
  ),
};

function CodeBlock({ children, className, ...props }: CodeComponentProps) {
  const size = useContext(MarkdownSizeContext);
  const match = /language-(\w+)/.exec(className || "");
  const isDarkMode = useThemeDetection();

  const codeContent = String(children);

  // ReactMarkdown passes different props for code blocks vs inline code
  // Code blocks (from ```) will have a parent <pre> element, which we detect via className or content
  const isCodeBlock =
    match || // Has language specifier
    (className && className.includes("language-")) || // Has language class
    codeContent.includes("\n") || // Multi-line content
    codeContent.length > 80; // Long single line (likely a code block)

  if (isCodeBlock) {
    const lang = match ? match[1] : "text";
    return (
      <div className="code-block-container rounded-lg overflow-hidden border border-border bg-background shadow-sm my-4 max-w-full">
        <Codebar lang={lang} codeString={codeContent} />
        <div className="bg-background overflow-x-auto max-w-full">
          <ShikiHighlighter
            language={lang}
            theme={isDarkMode ? "github-dark" : "min-light"}
            className="text-xs sm:text-sm font-mono overflow-x-auto mobile-text p-3 sm:p-4 bg-transparent min-w-0 max-w-full"
            showLanguage={false}
          >
            {codeContent}
          </ShikiHighlighter>
        </div>
      </div>
    );
  }

  // For single-line inline code
  const inlineCodeClasses =
    size === "small"
      ? "mx-0.5 overflow-x-auto rounded-md px-1 py-0.5 bg-secondary text-foreground font-mono text-xs border border-border break-all max-w-full"
      : "mx-0.5 overflow-x-auto rounded-md px-2 py-1 bg-secondary text-foreground font-mono text-xs sm:text-sm border border-border break-all max-w-full";

  return (
    <code className={inlineCodeClasses} {...props}>
      {children}
    </code>
  );
}

function LinkComponent({ href, children, ...props }: LinkComponentProps) {
  const isExternal =
    href && (href.startsWith("http://") || href.startsWith("https://"));

  return (
    <a
      href={href}
      target={isExternal ? "_blank" : undefined}
      rel={isExternal ? "noopener noreferrer" : undefined}
      className="text-primary hover:text-primary/80 font-medium underline underline-offset-2 decoration-primary/60 hover:decoration-primary transition-all duration-200 inline-flex items-center gap-0.5 break-all cursor-pointer"
      {...props}
    >
      {children}
      {isExternal && <ExternalLink className="w-3 h-3 flex-shrink-0 opacity-70 hover:opacity-100" />}
    </a>
  );
}

function Codebar({ lang, codeString }: { lang: string; codeString: string }) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(codeString);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      console.error("Failed to copy code to clipboard:", error);
    }
  };

  return (
    <div className="code-block-header flex justify-between items-center px-4 py-2 bg-secondary text-muted-foreground border-b border-border rounded-t-lg">
      <span className="text-sm font-mono">{lang}</span>
      <button
        onClick={copyToClipboard}
        className="text-sm cursor-pointer hover:text-primary transition-colors p-1 rounded focus-enhanced"
        aria-label={copied ? "Copied!" : "Copy code"}
      >
        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
      </button>
    </div>
  );
}

function preprocessTreeStructures(content: string): string {
  // Detect tree structures and wrap them in code blocks if not already wrapped
  const lines = content.split("\n");
  const processedLines: string[] = [];
  let inCodeBlock = false;
  let inTreeStructure = false;
  let treeLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Track if we're inside a code block
    if (line.trim().startsWith("```")) {
      inCodeBlock = !inCodeBlock;

      // If we were collecting tree lines and hit a code block, flush them
      if (treeLines.length > 0) {
        processedLines.push("```text");
        processedLines.push(...treeLines);
        processedLines.push("```");
        treeLines = [];
        inTreeStructure = false;
      }

      processedLines.push(line);
      continue;
    }

    // Skip processing if we're inside a code block
    if (inCodeBlock) {
      processedLines.push(line);
      continue;
    }

    // Check if line contains tree structure characters
    const hasTreeChars = /[├└│]/.test(line) || /^[\s]*[├└]──/.test(line);

    if (hasTreeChars) {
      if (!inTreeStructure) {
        inTreeStructure = true;
      }
      treeLines.push(line);
    } else {
      // If we were in a tree structure and hit a non-tree line, wrap the collected lines
      if (inTreeStructure && treeLines.length > 0) {
        processedLines.push("```text");
        processedLines.push(...treeLines);
        processedLines.push("```");
        treeLines = [];
        inTreeStructure = false;
      }
      processedLines.push(line);
    }
  }

  // Handle any remaining tree lines at the end
  if (treeLines.length > 0) {
    processedLines.push("```text");
    processedLines.push(...treeLines);
    processedLines.push("```");
  }

  return processedLines.join("\n");
}

function parseMarkdownIntoBlocks(markdown: string): string[] {
  const preprocessed = preprocessTreeStructures(markdown);
  const tokens = marked.lexer(preprocessed);
  return tokens.map((token) => token.raw);
}

function PureMarkdownRendererBlock({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, [remarkMath]]}
      rehypePlugins={[rehypeKatex]}
      components={components}
    >
      {content}
    </ReactMarkdown>
  );
}

const MarkdownRendererBlock = memo(
  PureMarkdownRendererBlock,
  (prevProps, nextProps) => {
    if (prevProps.content !== nextProps.content) return false;
    return true;
  }
);

MarkdownRendererBlock.displayName = "MarkdownRendererBlock";

const MarkdownRenderer = memo(
  ({
    content,
    id,
    size = "default",
  }: {
    content: string;
    id: string;
    size?: MarkdownSize;
  }) => {
    const blocks = useMemo(() => parseMarkdownIntoBlocks(content), [content]);

    const proseClasses =
      size === "small"
        ? "prose prose-sm dark:prose-invert break-words max-w-none w-full prose-code:before:content-none prose-code:after:content-none overflow-hidden prose-pre:overflow-x-auto prose-pre:max-w-full prose-table:overflow-x-auto prose-ul:break-words prose-ol:break-words prose-li:break-words prose-strong:text-foreground prose-em:text-foreground prose-headings:text-foreground"
        : "prose prose-base dark:prose-invert break-words max-w-none w-full prose-code:before:content-none prose-code:after:content-none overflow-hidden prose-pre:overflow-x-auto prose-pre:max-w-full prose-table:overflow-x-auto prose-ul:break-words prose-ol:break-words prose-li:break-words prose-p:break-words prose-p:overflow-wrap-anywhere prose-strong:text-foreground prose-em:text-foreground prose-headings:text-foreground";

    return (
      <MarkdownSizeContext.Provider value={size}>
        <div
          className={`${proseClasses} mobile-responsive-markdown text-foreground`}
        >
          {blocks.map((block, index) => (
            <MarkdownRendererBlock
              content={block}
              key={`${id}-block-${index}`}
            />
          ))}
        </div>
      </MarkdownSizeContext.Provider>
    );
  }
);

MarkdownRenderer.displayName = "MarkdownRenderer";

export default MarkdownRenderer;
