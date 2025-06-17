/**
 * MessageReasoning Component
 *
 * Used in: frontend/components/Message.tsx
 * Purpose: Displays AI reasoning/thinking process in an expandable/collapsible section.
 * Shows the AI's step-by-step reasoning before providing the final answer.
 */

import { memo, useState } from 'react';
import MarkdownRenderer from './MarkdownRenderer';
import { ChevronDownIcon, ChevronUpIcon, Brain } from 'lucide-react';
import { Button } from '@/frontend/components/ui/button';
import { cn } from '@/lib/utils';

function PureMessageReasoning({
  reasoning,
  id,
}: {
  reasoning: string;
  id: string;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="flex flex-col gap-3 pb-3 max-w-3xl w-full">
      <Button
        onClick={() => setIsExpanded(!isExpanded)}
        variant="ghost"
        size="sm"
        className={cn(
          "flex items-center justify-start gap-2 h-8 px-3 text-muted-foreground hover:text-foreground",
          "hover:bg-accent/50 transition-all duration-200 focus-enhanced",
          "border border-border/30 hover:border-border/60 rounded-lg",
          "bg-card/30 backdrop-blur-sm hover:bg-card/50"
        )}
      >
        <Brain className="w-4 h-4 text-primary/70" />
        <span className="text-sm font-medium">AI Reasoning</span>
        <div className="ml-auto">
          {isExpanded ? (
            <ChevronUpIcon className="w-4 h-4 transition-transform duration-200" />
          ) : (
            <ChevronDownIcon className="w-4 h-4 transition-transform duration-200" />
          )}
        </div>
      </Button>

      {isExpanded && (
        <div
          className={cn(
            "p-4 rounded-xl border border-border/50 text-sm",
            "bg-card/50 backdrop-blur-sm shadow-sm",
            "animate-in slide-in-from-top-2 duration-200",
            "hover:border-border/70 transition-all duration-200"
          )}
        >
          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border/30">
            <Brain className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">Thinking Process</span>
          </div>
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <MarkdownRenderer content={reasoning} id={id} size="small" />
          </div>
        </div>
      )}
    </div>
  );
}

export default memo(PureMessageReasoning, (prev, next) => {
  return prev.reasoning === next.reasoning && prev.id === next.id;
});
