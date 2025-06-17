/**
 * Global Error Handler
 * 
 * Purpose: Centralized error handling for authentication and session management.
 * Automatically handles session expiry, authentication errors, and cleanup.
 */

import { AppwriteException } from 'appwrite';
import { HybridDB } from './hybridDB';
import { AppwriteRealtime } from './appwriteRealtime';

// Auth cache keys (matching AuthContext)
const AUTH_CACHE_KEY = 'avchat_auth_cache';
const AUTH_SESSION_KEY = 'avchat_auth_session';
const AUTH_PENDING_KEY = 'avchat_auth_pending';

// Global error handler instance
class GlobalErrorHandler {
  private static instance: GlobalErrorHandler;
  private authCleanupCallback: (() => void) | null = null;

  private constructor() {}

  static getInstance(): GlobalErrorHandler {
    if (!GlobalErrorHandler.instance) {
      GlobalErrorHandler.instance = new GlobalErrorHandler();
    }
    return GlobalErrorHandler.instance;
  }

  // Set the auth cleanup callback (called from AuthContext)
  setAuthCleanupCallback(callback: () => void): void {
    this.authCleanupCallback = callback;
  }

  // Check if error is an authentication error
  private isAuthError(error: any): boolean {
    if (error instanceof AppwriteException) {
      return error.code === 401 || error.code === 403;
    }
    return false;
  }

  // Perform clean logout without API calls
  private async performCleanLogout(): Promise<void> {
    try {
      console.log('[GlobalErrorHandler] Performing clean logout due to auth error...');
      
      // Unsubscribe from all Appwrite Realtime channels
      AppwriteRealtime.unsubscribeFromAll();

      // Clear local database
      HybridDB.clearLocalData();

      // Clear ALL auth caches
      localStorage.removeItem(AUTH_CACHE_KEY);
      sessionStorage.removeItem(AUTH_SESSION_KEY);
      sessionStorage.removeItem(AUTH_PENDING_KEY);
      sessionStorage.removeItem('auth_redirect');
      sessionStorage.removeItem('oauth_start_time');

      // Call the auth context cleanup callback if available
      if (this.authCleanupCallback) {
        this.authCleanupCallback();
      }

      console.log('[GlobalErrorHandler] Clean logout completed');
    } catch (error) {
      console.error('[GlobalErrorHandler] Error during clean logout:', error);
    }
  }

  // Handle any error globally
  async handleError(error: any, context?: string): Promise<void> {
    console.error(`[GlobalErrorHandler] Error in ${context || 'unknown context'}:`, error);

    // If it's an authentication error, perform automatic logout
    if (this.isAuthError(error)) {
      console.log('[GlobalErrorHandler] Authentication error detected, performing automatic logout');
      await this.performCleanLogout();
      
      // Optionally redirect to home page
      if (typeof window !== 'undefined' && window.location.pathname !== '/') {
        window.location.href = '/?error=session_expired';
      }
    }
  }

  // Handle Appwrite API errors specifically
  async handleAppwriteError(error: AppwriteException, context?: string): Promise<void> {
    console.error(`[GlobalErrorHandler] Appwrite error in ${context || 'unknown context'}:`, {
      code: error.code,
      message: error.message,
      type: error.type
    });

    // Handle different types of Appwrite errors
    switch (error.code) {
      case 401: // Unauthorized
      case 403: // Forbidden
        console.log('[GlobalErrorHandler] Session expired or unauthorized, performing logout');
        await this.performCleanLogout();
        break;
      
      case 429: // Rate limit
        console.warn('[GlobalErrorHandler] Rate limit exceeded');
        // Could implement retry logic here
        break;
      
      case 500: // Server error
      case 502: // Bad gateway
      case 503: // Service unavailable
        console.warn('[GlobalErrorHandler] Server error, may be temporary');
        // Could implement retry logic or show user-friendly message
        break;
      
      default:
        console.warn('[GlobalErrorHandler] Unhandled Appwrite error:', error);
    }
  }

  // Wrapper for API calls that automatically handles errors
  async wrapApiCall<T>(
    apiCall: () => Promise<T>,
    context?: string
  ): Promise<T | null> {
    try {
      return await apiCall();
    } catch (error) {
      if (error instanceof AppwriteException) {
        await this.handleAppwriteError(error, context);
      } else {
        await this.handleError(error, context);
      }
      return null;
    }
  }

  // Check if current session is valid
  async validateSession(): Promise<boolean> {
    try {
      const { account } = await import('./appwrite');
      await account.get();
      return true;
    } catch (error) {
      if (this.isAuthError(error)) {
        await this.performCleanLogout();
      }
      return false;
    }
  }

  // Get user-friendly error message
  getErrorMessage(error: any): string {
    if (error instanceof AppwriteException) {
      switch (error.code) {
        case 401:
          return 'Your session has expired. Please sign in again.';
        case 403:
          return 'Access denied. Please check your permissions.';
        case 429:
          return 'Too many requests. Please try again later.';
        case 500:
        case 502:
        case 503:
          return 'Server is temporarily unavailable. Please try again later.';
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
  }
}

// Export singleton instance
export const globalErrorHandler = GlobalErrorHandler.getInstance();

// Convenience functions
export const handleError = (error: any, context?: string) => 
  globalErrorHandler.handleError(error, context);

export const handleAppwriteError = (error: AppwriteException, context?: string) => 
  globalErrorHandler.handleAppwriteError(error, context);

export const wrapApiCall = <T>(apiCall: () => Promise<T>, context?: string) => 
  globalErrorHandler.wrapApiCall(apiCall, context);

export const validateSession = () => 
  globalErrorHandler.validateSession();

export const getErrorMessage = (error: any) => 
  globalErrorHandler.getErrorMessage(error);

export default globalErrorHandler;
