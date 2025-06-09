/**
 * Panel Components Barrel Export
 *
 * Used in: frontend/components/AppPanel.tsx and other components needing panel functionality
 * Purpose: Centralized export point for all panel-related components and hooks.
 * Provides clean imports for conversation panel, headers, footers, thread management, and list items.
 */

// Panel components barrel export
export { default as ConversationPanel } from './ConversationPanel';
export { default as PanelHeader } from './PanelHeader';
export { default as PanelFooter } from './PanelFooter';
export { default as ThreadListItem } from './ThreadListItem';
export { useThreadManager } from './ThreadManager';
export type { ThreadData, ThreadOperations } from './ThreadManager';
