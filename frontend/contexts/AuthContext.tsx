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

interface User extends Models.User<Models.Preferences> {}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  isEmailVerified: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithGitHub: () => Promise<void>;
  logout: () => Promise<void>;
  getCurrentUser: () => Promise<User | null>;
  refreshSession: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  updateProfile: (name: string) => Promise<void>;
  updateEmail: (email: string, password: string) => Promise<void>;
  updatePassword: (newPassword: string, oldPassword: string) => Promise<void>;
  sendVerificationEmail: () => Promise<void>;
  verifyEmail: (userId: string, secret: string) => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
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

  // Check if user's email is verified
  const isEmailVerified = user?.emailVerification ?? false;

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

  // Initialize user services (DB and realtime) - optimized for performance
  const initializeUserServices = useCallback(async (userId: string) => {
    try {
      console.log('[AuthContext] Initializing user services for user:', userId);
      // Only initialize HybridDB - realtime will be handled inside it
      // This is now non-blocking and much faster
      await HybridDB.initialize(userId);
      console.log('[AuthContext] User services initialized successfully');
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
          // Initialize services in background - don't await to avoid blocking UI
          initializeUserServices(currentUser.$id).catch(err => 
            console.error('Background service initialization failed:', err)
          );
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        setUser(null);
      } finally {
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
      
      // Create session and get user in one call - session creation returns user info
      const session = await account.createEmailPasswordSession(email, password);
      const currentUser = await account.get(); // Only one get call needed after session
      setUser(currentUser);
      
      // Initialize services in background - don't block login completion
      initializeUserServices(currentUser.$id).catch(err => 
        console.error('Background service initialization failed:', err)
      );
    } catch (error) {
      console.error('Login error:', error);
      throw new Error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  // Register a new user
  const register = async (email: string, password: string, name: string): Promise<void> => {
    try {
      setLoading(true);
      
      // Create user account
      const newUser = await account.create(ID.unique(), email, password, name);
      // Create session
      await account.createEmailPasswordSession(email, password);
      
      // Send verification email in background
      account.createVerification(APPWRITE_CONFIG.verificationUrl).catch(err => 
        console.warn('Failed to send verification email:', err)
      );
      
      // Use the newUser object instead of making another API call
      setUser(newUser);
      
      // Initialize services in background - don't block registration completion
      initializeUserServices(newUser.$id).catch(err => 
        console.error('Background service initialization failed:', err)
      );
    } catch (error) {
      console.error('Registration error:', error);
      throw new Error(getErrorMessage(error));
    } finally {
      setLoading(false);
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

  // Verify email
  const verifyEmail = async (userId: string, secret: string): Promise<void> => {
    try {
      setLoading(true);
      await account.updateVerification(userId, secret);
      
      // Refresh user data to update email verification status
      const currentUser = await getCurrentUser();
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

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        isEmailVerified,
        login,
        register,
        loginWithGoogle,
        loginWithGitHub,
        logout,
        getCurrentUser,
        refreshSession,
        deleteAccount,
        updateProfile,
        updateEmail,
        updatePassword,
        sendVerificationEmail,
        verifyEmail,
        resendVerificationEmail,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
