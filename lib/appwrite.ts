/**
 * Appwrite Configuration
 * 
 * Centralized configuration for Appwrite client and services.
 * Handles initialization of client, account, and database services.
 */

import { Client, Account, OAuthProvider, ID } from 'appwrite';

// Validate required environment variables
if (!process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT) {
  throw new Error('NEXT_PUBLIC_APPWRITE_ENDPOINT is required');
}

if (!process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID) {
  throw new Error('NEXT_PUBLIC_APPWRITE_PROJECT_ID is required');
}

// Initialize Appwrite client
export const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID);

// Initialize Appwrite services
export const account = new Account(client);

// OAuth provider configuration
export const OAuthProviders = {
  Google: OAuthProvider.Google,
} as const;

// Helper for generating unique IDs
export { ID };

// Configuration constants
export const APPWRITE_CONFIG = {
  endpoint: process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT,
  projectId: process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID,
  successUrl: process.env.NEXT_PUBLIC_AUTH_SUCCESS_URL || 
    (typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : ''),
  failureUrl: process.env.NEXT_PUBLIC_AUTH_FAILURE_URL || 
    (typeof window !== 'undefined' ? `${window.location.origin}/auth/error` : ''),
  verificationUrl: process.env.NEXT_PUBLIC_VERIFICATION_URL ||
    (typeof window !== 'undefined' ? `${window.location.origin}/auth/verify` : ''),
} as const;

export default client;
