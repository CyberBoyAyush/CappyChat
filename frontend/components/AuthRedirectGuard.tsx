/**
 * AuthRedirectGuard Component
 *
 * Purpose: Handles automatic redirection for authenticated users to prevent
 * them from accessing public pages like home, login, signup.
 * Ensures instant and reliable redirection without flickering.
 */

import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/frontend/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface AuthRedirectGuardProps {
  children: React.ReactNode;
  redirectTo?: string;
  showLoader?: boolean;
}

const AuthRedirectGuard: React.FC<AuthRedirectGuardProps> = ({ 
  children, 
  redirectTo = '/chat',
  showLoader = true 
}) => {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Only redirect if user is authenticated and not loading
    if (isAuthenticated && !loading) {
      // Check if there's a stored redirect path from login
      const storedRedirect = sessionStorage.getItem('auth_redirect');
      
      // Determine final redirect path
      let finalRedirectPath = redirectTo;
      
      if (storedRedirect) {
        finalRedirectPath = storedRedirect;
        sessionStorage.removeItem('auth_redirect');
      }
      
      // Only redirect if we're not already on the target path
      if (location.pathname !== finalRedirectPath) {
        navigate(finalRedirectPath, { replace: true });
      }
    }
  }, [isAuthenticated, loading, navigate, location.pathname, redirectTo]);

  // Show loading state while checking authentication
  if (loading) {
    return showLoader ? (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    ) : null;
  }

  // If user is authenticated, show loading while redirecting
  if (isAuthenticated) {
    return showLoader ? (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Redirecting...</p>
        </div>
      </div>
    ) : null;
  }

  // User is not authenticated, render children
  return <>{children}</>;
};

export default AuthRedirectGuard;
