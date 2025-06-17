/**
 * Auth Callback Page
 * 
 * Handles OAuth callback from providers like Google.
 * Processes the authentication result and redirects users appropriately.
 */

'use client';

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/frontend/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

const AuthCallbackPage: React.FC = () => {
  const { getCurrentUser, refreshUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Set a maximum timeout to prevent hanging
    const timeoutId = setTimeout(() => {
      console.log('Auth callback timeout, redirecting to home');
      navigate('/', { replace: true });
    }, 10000); // 10 second timeout
    const handleCallback = async () => {
      try {
        // Check if this is actually an OAuth callback by looking for URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const hasOAuthParams = urlParams.has('code') || urlParams.has('state') || urlParams.has('error');

        // If no OAuth parameters, this might be a direct visit - redirect to home
        if (!hasOAuthParams) {
          console.log('No OAuth parameters found, redirecting to home');
          navigate('/', { replace: true });
          return;
        }

        // Give Appwrite a moment to process the OAuth callback
        await new Promise(resolve => setTimeout(resolve, 500));

        // Check if user is now authenticated
        const user = await getCurrentUser();

        if (user) {
          // Force refresh the user state in AuthContext to ensure immediate UI update
          await refreshUser();

          // Dispatch a custom event to notify other components of successful authentication
          window.dispatchEvent(new CustomEvent('authStateChanged', { detail: { authenticated: true, user } }));

          // Check if there's a stored redirect path
          const redirectPath = sessionStorage.getItem('auth_redirect');
          sessionStorage.removeItem('auth_redirect');

          // Small delay to ensure state updates are processed
          await new Promise(resolve => setTimeout(resolve, 100));

          // Redirect to intended page or default to chat with replace to avoid back button issues
          navigate(redirectPath || '/chat', { replace: true });
        } else {
          // Try one more time after a longer delay
          await new Promise(resolve => setTimeout(resolve, 1500));
          const retryUser = await getCurrentUser();

          if (retryUser) {
            // Force refresh the user state in AuthContext to ensure immediate UI update
            await refreshUser();

            // Dispatch a custom event to notify other components of successful authentication
            window.dispatchEvent(new CustomEvent('authStateChanged', { detail: { authenticated: true, user: retryUser } }));

            const redirectPath = sessionStorage.getItem('auth_redirect');
            sessionStorage.removeItem('auth_redirect');

            // Small delay to ensure state updates are processed
            await new Promise(resolve => setTimeout(resolve, 100));

            navigate(redirectPath || '/chat', { replace: true });
          } else {
            // Authentication failed, redirect to home instead of login to avoid loops
            navigate('/?error=Authentication failed', { replace: true });
          }
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        navigate('/?error=Authentication failed', { replace: true });
      }
    };

    handleCallback();

    // Cleanup timeout on unmount
    return () => {
      clearTimeout(timeoutId);
    };
  }, [getCurrentUser, navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">Completing sign in...</h2>
          <p className="text-muted-foreground">
            Please wait while we finish setting up your account.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthCallbackPage;
