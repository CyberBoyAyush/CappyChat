/**
 * MarkdownRenderer Component
 *
 * Used in: frontend/components/Message.tsx, frontend/components/ChatMessageReasoning.tsx
 * Purpose: Renders markdown content with syntax highlighting, math support, and copy functionality.
 * Optimized with memoization for performance. Supports code blocks, LaTeX math, and GFM features.
 */

import { memo, useMemo, useState, createContext, useContext, useEffect } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { marked } from 'marked';
import ShikiHighlighter from 'react-shiki';
import type { ComponentProps } from 'react';
import type { ExtraProps } from 'react-markdown';
import { Check, Copy } from 'lucide-react';

// New: Add theme detection
function useThemeDetection() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Check initial theme
    setIsDarkMode(document.documentElement.classList.contains('dark'));

    // Set up a mutation observer to watch for theme changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          setIsDarkMode(document.documentElement.classList.contains('dark'));
        }
      });
    });

    observer.observe(document.documentElement, { attributes: true });

    return () => observer.disconnect();
  }, []);

  return isDarkMode;
}

type CodeComponentProps = ComponentProps<'code'> & ExtraProps;
type MarkdownSize = 'default' | 'small';

// Context to pass size down to components
const MarkdownSizeContext = createContext<MarkdownSize>('default');

const components: Components = {
  code: CodeBlock as Components['code'],
  pre: ({ children }) => <>{children}</>,
};

function CodeBlock({ children, className, ...props }: CodeComponentProps) {
  const size = useContext(MarkdownSizeContext);
  const match = /language-(\w+)/.exec(className || '');
  const isDarkMode = useThemeDetection();

  if (match) {
    const lang = match[1];
    return (
      <div className="code-block-container rounded-lg overflow-hidden border border-border bg-background shadow-sm my-4">
        <Codebar lang={lang} codeString={String(children)} />
        <div className="bg-background">
          <ShikiHighlighter
            language={lang}
            theme={isDarkMode ? "github-dark" : "min-light"}
            className="text-sm font-mono overflow-x-auto mobile-text p-4 bg-transparent"
            showLanguage={false}
          >
            {String(children)}
          </ShikiHighlighter>
        </div>
      </div>
    );
  }

  const inlineCodeClasses =
    size === 'small'
      ? 'mx-0.5 overflow-auto rounded-md px-1 py-0.5 bg-secondary text-foreground font-mono text-xs border border-border'
      : 'mx-0.5 overflow-auto rounded-md px-2 py-1 bg-secondary text-foreground font-mono border border-border';

  return (
    <code className={inlineCodeClasses} {...props}>
      {children}
    </code>
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
      console.error('Failed to copy code to clipboard:', error);
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

function parseMarkdownIntoBlocks(markdown: string): string[] {
  const tokens = marked.lexer(markdown);
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

MarkdownRendererBlock.displayName = 'MarkdownRendererBlock';

const MarkdownRenderer = memo(
  ({
    content,
    id,
    size = 'default',
  }: {
    content: string;
    id: string;
    size?: MarkdownSize;
  }) => {
    const blocks = useMemo(() => parseMarkdownIntoBlocks(content), [content]);

    const proseClasses =
      size === 'small'
        ? 'prose prose-sm dark:prose-invert break-words max-w-none w-full prose-code:before:content-none prose-code:after:content-none'
        : 'prose prose-base dark:prose-invert break-words max-w-none w-full prose-code:before:content-none prose-code:after:content-none';

    return (
      <MarkdownSizeContext.Provider value={size}>
        <div className={proseClasses}>
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

MarkdownRenderer.displayName = 'MarkdownRenderer';

export default MarkdownRenderer;
