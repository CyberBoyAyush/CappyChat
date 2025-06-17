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
import AuthLoadingScreen from '@/frontend/components/auth/AuthLoadingScreen';

const AuthCallbackPage: React.FC = () => {
  const { getCurrentUser, refreshUser } = useAuth();
  const navigate = useNavigate();

  // Fast session check using account.listSessions()
  const hasActiveSession = async (): Promise<boolean> => {
    try {
      const { account } = await import('@/lib/appwrite');
      const sessions = await account.listSessions();
      return sessions.sessions.length > 0;
    } catch (error) {
      return false;
    }
  };

  useEffect(() => {
    const callbackStartTime = Date.now();
    console.log('🔄 OAuth callback page loaded at:', new Date().toISOString());

    // Set a maximum timeout to prevent hanging
    const timeoutId = setTimeout(() => {
      console.log('❌ Auth callback timeout after 10 seconds, redirecting to home');
      navigate('/', { replace: true });
    }, 10000); // 10 second timeout

    const handleCallback = async () => {
      try {
        console.log('🚀 Starting OAuth callback processing...');

        // Check if this is actually an OAuth callback by looking for URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const hasOAuthParams = urlParams.has('code') || urlParams.has('state') || urlParams.has('error');

        console.log('📋 URL params check:', {
          hasCode: urlParams.has('code'),
          hasState: urlParams.has('state'),
          hasError: urlParams.has('error'),
          fullURL: window.location.href
        });

        // If no OAuth parameters, this might be a direct visit - redirect to home
        if (!hasOAuthParams) {
          console.log('❌ No OAuth parameters found, redirecting to home');
          navigate('/', { replace: true });
          return;
        }

        console.log('✅ OAuth parameters detected, proceeding with authentication...');

        // ULTRA-AGGRESSIVE session detection with parallel strategies
        console.log('🔍 Starting ULTRA-FAST session detection...');
        const sessionDetectionStart = Date.now();

        // Strategy 1: Immediate check
        let user = await getCurrentUser();
        console.log('📊 Initial getCurrentUser() result:', user ? '✅ User found' : '❌ No user');

        // Strategy 2: If no user, use SUPER rapid polling with parallel checks
        if (!user) {
          console.log('🚀 Starting SUPER RAPID session detection with parallel checks...');

          // Create multiple parallel detection promises
          const detectionPromises = [];

          // Promise 1: Rapid polling with very short delays
          const rapidPolling = async () => {
            const delays = [5, 10, 15, 20, 25, 30, 40, 50, 60, 75, 90, 100, 125, 150, 200]; // Super fast
            for (let i = 0; i < delays.length; i++) {
              await new Promise(resolve => setTimeout(resolve, delays[i]));
              console.log(`🔍 Rapid attempt ${i + 1} after ${delays[i]}ms...`);

              const sessionExists = await hasActiveSession();
              if (sessionExists) {
                const foundUser = await getCurrentUser();
                if (foundUser) {
                  console.log(`🎉 RAPID detection success after ${i + 1} attempts!`);
                  return foundUser;
                }
              }
            }
            return null;
          };

          // Promise 2: Direct session checks every 100ms
          const directChecking = async () => {
            for (let i = 0; i < 20; i++) {
              await new Promise(resolve => setTimeout(resolve, 100));
              console.log(`🔍 Direct check ${i + 1}...`);
              const foundUser = await getCurrentUser();
              if (foundUser) {
                console.log(`🎉 DIRECT detection success after ${i + 1} checks!`);
                return foundUser;
              }
            }
            return null;
          };

          // Promise 3: Session list monitoring
          const sessionMonitoring = async () => {
            for (let i = 0; i < 15; i++) {
              await new Promise(resolve => setTimeout(resolve, 150));
              console.log(`🔍 Session monitor ${i + 1}...`);
              const sessionExists = await hasActiveSession();
              if (sessionExists) {
                const foundUser = await getCurrentUser();
                if (foundUser) {
                  console.log(`🎉 SESSION MONITOR success after ${i + 1} checks!`);
                  return foundUser;
                }
              }
            }
            return null;
          };

          // Run all strategies in parallel and take the first successful result
          detectionPromises.push(rapidPolling(), directChecking(), sessionMonitoring());

          try {
            user = await Promise.race(detectionPromises.filter(p => p !== null));
            if (user) {
              const totalDetectionTime = Date.now() - sessionDetectionStart;
              console.log(`🚀 PARALLEL detection SUCCESS in ${totalDetectionTime}ms!`);
            }
          } catch (error) {
            console.error('❌ Parallel detection error:', error);
          }

          if (!user) {
            const totalDetectionTime = Date.now() - sessionDetectionStart;
            console.log(`❌ ALL detection strategies failed after ${totalDetectionTime}ms`);
          }
        }

        if (user) {
          console.log('🎉 User authenticated successfully!', { userId: user.$id, email: user.email });

          // Performance tracking
          const startTime = sessionStorage.getItem('oauth_start_time');
          const callbackProcessingTime = Date.now() - callbackStartTime;
          if (startTime) {
            const totalTime = Date.now() - parseInt(startTime);
            console.log(`🚀 OAuth authentication completed in ${totalTime}ms (callback processing: ${callbackProcessingTime}ms)`);
            sessionStorage.removeItem('oauth_start_time');
          }

          console.log('🧹 Clearing pending auth state...');
          // Clear pending auth state immediately
          sessionStorage.removeItem('avchat_auth_pending');

          console.log('💾 Updating session cache...');
          // Update both localStorage and sessionStorage for instant future access
          const sessionData = {
            user,
            timestamp: Date.now()
          };
          sessionStorage.setItem('avchat_auth_session', JSON.stringify(sessionData));
          localStorage.setItem('avchat_auth_cache', JSON.stringify(sessionData));

          console.log('🔄 Refreshing user state in AuthContext...');
          // Force refresh the user state in AuthContext to ensure immediate UI update
          await refreshUser();

          console.log('📡 Dispatching auth state change event...');
          // Dispatch a custom event to notify other components of successful authentication
          window.dispatchEvent(new CustomEvent('authStateChanged', { detail: { authenticated: true, user } }));

          // Check if there's a stored redirect path
          const redirectPath = sessionStorage.getItem('auth_redirect');
          sessionStorage.removeItem('auth_redirect');

          console.log(`🚀 Redirecting to: ${redirectPath || '/chat'}`);
          // Immediate redirect without delay for faster UX
          navigate(redirectPath || '/chat', { replace: true });
        } else {
          // Clear pending auth state on failure
          sessionStorage.removeItem('avchat_auth_pending');

          // Authentication failed, redirect to home instead of login to avoid loops
          navigate('/?error=Authentication failed', { replace: true });
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
    <AuthLoadingScreen
      type="callback"
      message="Completing authentication..."
    />
  );
};

export default AuthCallbackPage;
