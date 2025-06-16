/**
 * Authentication Context
 * 
 * Provides authentication state management and operations throughout the app.
 * Handles user login, logout, registration, and session management.
 */

'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { account, APPWRITE_CONFIG, ID } from '@/lib/appwrite';
import { OAuthProvider } from 'appwrite';
import { Models, AppwriteException } from 'appwrite';
import { AppwriteDB } from '@/lib/appwriteDB';
import { HybridDB } from '@/lib/hybridDB';
import { AppwriteRealtime } from '@/lib/appwriteRealtime';
import { ensureUserTierInitialized } from '@/lib/tierSystem';

interface User extends Models.User<Models.Preferences> {}

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

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [guestUser, setGuestUser] = useState<GuestUser | null>(() => {
    // Initialize guest user if no authenticated user
    return {
      isGuest: true,
      messagesUsed: 0,
      maxMessages: 2
    };
  });

  // Check if user's email is verified
  const isEmailVerified = user?.emailVerification ?? false;
  const isGuest = !user && !!guestUser;

  // Cached user session to avoid repeated API calls
  const getCurrentUser = useCallback(async (): Promise<User | null> => {
    try {
      const currentUser = await account.get();
      return currentUser;
    } catch (error) {
      return null;
    }
  }, []);

  // Refresh session
  const refreshSession = useCallback(async (): Promise<void> => {
    try {
      await account.updateSession('current');
    } catch (error) {
      // Session refresh failed - user may need to re-authenticate
    }
  }, []);

  // Refresh user data
  const refreshUser = useCallback(async (): Promise<void> => {
    try {
      const currentUser = await account.get();
      setUser(currentUser);
      console.log('[AuthContext] User data refreshed:', {
        emailVerified: currentUser?.emailVerification,
        userId: currentUser?.$id
      });
    } catch (error) {
      console.error('Failed to refresh user data:', error);
    }
  }, []);

  // Initialize user services (DB and realtime) - optimized for performance
  const initializeUserServices = useCallback(async (userId: string) => {
    try {
      // Initialize tier system for new users only - don't reset existing users
      await ensureUserTierInitialized();

      // Only initialize HybridDB - realtime will be handled inside it
      // This is now non-blocking and much faster
      await HybridDB.initialize(userId, false); // false = not guest mode
    } catch (error) {
      console.error('Failed to initialize user services:', error);
    }
  }, []);

  useEffect(() => {
    if (initialized) return; // Prevent multiple initializations

    const initAuth = async () => {
      try {
        setLoading(true);
        const currentUser = await getCurrentUser();

        if (currentUser) {
          setUser(currentUser);
          setGuestUser(null); // Clear guest user when authenticated user is found
          setLoading(false); // Set loading to false immediately after user is set
          setInitialized(true);

          // Initialize services in background - don't await to avoid blocking UI
          initializeUserServices(currentUser.$id).catch(err =>
            console.error('Background service initialization failed:', err)
          );
        } else {
          setUser(null);
          // Keep guest user initialized for unauthenticated users
          setLoading(false);
          setInitialized(true);

          // Initialize HybridDB for guest users
          HybridDB.initialize('guest', true).catch(err =>
            console.error('Guest HybridDB initialization failed:', err)
          );
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        setUser(null);
        setLoading(false);
        setInitialized(true);
      }
    };

    initAuth();

    // Cleanup function to unsubscribe from Realtime on unmount
    return () => {
      if (user) {
        AppwriteRealtime.unsubscribeFromAll();
      }
    };
  }, [getCurrentUser, initializeUserServices, initialized]);

  // Login with email and password
  const login = async (email: string, password: string): Promise<void> => {
    try {
      setLoading(true);

      // Create session and get user data
      await account.createEmailPasswordSession(email, password);
      const currentUser = await account.get(); // Get fresh user data after session creation
      setUser(currentUser);
      setGuestUser(null); // Clear guest user when logging in
      setLoading(false); // Set loading to false immediately after user is set

      // Initialize services in background - don't block login completion
      initializeUserServices(currentUser.$id).catch(err =>
        console.error('Background service initialization failed:', err)
      );
    } catch (error) {
      console.error('Login error:', error);
      setLoading(false);
      throw new Error(getErrorMessage(error));
    }
  };

  // Register a new user
  const register = async (email: string, password: string, name: string): Promise<void> => {
    try {
      setLoading(true);

      // Create user account
      await account.create(ID.unique(), email, password, name);
      // Create session
      await account.createEmailPasswordSession(email, password);

      // Send verification email immediately (not in background)
      await account.createVerification(APPWRITE_CONFIG.verificationUrl);

      // Get fresh user data after session creation to ensure correct verification status
      const currentUser = await account.get();
      setUser(currentUser);
      setGuestUser(null); // Clear guest user when registering
      setLoading(false); // Set loading to false immediately after user is set

      // Initialize services in background - don't block registration completion
      initializeUserServices(currentUser.$id).catch(err =>
        console.error('Background service initialization failed:', err)
      );
    } catch (error) {
      console.error('Registration error:', error);
      setLoading(false);
      throw new Error(getErrorMessage(error));
    }
  };

  // Login with Google OAuth
  const loginWithGoogle = async (): Promise<void> => {
    try {
      account.createOAuth2Session(
        OAuthProvider.Google,
        APPWRITE_CONFIG.successUrl,
        APPWRITE_CONFIG.failureUrl
      );
    } catch (error) {
      console.error('Google login error:', error);
      throw new Error(getErrorMessage(error));
    }
  };

  // Login with GitHub OAuth
  const loginWithGitHub = async (): Promise<void> => {
    try {
      account.createOAuth2Session(
        OAuthProvider.Github,
        APPWRITE_CONFIG.successUrl,
        APPWRITE_CONFIG.failureUrl
      );
    } catch (error) {
      console.error('GitHub login error:', error);
      throw new Error(getErrorMessage(error));
    }
  };

  // Logout
  const logout = async (): Promise<void> => {
    try {
      setLoading(true);
      await account.deleteSessions();
      
      // Unsubscribe from all Appwrite Realtime channels
      AppwriteRealtime.unsubscribeFromAll();
      
      // Clear local database
      HybridDB.clearLocalData();

      setUser(null);
      // Reset guest user when logging out
      setGuestUser({
        isGuest: true,
        messagesUsed: 0,
        maxMessages: 2
      });

      // Clear any stored redirect
      sessionStorage.removeItem('auth_redirect');
    } catch (error) {
      console.error('Logout error:', error);
      throw new Error(getErrorMessage(error));
    } finally {
      setLoading(false);
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
      setUser(updatedUser);
    } catch (error) {
      console.error('Profile update error:', error);
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
      setUser(updatedUser);
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

      // Directly call account.get() to ensure we get fresh user data
      const currentUser = await account.get();
      if (currentUser) {
        setUser(currentUser);
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
