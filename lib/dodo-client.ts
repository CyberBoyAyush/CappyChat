/**
 * DODO Payments Client Configuration
 *
 * Provides centralized configuration and utility functions for DODO Payments integration.
 * Handles environment-specific settings and product ID management.
 *
 * NOTE: This file should only be used on the server side (API routes).
 * Client-side components should make API calls to server routes instead.
 */

import { DodoPayments } from 'dodopayments';

// Server-side environment check
const isServer = typeof window === 'undefined';

// Environment configuration (server-side only)
export const DODO_CONFIG = {
  apiKey: isServer ? process.env.DODO_PAYMENTS_API_KEY! : '',
  webhookSecret: isServer ? process.env.DODO_PAYMENTS_WEBHOOK_SECRET! : '',
  environment: (isServer ? process.env.DODO_PAYMENTS_ENVIRONMENT : 'test') as 'test' | 'live',
  testProductId: isServer ? process.env.DODO_PAYMENTS_TEST_PRODUCT_ID! : '',
  liveProductId: isServer ? process.env.DODO_PAYMENTS_LIVE_PRODUCT_ID! : '',
} as const;

// Map our environment values to SDK values
const getSDKEnvironment = (): 'test_mode' | 'live_mode' => {
  return DODO_CONFIG.environment === 'live' ? 'live_mode' : 'test_mode';
};

// Initialize DODO Payments client (server-side only)
export const dodoClient = isServer && DODO_CONFIG.apiKey
  ? new DodoPayments({
      bearerToken: DODO_CONFIG.apiKey,
      environment: getSDKEnvironment(),
    })
  : null;

/**
 * Get the appropriate product ID based on current environment
 */
export const getProductId = (): string => {
  return DODO_CONFIG.environment === 'test' 
    ? DODO_CONFIG.testProductId 
    : DODO_CONFIG.liveProductId;
};

/**
 * Get environment-specific configuration
 */
export const getEnvironmentConfig = () => {
  return {
    environment: DODO_CONFIG.environment,
    productId: getProductId(),
    isTestMode: DODO_CONFIG.environment === 'test',
  };
};

/**
 * Validate DODO configuration
 */
export const validateDodoConfig = (): boolean => {
  const requiredFields = [
    DODO_CONFIG.apiKey,
    DODO_CONFIG.webhookSecret,
    DODO_CONFIG.environment,
    DODO_CONFIG.testProductId,
    DODO_CONFIG.liveProductId,
  ];

  return requiredFields.every(field => field && field.length > 0);
};

/**
 * Get webhook configuration
 */
export const getWebhookConfig = () => {
  return {
    webhookSecret: DODO_CONFIG.webhookSecret,
    webhookUrl: process.env.NODE_ENV === 'production' 
      ? 'https://cappychat.com/api/webhooks/dodopayments'
      : 'https://test.cappychat.com/api/webhooks/dodopayments',
  };
};

// Export types for TypeScript support
export type DodoEnvironment = typeof DODO_CONFIG.environment;
export type DodoConfig = typeof DODO_CONFIG;
