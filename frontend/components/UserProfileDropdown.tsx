/**
 * User Profile Dropdown Component
 * 
 * Displays user information and provides access to profile actions like logout.
 * Shows user avatar, name, email, and account management options.
 */

'use client';

import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/frontend/contexts/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/frontend/components/ui/dropdown-menu';
import { Button } from '@/frontend/components/ui/button';
import { 
  User, 
  Settings, 
  LogOut, 
  Shield,
  ChevronDown
} from 'lucide-react';

const UserProfileDropdown: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleSettings = () => {
    navigate('/settings');
  };

  // Don't render if no user or on authentication pages
  if (!user) return null;
  
  // Don't render on authentication pages
  const isAuthPage = location.pathname.startsWith('/auth/') || 
                     location.pathname === '/auth/login' || 
                     location.pathname === '/auth/signup';
  if (isAuthPage) return null;

  // Get user initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const userInitials = user.name ? getInitials(user.name) : 'U';
  const displayName = user.name || 'User';
  const displayEmail = user.email || '';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex items-center space-x-2 px-3 py-2 h-auto hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
        >
          {/* User Avatar */}
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-medium shadow-sm">
            {userInitials}
          </div>
          
          {/* User Info */}
          <div className="flex flex-col items-start min-w-0">
            <span className="text-sm font-medium text-sidebar-foreground truncate max-w-32">
              {displayName}
            </span>
          </div>
          
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent 
        align="end" 
        className="w-64 p-2 bg-card border-border"
        sideOffset={8}
      >
        {/* User Header */}
        <DropdownMenuLabel className="px-3 py-2">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-medium shadow-sm">
              {userInitials}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-medium text-foreground truncate">
                {displayName}
              </span>
              <span className="text-sm text-muted-foreground truncate">
                {displayEmail}
              </span>
            </div>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {/* User Actions */}
        <DropdownMenuItem className="flex items-center space-x-2 cursor-pointer px-3 py-2 text-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
          <User className="h-4 w-4" />
          <span>Profile</span>
        </DropdownMenuItem>
        <DropdownMenuItem className="flex items-center space-x-2 cursor-pointer px-3 py-2 text-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
          <Shield className="h-4 w-4" />
          <span>Privacy & Security</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Settings */}
        <DropdownMenuItem
          onClick={handleSettings}
          className="flex items-center space-x-2 cursor-pointer px-3 py-2 text-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <Settings className="h-4 w-4" />
          <span>Settings</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Logout */}
        <DropdownMenuItem
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="flex items-center space-x-2 cursor-pointer px-3 py-2 text-destructive hover:bg-destructive/10 focus:text-destructive"
        >
          <LogOut className="h-4 w-4" />
          <span>{isLoggingOut ? 'Signing out...' : 'Sign out'}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserProfileDropdown;
