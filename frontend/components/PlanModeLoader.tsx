/**
 * PlanModeLoader Component
 *
 * Purpose: Shows a loading animation when Plan Mode is executing tools.
 * Displays which tool is being called and progress.
 */

import React, { useMemo } from 'react';
import { Sparkles, Code, Workflow, Clock, FileCode, Layout } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PlanModeLoaderProps {
  userQuery?: string;
  className?: string;
}

// Detect which artifacts are likely being created based on query
function detectArtifacts(query: string): {
  name: string;
  icon: React.ReactNode;
  description: string;
  color: string;
} {
  const lowerQuery = query.toLowerCase();

  // MVP/UI detection
  if (
    lowerQuery.includes('mvp') ||
    lowerQuery.includes('ui') ||
    lowerQuery.includes('interface') ||
    lowerQuery.includes('front') ||
    lowerQuery.includes('web app') ||
    lowerQuery.includes('website')
  ) {
    return {
      name: 'MVP Generator',
      icon: <Layout className="h-4 w-4" />,
      description: 'Creating MVP artifact with HTML, CSS, and JavaScript...',
      color: 'text-blue-500',
    };
  }

  // Diagram detection
  if (
    lowerQuery.includes('diagram') ||
    lowerQuery.includes('flowchart') ||
    lowerQuery.includes('erd') ||
    lowerQuery.includes('architecture') ||
    lowerQuery.includes('visualize') ||
    lowerQuery.includes('flow')
  ) {
    return {
      name: 'Diagram Generator',
      icon: <Workflow className="h-4 w-4" />,
      description: 'Generating diagram artifact...',
      color: 'text-purple-500',
    };
  }

  // Code/Schema detection
  if (
    lowerQuery.includes('schema') ||
    lowerQuery.includes('database') ||
    lowerQuery.includes('sql') ||
    lowerQuery.includes('prisma') ||
    lowerQuery.includes('typeorm')
  ) {
    return {
      name: 'Schema Generator',
      icon: <FileCode className="h-4 w-4" />,
      description: 'Creating database schema artifacts...',
      color: 'text-green-500',
    };
  }

  // Default: Plan Mode
  return {
    name: 'Plan Mode Tools',
    icon: <Code className="h-4 w-4" />,
    description: 'Analyzing your request and generating artifacts...',
    color: 'text-primary',
  };
}

export function PlanModeLoader({
  userQuery = "planning request",
  className
}: PlanModeLoaderProps) {
  const tool = useMemo(() => detectArtifacts(userQuery), [userQuery]);

  return (
    <div className={cn(
      "flex flex-col gap-4 p-6 bg-card/40 border border-border/50 rounded-xl",
      "animate-pulse",
      className
    )}>
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className={cn(
          "flex items-center justify-center w-8 h-8 rounded-lg border",
          "bg-primary/10 border-primary/20"
        )}>
          <Sparkles className="h-4 w-4 text-primary animate-pulse" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <span className={tool.color}>{tool.icon}</span>
            {tool.name}
            <div className="w-2 h-2 rounded-full bg-primary animate-ping" />
          </h3>
        </div>
      </div>

      {/* User Query */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Sparkles className="h-3.5 w-3.5" />
        <span className="font-medium">Request</span>
      </div>
      <div className="bg-background/50 border border-border/30 rounded-lg p-3">
        <p className="text-sm text-foreground font-medium">"{userQuery}"</p>
      </div>

      {/* Loading Animation */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Clock className="h-3.5 w-3.5 animate-spin" />
        <span>{tool.description}</span>
      </div>

      {/* Progress Dots */}
      <div className="flex items-center gap-1">
        <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  );
}

export default PlanModeLoader;
