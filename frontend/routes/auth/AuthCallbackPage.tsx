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
  const { getCurrentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Give Appwrite a moment to process the OAuth callback
        await new Promise(resolve => setTimeout(resolve, 500));

        // Check if user is now authenticated
        const user = await getCurrentUser();

        if (user) {
          // Check if there's a stored redirect path
          const redirectPath = sessionStorage.getItem('auth_redirect');
          sessionStorage.removeItem('auth_redirect');

          // Redirect to intended page or default to chat with replace to avoid back button issues
          navigate(redirectPath || '/chat', { replace: true });
        } else {
          // Try one more time after a longer delay
          await new Promise(resolve => setTimeout(resolve, 1000));
          const retryUser = await getCurrentUser();

          if (retryUser) {
            const redirectPath = sessionStorage.getItem('auth_redirect');
            sessionStorage.removeItem('auth_redirect');
            navigate(redirectPath || '/chat', { replace: true });
          } else {
            // Authentication failed, redirect to login
            navigate('/auth/login?error=Authentication failed', { replace: true });
          }
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        navigate('/auth/login?error=Authentication failed', { replace: true });
      }
    };

    handleCallback();
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
