/**
 * Authentication Context
 * 
 * Provides authentication state management and operations throughout the app.
 * Handles user login, logout, registration, and session management.
 */

'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { flushSync } from 'react-dom';
import { account, APPWRITE_CONFIG, ID } from '@/lib/appwrite';
import { getCachedAccount, invalidateAccountCache } from '@/lib/accountCache';
import { OAuthProvider } from 'appwrite';
import { Models, AppwriteException } from 'appwrite';
import { AppwriteDB } from '@/lib/appwriteDB';
import { HybridDB } from '@/lib/hybridDB';
import { AppwriteRealtime } from '@/lib/appwriteRealtime';
import { ensureUserTierInitialized } from '@/lib/tierSystem';
import { globalErrorHandler } from '@/lib/globalErrorHandler';
import { useSearchTypeStore } from '@/frontend/stores/SearchTypeStore';
import { SessionManager, type SessionInfo, type DetailedSession } from '@/lib/sessionManager';

type User = Models.User<Models.Preferences>;

interface GuestUser {
  isGuest: true;
  messagesUsed: number;
  maxMessages: number;
}

interface AuthContextType {
  user: User | null;
  guestUser: GuestUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  isGuest: boolean;
  isEmailVerified: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithGitHub: () => Promise<void>;
  logout: () => Promise<void>;
  getCurrentUser: () => Promise<User | null>;
  checkActiveSessions: () => Promise<{ hasSession: boolean; sessionCount: number }>;
  getDetailedSessionInfo: () => Promise<SessionInfo>;
  deleteSession: (sessionId: string) => Promise<void>;
  deleteAllOtherSessions: () => Promise<void>;
  refreshSession: () => Promise<void>;
  refreshUser: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  updateProfile: (name: string) => Promise<void>;
  updateEmail: (email: string, password: string) => Promise<void>;
  updatePassword: (newPassword: string, oldPassword: string) => Promise<void>;
  sendVerificationEmail: () => Promise<void>;
  sendPasswordRecovery: (email: string) => Promise<void>;
  resetPassword: (userId: string, secret: string, newPassword: string) => Promise<void>;
  verifyEmail: (userId: string, secret: string) => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
  incrementGuestMessages: () => boolean; // Returns true if under limit, false if limit reached
  canGuestSendMessage: () => boolean;
  resetGuestUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

// Custom error handling for better user experience
const getErrorMessage = (error: any): string => {
  if (error instanceof AppwriteException) {
    switch (error.code) {
      case 401:
        return 'Invalid email or password. Please try again.';
      case 409:
        return 'An account with this email already exists.';
      case 429:
        return 'Too many requests. Please try again later.';
      case 400:
        if (error.message.includes('password')) {
          return 'Password must be at least 8 characters long.';
        }
        if (error.message.includes('email')) {
          return 'Please enter a valid email address.';
        }
        return error.message;
      default:
        return error.message || 'An unexpected error occurred.';
    }
  }
  return error?.message || 'An unexpected error occurred.';
};

// Real-time auth keys (no caching, instant sync)
const AUTH_SESSION_KEY = 'avchat_auth_session';
const AUTH_PENDING_KEY = 'avchat_auth_pending';

// No caching - always fetch fresh auth state for real-time sync
const getCachedAuthState = (): { user: User | null; timestamp: number } | null => {
  // Return null to force fresh auth check every time
  return null;
};

// No-op cache setter for real-time sync
const setCachedAuthState = (user: User | null) => {
  // No caching - real-time sync only
};

// Always verify state for real-time sync
const shouldVerifyCachedState = (cachedState: { user: User | null; timestamp: number } | null): boolean => {
  // Always verify for instant real-time updates
  return true;
};

// Real-time session storage (minimal caching for performance)
const getSessionAuthState = (): { user: User | null; timestamp: number } | null => {
  try {
    const cached = sessionStorage.getItem(AUTH_SESSION_KEY);
    const parsed = cached ? JSON.parse(cached) : null;

    // Only use session cache if it's very recent (under 30 seconds)
    if (parsed && (Date.now() - parsed.timestamp) < 30000) {
      return parsed;
    }

    // Clear stale session cache
    if (parsed) {
      sessionStorage.removeItem(AUTH_SESSION_KEY);
    }

    return null;
  } catch {
    return null;
  }
};

const setSessionAuthState = (user: User | null): void => {
  try {
    if (user) {
      const cacheData = {
        user,
        timestamp: Date.now()
      };
      sessionStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(cacheData));
    } else {
      sessionStorage.removeItem(AUTH_SESSION_KEY);
    }
  } catch {
    // Ignore sessionStorage errors
  }
};

// Auth pending state management
const setAuthPending = (isAuthenticating: boolean, method: 'email' | 'oauth' = 'email'): void => {
  try {
    if (isAuthenticating) {
      const pendingData = {
        isAuthenticating: true,
        timestamp: Date.now(),
        method
      };
      sessionStorage.setItem(AUTH_PENDING_KEY, JSON.stringify(pendingData));
    } else {
      sessionStorage.removeItem(AUTH_PENDING_KEY);
    }
  } catch {
    // Ignore sessionStorage errors
  }
};

const getAuthPending = (): { isAuthenticating: boolean; timestamp: number; method: string } | null => {
  try {
    const pending = sessionStorage.getItem(AUTH_PENDING_KEY);
    if (!pending) return null;

    const parsed = JSON.parse(pending);

    // Clear if older than 30 seconds
    if (Date.now() - parsed.timestamp > 30000) {
      sessionStorage.removeItem(AUTH_PENDING_KEY);
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // Real-time initialization - minimal caching for instant sync
  const sessionState = getSessionAuthState();
  const pendingAuth = getAuthPending();

  // Use only recent session state for real-time sync
  const initialUser = sessionState?.user || null;
  const hasRecentSession = !!sessionState;

  const [user, setUser] = useState<User | null>(initialUser);
  const [loading, setLoading] = useState(!hasRecentSession || !!pendingAuth); // Show loading if no recent session OR auth is pending
  const [initialized, setInitialized] = useState(hasRecentSession && !pendingAuth); // Mark as initialized if we have recent session and no pending auth
  const [guestUser, setGuestUser] = useState<GuestUser | null>(() => {
    // Only initialize guest user if no authenticated user
    if (initialUser) return null;
    return {
      isGuest: true,
      messagesUsed: 0,
      maxMessages: 2
    };
  });

  // Reset search type when user becomes a guest
  useEffect(() => {
    if (guestUser?.isGuest) {
      // Use setTimeout to avoid calling store during render
      setTimeout(() => {
        useSearchTypeStore.getState().resetForGuest();
      }, 0);
    }
  }, [guestUser?.isGuest]);

  // Check if user's email is verified
  const isEmailVerified = user?.emailVerification ?? false;
  const isGuest = !user && !!guestUser;

  // Cached user session to avoid repeated API calls
  const getCurrentUser = useCallback(async (): Promise<User | null> => {
    try {
      const currentUser = await getCachedAccount();
      return currentUser;
    } catch (error) {
      return null;
    }
  }, []);

  // Check active sessions and handle session limits
  const checkActiveSessions = useCallback(async (): Promise<{ hasSession: boolean; sessionCount: number }> => {
    try {
      const sessions = await account.listSessions();

      return {
        hasSession: sessions.sessions.length > 0,
        sessionCount: sessions.sessions.length
      };
    } catch (error) {
      console.error('Failed to check active sessions:', error);
      return { hasSession: false, sessionCount: 0 };
    }
  }, []);

  // Fast session detection for OAuth (checks if any session exists first)
  const hasActiveSession = useCallback(async (): Promise<boolean> => {
    const { hasSession } = await checkActiveSessions();
    return hasSession;
  }, [checkActiveSessions]);

  // Enhanced session refresh with proper error handling
  const refreshSession = useCallback(async (): Promise<void> => {
    try {
      await account.updateSession('current');
    } catch (error) {
      console.warn('Session refresh failed:', error);

      // If session refresh fails, it likely means the session is invalid
      // Perform automatic logout to clear invalid state
      if (error instanceof AppwriteException && (error.code === 401 || error.code === 403)) {

        await performCleanLogout();
      }
    }
  }, []);

  // Perform clean logout without API calls (for error scenarios)
  const performCleanLogout = useCallback(async (): Promise<void> => {
    try {


      // Unsubscribe from all Appwrite Realtime channels
      AppwriteRealtime.unsubscribeFromAll();

      // Clear local database
      HybridDB.clearLocalData();

      // Clear session state immediately for real-time sync
      setSessionAuthState(null);

      // Clear all session storage auth-related items
      sessionStorage.removeItem(AUTH_SESSION_KEY);
      sessionStorage.removeItem(AUTH_PENDING_KEY);
      sessionStorage.removeItem('auth_redirect');
      sessionStorage.removeItem('oauth_start_time');

      // Use flushSync to ensure immediate synchronous state updates
      flushSync(() => {
        setUser(null);
        // Reset guest user when logging out
        setGuestUser({
          isGuest: true,
          messagesUsed: 0,
          maxMessages: 2
        });
        setLoading(false);
      });

      // Ensure in-memory account cache is cleared
      invalidateAccountCache();

    } catch (error) {
      console.error('Error during clean logout:', error);
    }
  }, []);

  // Set up global error handler callback
  useEffect(() => {
    globalErrorHandler.setAuthCleanupCallback(() => {
      flushSync(() => {
        setUser(null);
        setGuestUser({
          isGuest: true,
          messagesUsed: 0,
          maxMessages: 2
        });
        setLoading(false);
      });
    });
  }, []);

  // Extended session refresh for fewer login interruptions
  useEffect(() => {
    if (!user) return;

    // Refresh session every 6 hours to prevent Appwrite session expiry
    const refreshInterval = setInterval(() => {
      refreshSession();
    }, 6 * 60 * 60 * 1000); // 6 hours

    return () => clearInterval(refreshInterval);
  }, [user, refreshSession]);

  // Periodic check for missing local data (every 30 seconds)
  useEffect(() => {
    if (!user || !initialized) return;

    const checkDataInterval = setInterval(async () => {
      try {
        // Check if local data exists
        const localThreadsData = localStorage.getItem('atchat_threads');
        const localProjectsData = localStorage.getItem('atchat_projects');
        const storedUserId = localStorage.getItem('atchat_user_id');

        // If local data is missing or user ID doesn't match, refresh from backend
        const hasLocalData = localThreadsData && localProjectsData;
        const userIdMatches = storedUserId === user.$id;

        if (!hasLocalData || !userIdMatches) {
          console.log('[AuthContext] Local data missing or user mismatch detected, refreshing from Appwrite...', {
            hasLocalData: !!hasLocalData,
            userIdMatches,
            storedUserId,
            currentUserId: user.$id
          });

          // Force refresh data from Appwrite
          await HybridDB.checkAndRefreshIfDataMissing(user.$id);
        }
      } catch (error) {
        console.error('[AuthContext] Error checking local data:', error);
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(checkDataInterval);
  }, [user, initialized]);

  // Refresh user data
  const refreshUser = useCallback(async (): Promise<void> => {
    try {
      const currentUser = await getCachedAccount(true);
      // Update both caches with fresh user data for consistency
      setCachedAuthState(currentUser);
      setSessionAuthState(currentUser);

      // Use flushSync for immediate UI update
      flushSync(() => {
        setUser(currentUser);
        if (currentUser) {
          setGuestUser(null); // Clear guest user when authenticated user is found
        }
      });

      console.log('[AuthContext] User data refreshed:', {
        emailVerified: currentUser?.emailVerification,
        userId: currentUser?.$id
      });
    } catch (error) {
      console.error('Failed to refresh user data:', error);

      // If it's an auth error, perform clean logout
      if (error instanceof AppwriteException && (error.code === 401 || error.code === 403)) {
        await performCleanLogout();
      } else {
        // Clear both caches if refresh fails
        setCachedAuthState(null);
        setSessionAuthState(null);

        // Use flushSync for immediate UI update
        flushSync(() => {
          setUser(null);
        });
      }
    }
  }, []);

  // Initialize user services (DB and realtime) - optimized for performance
  const initializeUserServices = useCallback(async (userId: string, forceRefresh: boolean = false) => {
    try {
      // Initialize tier system for new users only - don't reset existing users
      await ensureUserTierInitialized();

      if (forceRefresh) {
        // Force clear all local data and refresh from Appwrite (for signin)
        await HybridDB.forceRefreshOnSignin(userId);
        console.log('[AuthContext] HybridDB force refreshed successfully for user:', userId);
      } else {
        // Normal initialization (for app startup)
        await HybridDB.initialize(userId, false);
        console.log('[AuthContext] HybridDB initialized successfully for user:', userId);
      }
    } catch (error) {
      console.error('Failed to initialize user services:', error);
      // Even if initialization fails, don't block the UI
    }
  }, []);

  // Non-blocking user services initialization for faster UI
  const initializeUserServicesNonBlocking = useCallback((userId: string, forceRefresh: boolean = false) => {
    // Run initialization in background without blocking UI
    initializeUserServices(userId, forceRefresh).catch(error => {
      console.error('Background user services initialization failed:', error);
    });
  }, [initializeUserServices]);

  useEffect(() => {
    // Always verify for real-time sync - no caching delays
    const initAuth = async () => {
      try {
        // Always show loading for fresh auth check
        setLoading(true);

        const currentUser = await getCurrentUser();

        if (currentUser) {
          // Update both caches with fresh user data for consistency
          setCachedAuthState(currentUser);
          setSessionAuthState(currentUser);

          // Use flushSync to ensure immediate synchronous updates
          flushSync(() => {
            setUser(currentUser);
            setGuestUser(null); // Clear guest user when authenticated user is found
            setInitialized(true);
          });

          // Initialize services in background for faster UI (non-blocking)
          initializeUserServicesNonBlocking(currentUser.$id);
          setLoading(false); // Set loading to false immediately for faster UI
        } else {
          // Clear cache if no user found
          setCachedAuthState(null);

          // Use flushSync to ensure immediate synchronous updates
          flushSync(() => {
            setUser(null);
            // Keep guest user initialized for unauthenticated users
            if (!guestUser) {
              setGuestUser({
                isGuest: true,
                messagesUsed: 0,
                maxMessages: 2
              });
            }
            setLoading(false);
            setInitialized(true);
          });

          // Initialize HybridDB for guest users
          HybridDB.initialize('guest', true).catch(err =>
            console.error('Guest HybridDB initialization failed:', err)
          );
        }
      } catch (error) {
        console.error('Auth initialization error:', error);

        // If it's an auth error, perform clean logout
        if (error instanceof AppwriteException && (error.code === 401 || error.code === 403)) {
          await performCleanLogout();
        } else {
          // Clear cache on other errors
          setCachedAuthState(null);
          setSessionAuthState(null);
          setUser(null);
          setLoading(false);
          setInitialized(true);
        }
      }
    };

    initAuth();

    // Cleanup function to unsubscribe from Realtime on unmount
    return () => {
      if (user) {
        AppwriteRealtime.unsubscribeFromAll();
      }
    };
  }, [getCurrentUser, initializeUserServices, initialized, guestUser]);

  // Add window focus listener to refresh auth state when user returns from OAuth
  useEffect(() => {
    const handleWindowFocus = async () => {
      // Only refresh if we don't have a user but might have just completed OAuth
      if (!user && !loading) {
        try {
          const currentUser = await getCurrentUser();
          if (currentUser) {
            console.log('[AuthContext] User authenticated after window focus, refreshing state');
            setCachedAuthState(currentUser);
            setSessionAuthState(currentUser);

            flushSync(() => {
              setUser(currentUser);
              setGuestUser(null);
            });

            // Force refresh all data from Appwrite on new authentication
            try {
              await initializeUserServices(currentUser.$id, true); // true = force refresh
            } catch (err) {
              console.error('Service initialization failed after window focus:', err);
            }
          }
        } catch (error) {
          console.error('Failed to refresh auth state on window focus:', error);
        }
      } else if (user && initialized) {
        // For authenticated users, check if local data is missing when they return to the tab
        try {
          const localThreadsData = localStorage.getItem('atchat_threads');
          const localProjectsData = localStorage.getItem('atchat_projects');
          const storedUserId = localStorage.getItem('atchat_user_id');

          const hasLocalData = localThreadsData && localProjectsData;
          const userIdMatches = storedUserId === user.$id;

          if (!hasLocalData || !userIdMatches) {
            console.log('[AuthContext] Local data missing on window focus, refreshing from Appwrite...');
            await HybridDB.checkAndRefreshIfDataMissing(user.$id);
          }
        } catch (error) {
          console.error('[AuthContext] Error checking local data on window focus:', error);
        }
      }
    };

    // OAuth session pre-warming: Check for session immediately when pending OAuth
    const checkOAuthSession = async () => {
      const pendingAuth = getAuthPending();
      if (pendingAuth && pendingAuth.method === 'oauth' && !user) {
        console.log('[AuthContext] 🔍 OAuth pre-warming check - pending auth detected');
        try {
          const currentUser = await getCurrentUser();
          if (currentUser) {
            console.log('[AuthContext] 🎉 OAuth session detected via pre-warming!', { userId: currentUser.$id });
            setCachedAuthState(currentUser);
            setSessionAuthState(currentUser);
            setAuthPending(false);

            flushSync(() => {
              setUser(currentUser);
              setGuestUser(null);
            });

            console.log('[AuthContext] 🚀 OAuth pre-warming completed - user state updated');

            // Force refresh all data from Appwrite on OAuth signin
            try {
              await initializeUserServices(currentUser.$id, true); // true = force refresh
              setLoading(false); // Set loading to false only after services are ready
            } catch (err) {
              console.error('Service initialization failed during OAuth pre-warming:', err);
              setLoading(false); // Still set loading to false even if services fail
            }
          } else {
            console.log('[AuthContext] 🔄 OAuth pre-warming - no session yet');
          }
        } catch (error) {
          console.error('[AuthContext] ❌ OAuth session pre-warming failed:', error);
        }
      }
    };

    // Check for OAuth session every 200ms when pending (faster than 500ms)
    const oauthInterval = setInterval(checkOAuthSession, 200);

    // Listen for custom auth state change events (from OAuth callback)
    const handleAuthStateChanged = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { authenticated, user: eventUser } = customEvent.detail;
      if (authenticated && eventUser && !user) {
        console.log('[AuthContext] Received auth state change event, updating state');
        setSessionAuthState(eventUser);

        flushSync(() => {
          setUser(eventUser);
          setGuestUser(null);
        });

        // Force refresh all data from Appwrite on auth state change
        initializeUserServices(eventUser.$id, true).catch(err => // true = force refresh
          console.error('Service initialization failed from auth state change event:', err)
        );
      }
    };

    // Listen for admin data deletion events
    const handleAdminDataDeleted = async (event: Event) => {
      const customEvent = event as CustomEvent;
      const { userId: deletedUserId } = customEvent.detail;
      if (user && user.$id === deletedUserId) {
        console.log('[AuthContext] User data deleted by admin, refreshing...');
        try {
          // Force refresh all data from remote
          const { HybridDB } = await import('@/lib/hybridDB');
          await HybridDB.forceRefreshAllData();
        } catch (error) {
          console.error('Failed to refresh data after admin deletion:', error);
        }
      }
    };

    // Listen for admin all data deletion events
    const handleAdminAllDataDeleted = async () => {
      if (user) {
        console.log('[AuthContext] All data deleted by admin, refreshing...');
        try {
          // Force refresh all data from remote
          const { HybridDB } = await import('@/lib/hybridDB');
          await HybridDB.forceRefreshAllData();
        } catch (error) {
          console.error('Failed to refresh data after admin all data deletion:', error);
        }
      }
    };

    // Handle page visibility changes (more reliable than focus for detecting when user returns)
    const handleVisibilityChange = async () => {
      if (!document.hidden && user && initialized) {
        // Page became visible and user is authenticated
        try {
          const localThreadsData = localStorage.getItem('atchat_threads');
          const localProjectsData = localStorage.getItem('atchat_projects');
          const storedUserId = localStorage.getItem('atchat_user_id');

          const hasLocalData = localThreadsData && localProjectsData;
          const userIdMatches = storedUserId === user.$id;

          if (!hasLocalData || !userIdMatches) {
            console.log('[AuthContext] Local data missing on visibility change, refreshing from Appwrite...');
            await HybridDB.checkAndRefreshIfDataMissing(user.$id);
          }
        } catch (error) {
          console.error('[AuthContext] Error checking local data on visibility change:', error);
        }
      }
    };

    window.addEventListener('focus', handleWindowFocus);
    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('authStateChanged', handleAuthStateChanged);
    window.addEventListener('adminDataDeleted', handleAdminDataDeleted);
    window.addEventListener('adminAllDataDeleted', handleAdminAllDataDeleted);

    return () => {
      clearInterval(oauthInterval);
      window.removeEventListener('focus', handleWindowFocus);
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('authStateChanged', handleAuthStateChanged);
      window.removeEventListener('adminDataDeleted', handleAdminDataDeleted);
      window.removeEventListener('adminAllDataDeleted', handleAdminAllDataDeleted);
    };
  }, [user, loading, getCurrentUser, initializeUserServices]);

  // Login with email and password
  const login = async (email: string, password: string): Promise<void> => {
    try {
      // Set pending auth state immediately
      setAuthPending(true, 'email');
      setLoading(true);

      // STEP 1: Enforce session limit BEFORE creating new session
      try {
        await SessionManager.enforceSessionLimit();
      } catch (error) {
        console.warn('Failed to enforce session limit before login:', error);
        // Continue with login even if pre-enforcement fails
      }

      // STEP 2: Create session and get user data
      await account.createEmailPasswordSession(email, password);
      let currentUser: User | null = await getCachedAccount(true); // Get fresh user data after session creation
      if (!currentUser) {
        // Fallback to direct fetch to preserve behavior
        currentUser = await account.get();
      }

      // STEP 3: Cleanup any excess sessions (backup enforcement)
      try {
        await SessionManager.cleanupExcessSessions();
      } catch (error) {
        console.warn('Failed to cleanup excess sessions after login:', error);
        // Continue with login even if cleanup fails
      }

      // Update user state
      setUser(currentUser);
      setSessionAuthState(currentUser);

      // Clear pending auth state
      setAuthPending(false);

      // Use flushSync for immediate UI update
      flushSync(() => {
        setUser(currentUser);
        setGuestUser(null); // Clear guest user when logging in
        setInitialized(true);
      });

      // Force refresh all data from Appwrite on signin for data consistency
      await initializeUserServices(currentUser.$id, true); // true = force refresh

      // Set loading to false only after services are initialized
      setLoading(false);
    } catch (error) {
      console.error('Login error:', error);
      setAuthPending(false);
      setLoading(false);
      throw new Error(getErrorMessage(error));
    }
  };

  // Register a new user
  const register = async (email: string, password: string, name: string): Promise<void> => {
    try {
      // Set pending auth state immediately
      setAuthPending(true, 'email');
      setLoading(true);

      // STEP 1: Enforce session limit BEFORE creating new session
      try {
        await SessionManager.enforceSessionLimit();
      } catch (error) {
        console.warn('Failed to enforce session limit before registration:', error);
        // Continue with registration even if pre-enforcement fails
      }

      // STEP 2: Create user account and session
      await account.create(ID.unique(), email, password, name);
      await account.createEmailPasswordSession(email, password);

      // STEP 3: Cleanup any excess sessions (backup enforcement)
      try {
        await SessionManager.cleanupExcessSessions();
      } catch (error) {
        console.warn('Failed to cleanup excess sessions after registration:', error);
        // Continue with registration even if cleanup fails
      }

      // Send verification email immediately (not in background)
      await account.createVerification(APPWRITE_CONFIG.verificationUrl);

      // Get fresh user data after session creation to ensure correct verification status
      let currentUser: User | null = await getCachedAccount(true);
      if (!currentUser) {
        currentUser = await account.get();
      }

      // Update session state for real-time sync (no long-term caching)
      setSessionAuthState(currentUser);

      // Clear pending auth state
      setAuthPending(false);

      // Use flushSync for immediate UI update
      flushSync(() => {
        setUser(currentUser);
        setGuestUser(null); // Clear guest user when registering
        setInitialized(true);
      });

      // Force refresh all data from Appwrite on signin for data consistency
      await initializeUserServices(currentUser.$id, true); // true = force refresh

      // Set loading to false only after services are initialized
      setLoading(false);
    } catch (error) {
      console.error('Registration error:', error);
      setAuthPending(false);
      setLoading(false);
      throw new Error(getErrorMessage(error));
    }
  };

  // Login with Google OAuth
  const loginWithGoogle = async (): Promise<void> => {
    try {
      // Set pending OAuth state immediately
      setAuthPending(true, 'oauth');

      // Store current path for redirect after OAuth
      const currentPath = window.location.pathname + window.location.search;
      if (currentPath !== '/auth/callback' && currentPath !== '/') {
        sessionStorage.setItem('auth_redirect', currentPath);
      }

      // Store OAuth start time for performance tracking
      sessionStorage.setItem('oauth_start_time', Date.now().toString());

      account.createOAuth2Session(
        OAuthProvider.Google,
        APPWRITE_CONFIG.successUrl,
        APPWRITE_CONFIG.failureUrl
      );
    } catch (error) {
      console.error('Google login error:', error);
      setAuthPending(false);
      throw new Error(getErrorMessage(error));
    }
  };

  // Login with GitHub OAuth
  const loginWithGitHub = async (): Promise<void> => {
    try {
      // Set pending OAuth state immediately
      setAuthPending(true, 'oauth');

      // Store current path for redirect after OAuth
      const currentPath = window.location.pathname + window.location.search;
      if (currentPath !== '/auth/callback' && currentPath !== '/') {
        sessionStorage.setItem('auth_redirect', currentPath);
      }

      // Store OAuth start time for performance tracking
      sessionStorage.setItem('oauth_start_time', Date.now().toString());

      account.createOAuth2Session(
        OAuthProvider.Github,
        APPWRITE_CONFIG.successUrl,
        APPWRITE_CONFIG.failureUrl
      );
    } catch (error) {
      console.error('GitHub login error:', error);
      setAuthPending(false);
      throw new Error(getErrorMessage(error));
    }
  };

  // Logout
  const logout = async (): Promise<void> => {
    try {
      setLoading(true);

      // Try to delete sessions from server
      try {
        await account.deleteSessions();

      } catch (sessionError) {
        console.warn('Failed to delete server sessions:', sessionError);
        // Continue with local cleanup even if server logout fails
      }

      // Always perform clean local logout
      await performCleanLogout();

    } catch (error) {
      console.error('Logout error:', error);

      // Even if logout fails, ensure local cleanup
      await performCleanLogout();

      throw new Error(getErrorMessage(error));
    }
  };

  // Delete account
  const deleteAccount = async (): Promise<void> => {
    try {
      setLoading(true);
      
      // Delete user's data first
      await AppwriteDB.deleteAllThreads();
      
      // Note: Account deletion from client-side may not be available in this Appwrite version
      // This would typically need to be handled server-side or through admin API
      // For now, we'll just logout the user and clear their data
      await account.deleteSessions();
      
      // Unsubscribe from all Appwrite Realtime channels
      AppwriteRealtime.unsubscribeFromAll();
      
      setUser(null);
      
      // Clear any stored redirect
      sessionStorage.removeItem('auth_redirect');
    } catch (error) {
      console.error('Account deletion error:', error);
      throw new Error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  // Update user profile
  const updateProfile = async (name: string): Promise<void> => {
    try {
      setLoading(true);
      const updatedUser = await account.updateName(name);
      // Update cache with updated user data
      setCachedAuthState(updatedUser);

      // Use flushSync for immediate UI update
      flushSync(() => {
        setUser(updatedUser);
      });
    } catch (error) {
      console.error('Profile update error:', error);

      // If it's an auth error, perform clean logout
      if (error instanceof AppwriteException && (error.code === 401 || error.code === 403)) {
        await performCleanLogout();
      }

      throw new Error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  // Update email
  const updateEmail = async (email: string, password: string): Promise<void> => {
    try {
      setLoading(true);
      const updatedUser = await account.updateEmail(email, password);
      // Update cache with updated user data
      setCachedAuthState(updatedUser);

      // Use flushSync for immediate UI update
      flushSync(() => {
        setUser(updatedUser);
      });
    } catch (error) {
      console.error('Email update error:', error);
      throw new Error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  // Update password
  const updatePassword = async (newPassword: string, oldPassword: string): Promise<void> => {
    try {
      setLoading(true);
      await account.updatePassword(newPassword, oldPassword);
    } catch (error) {
      console.error('Password update error:', error);
      throw new Error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  // Send verification email
  const sendVerificationEmail = async (): Promise<void> => {
    try {
      setLoading(true);
      await account.createVerification(APPWRITE_CONFIG.verificationUrl);
    } catch (error) {
      console.error('Verification email error:', error);
      throw new Error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  // Resend verification email
  const resendVerificationEmail = async (): Promise<void> => {
    try {
      setLoading(true);
      await account.createVerification(APPWRITE_CONFIG.verificationUrl);
    } catch (error) {
      console.error('Resend verification email error:', error);
      throw new Error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  // Send password recovery email
  const sendPasswordRecovery = async (email: string): Promise<void> => {
    try {
      setLoading(true);
      await account.createRecovery(email, APPWRITE_CONFIG.passwordResetUrl);
    } catch (error) {
      console.error('Password recovery error:', error);
      throw new Error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  // Reset password with recovery token
  const resetPassword = async (userId: string, secret: string, newPassword: string): Promise<void> => {
    try {
      setLoading(true);
      await account.updateRecovery(userId, secret, newPassword);
    } catch (error) {
      console.error('Password reset error:', error);
      throw new Error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  // Verify email
  const verifyEmail = async (userId: string, secret: string): Promise<void> => {
    try {
      setLoading(true);
      await account.updateVerification(userId, secret);

      // Add a small delay to ensure Appwrite has processed the verification
      await new Promise(resolve => setTimeout(resolve, 500));

      // Fetch fresh user data via cache deduplication
      const currentUser = await getCachedAccount(true);
      if (currentUser) {
        // Update cache with verified user data
        setCachedAuthState(currentUser);

        // Use flushSync for immediate UI update
        flushSync(() => {
          setUser(currentUser);
        });
      }
    } catch (error) {
      console.error('Email verification error:', error);
      throw new Error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  // Guest user methods
  const incrementGuestMessages = (): boolean => {
    if (!guestUser || guestUser.messagesUsed >= guestUser.maxMessages) {
      return false;
    }

    setGuestUser(prev => prev ? {
      ...prev,
      messagesUsed: prev.messagesUsed + 1
    } : null);

    return true;
  };

  const canGuestSendMessage = (): boolean => {
    return guestUser ? guestUser.messagesUsed < guestUser.maxMessages : false;
  };

  const resetGuestUser = (): void => {
    setGuestUser({
      isGuest: true,
      messagesUsed: 0,
      maxMessages: 2
    });
  };

  // Enhanced session management functions
  const getDetailedSessionInfo = async (): Promise<SessionInfo> => {
    return await SessionManager.getDetailedSessionInfo();
  };

  const deleteSession = async (sessionId: string): Promise<void> => {
    await SessionManager.deleteSession(sessionId);
  };

  const deleteAllOtherSessions = async (): Promise<void> => {
    await SessionManager.deleteAllOtherSessions();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        guestUser,
        loading,
        isAuthenticated: !!user,
        isGuest,
        isEmailVerified,
        login,
        register,
        loginWithGoogle,
        loginWithGitHub,
        logout,
        getCurrentUser,
        checkActiveSessions,
        getDetailedSessionInfo,
        deleteSession,
        deleteAllOtherSessions,
        refreshSession,
        refreshUser,
        deleteAccount,
        updateProfile,
        updateEmail,
        updatePassword,
        sendVerificationEmail,
        verifyEmail,
        resendVerificationEmail,
        sendPasswordRecovery,
        resetPassword,
        incrementGuestMessages,
        canGuestSendMessage,
        resetGuestUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
