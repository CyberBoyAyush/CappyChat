/**
 * Drawer Components Barrel Export
 *
 * Used in: Various components that need drawer functionality
 * Purpose: Centralized export point for all drawer-related components and hooks.
 * Provides clean imports for sidebar container, sections, conversation list, and actions.
 */

// Drawer components barrel export
export { default as SidebarContainer } from './SidebarContainer';
export { default as DrawerTopSection } from './DrawerTopSection';
export { default as DrawerBottomSection } from './DrawerBottomSection';
export { default as ConversationsList } from './ConversationsList';
export { default as ConversationItem } from './ConversationItem';
export { default as useConversationActions } from './hooks/useConversationActions';
