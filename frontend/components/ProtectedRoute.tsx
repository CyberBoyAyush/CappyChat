/**
 * Protected Route Component
 * 
 * Wrapper component that ensures only authenticated users can access certain routes.
 * Redirects unauthenticated users to login page with return URL.
 */

'use client';

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/frontend/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import EmailVerificationGuard from './EmailVerificationGuard';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireVerification?: boolean;
  fallbackPath?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireAuth = true,
  requireVerification = true,
  fallbackPath = '/auth/login'
}) => {
  const { isAuthenticated, isEmailVerified, loading } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // If authentication is required but user is not authenticated
  if (requireAuth && !isAuthenticated) {
    // Store the current location for redirect after login
    const redirectPath = location.pathname + location.search;
    const loginPath = `${fallbackPath}${redirectPath !== '/' ? `?redirect=${encodeURIComponent(redirectPath)}` : ''}`;
    
    return <Navigate to={loginPath} replace />;
  }

  // If authentication is not required but user is authenticated (like login/signup pages)
  if (!requireAuth && isAuthenticated) {
    // Check for stored redirect path first
    const redirectPath = sessionStorage.getItem('auth_redirect');
    if (redirectPath) {
      sessionStorage.removeItem('auth_redirect');
      return <Navigate to={redirectPath} replace />;
    }
    return <Navigate to="/chat" replace />;
  }

  // If auth is required and user is authenticated, check email verification
  if (requireAuth && isAuthenticated && requireVerification && !isEmailVerified) {
    return (
      <EmailVerificationGuard>
        {children}
      </EmailVerificationGuard>
    );
  }

  // For auth pages, render without any additional layout components
  return <>{children}</>;
};

export default ProtectedRoute;
