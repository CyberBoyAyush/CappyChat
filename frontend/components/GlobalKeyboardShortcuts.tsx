/**
 * GlobalKeyboardShortcuts Component
 *
 * Purpose: Handles global keyboard shortcuts for the entire application.
 * - Cmd+K / Ctrl+Shift+K: Open global search dialog
 * - Cmd+Shift+O / Ctrl+Shift+O: Create new chat
 * - Cmd+B / Ctrl+Shift+B: Toggle sidebar (handled in sidebar component)
 */

import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import GlobalSearchDialog from "./GlobalSearchDialog";
import { useAuth } from "@/frontend/contexts/AuthContext";

interface GlobalKeyboardShortcutsProps {
  children: React.ReactNode;
}

export default function GlobalKeyboardShortcuts({ children }: GlobalKeyboardShortcutsProps) {
  const [isSearchDialogOpen, setIsSearchDialogOpen] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const handleOpenSearch = useCallback(() => {
    if (isAuthenticated) {
      setIsSearchDialogOpen(true);
    }
  }, [isAuthenticated]);

  const handleCloseSearch = useCallback(() => {
    setIsSearchDialogOpen(false);
  }, []);

  const handleNewChat = useCallback(() => {
    if (isAuthenticated) {
      // If already on chat page, just navigate to /chat to create new chat
      // If on other pages, navigate to /chat
      navigate('/chat');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle shortcuts if user is authenticated
      if (!isAuthenticated) return;

      // Detect platform
      const isMac = typeof window !== 'undefined' &&
        (window.navigator.userAgent.includes('Mac') || window.navigator.userAgent.includes('iPhone'));

      // Don't trigger shortcuts if user is typing in an input field
      const activeElement = document.activeElement;
      const isTyping = activeElement && (
        activeElement.tagName === 'INPUT' ||
        activeElement.tagName === 'TEXTAREA' ||
        (activeElement as HTMLElement).contentEditable === 'true' ||
        activeElement.getAttribute('role') === 'textbox'
      );

      // Global Search: Cmd+K (Mac) or Ctrl+Shift+K (Windows/Linux)
      if (event.key === 'k' || event.key === 'K') {
        const correctModifiers = isMac 
          ? (event.metaKey && !event.ctrlKey && !event.shiftKey)
          : (event.ctrlKey && event.shiftKey && !event.metaKey);
        
        if (correctModifiers) {
          event.preventDefault();
          event.stopPropagation();
          handleOpenSearch();
          return;
        }
      }

      // New Chat: Cmd+Shift+O (Mac) or Ctrl+Shift+O (Windows/Linux)
      if ((event.key === 'o' || event.key === 'O') && !isTyping) {
        const correctModifiers = isMac 
          ? (event.metaKey && event.shiftKey && !event.ctrlKey)
          : (event.ctrlKey && event.shiftKey && !event.metaKey);
        
        if (correctModifiers) {
          event.preventDefault();
          event.stopPropagation();
          handleNewChat();
          return;
        }
      }

      // Close search dialog with Escape
      if (event.key === 'Escape' && isSearchDialogOpen) {
        event.preventDefault();
        handleCloseSearch();
        return;
      }
    };

    // Add event listener with capture to ensure we catch events before other handlers
    window.addEventListener("keydown", handleKeyDown, true);
    
    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [isAuthenticated, isSearchDialogOpen, handleOpenSearch, handleNewChat, handleCloseSearch]);

  return (
    <>
      {children}
      <GlobalSearchDialog 
        isOpen={isSearchDialogOpen} 
        onClose={handleCloseSearch} 
      />
    </>
  );
}
