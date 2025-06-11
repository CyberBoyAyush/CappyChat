/**
 * Authentication Context
 * 
 * Provides authentication state management and operations throughout the app.
 * Handles user login, logout, registration, and session management.
 */

'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { account, OAuthProviders, APPWRITE_CONFIG, ID } from '@/lib/appwrite';
import { Models, AppwriteException } from 'appwrite';

interface User extends Models.User<Models.Preferences> {}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  isEmailVerified: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
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

  // Check if user's email is verified
  const isEmailVerified = user?.emailVerification ?? false;

  // Get current user session
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
      console.log('Failed to refresh session:', error);
    }
  }, []);

  // Initialize authentication state
  useEffect(() => {
    const initAuth = async () => {
      try {
        setLoading(true);
        const currentUser = await getCurrentUser();
        
        if (currentUser) {
          setUser(currentUser);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, [getCurrentUser]);

  // Email/password login
  const login = async (email: string, password: string): Promise<void> => {
    try {
      setLoading(true);
      await account.createEmailPasswordSession(email, password);
      const loggedInUser = await getCurrentUser();
      setUser(loggedInUser);
      
      // If user is not verified, send verification email
      if (loggedInUser && !loggedInUser.emailVerification) {
        try {
          await sendVerificationEmail();
        } catch (verificationError) {
          console.warn('Failed to send verification email after login:', verificationError);
          // Don't throw here as login was successful
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      throw new Error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  // Email/password registration
  const register = async (email: string, password: string, name: string): Promise<void> => {
    try {
      setLoading(true);
      // Create account first
      await account.create(ID.unique(), email, password, name);
      // Then create session
      await account.createEmailPasswordSession(email, password);
      const newUser = await getCurrentUser();
      setUser(newUser);
      
      // Send verification email automatically after registration
      try {
        await sendVerificationEmail();
      } catch (verificationError) {
        console.warn('Failed to send verification email:', verificationError);
        // Don't throw here as registration was successful
      }
    } catch (error) {
      console.error('Registration error:', error);
      throw new Error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  // Google OAuth login
  const loginWithGoogle = async (): Promise<void> => {
    try {
      setLoading(true);
      
      // Store intended destination
      const currentPath = window.location.pathname;
      if (currentPath !== '/' && currentPath !== '/auth/login' && currentPath !== '/auth/signup') {
        sessionStorage.setItem('auth_redirect', currentPath);
      }

      // Initiate OAuth flow
      await account.createOAuth2Session(
        OAuthProviders.Google,
        APPWRITE_CONFIG.successUrl,
        APPWRITE_CONFIG.failureUrl
      );
    } catch (error) {
      console.error('Google login error:', error);
      setLoading(false);
      throw new Error(getErrorMessage(error));
    }
  };

  // Logout
  const logout = async (): Promise<void> => {
    try {
      setLoading(true);
      await account.deleteSessions();
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
      await account.updateStatus();
      setUser(null);
    } catch (error) {
      console.error('Delete account error:', error);
      throw new Error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  // Update profile name
  const updateProfile = async (name: string): Promise<void> => {
    try {
      const updatedUser = await account.updateName(name);
      setUser(updatedUser);
    } catch (error) {
      console.error('Update profile error:', error);
      throw new Error(getErrorMessage(error));
    }
  };

  // Update email
  const updateEmail = async (email: string, password: string): Promise<void> => {
    try {
      const updatedUser = await account.updateEmail(email, password);
      setUser(updatedUser);
    } catch (error) {
      console.error('Update email error:', error);
      throw new Error(getErrorMessage(error));
    }
  };

  // Update password
  const updatePassword = async (newPassword: string, oldPassword: string): Promise<void> => {
    try {
      await account.updatePassword(newPassword, oldPassword);
    } catch (error) {
      console.error('Update password error:', error);
      throw new Error(getErrorMessage(error));
    }
  };

  // Send verification email
  const sendVerificationEmail = async (): Promise<void> => {
    try {
      await account.createVerification(APPWRITE_CONFIG.verificationUrl);
    } catch (error) {
      console.error('Send verification email error:', error);
      throw new Error(getErrorMessage(error));
    }
  };

  // Verify email with userId and secret
  const verifyEmail = async (userId: string, secret: string): Promise<void> => {
    try {
      await account.updateVerification(userId, secret);
      // Refresh user data to get updated verification status
      const updatedUser = await getCurrentUser();
      setUser(updatedUser);
    } catch (error) {
      console.error('Verify email error:', error);
      throw new Error(getErrorMessage(error));
    }
  };

  // Resend verification email
  const resendVerificationEmail = async (): Promise<void> => {
    try {
      await account.createVerification(APPWRITE_CONFIG.verificationUrl);
    } catch (error) {
      console.error('Resend verification email error:', error);
      throw new Error(getErrorMessage(error));
    }
  };

  const isAuthenticated = !!user;

  const value: AuthContextType = {
    user,
    loading,
    isAuthenticated,
    isEmailVerified,
    login,
    register,
    loginWithGoogle,
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
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
