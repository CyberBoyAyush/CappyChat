/**
 * DODO Payments Client Configuration
 * 
 * Provides centralized configuration and utility functions for DODO Payments integration.
 * Handles environment-specific settings and product ID management.
 */

import { DodoPayments } from 'dodopayments';

// Environment configuration
export const DODO_CONFIG = {
  apiKey: process.env.DODO_PAYMENTS_API_KEY!,
  webhookSecret: process.env.DODO_PAYMENTS_WEBHOOK_SECRET!,
  environment: process.env.DODO_PAYMENTS_ENVIRONMENT as 'test' | 'live',
  testProductId: process.env.DODO_PAYMENTS_TEST_PRODUCT_ID!,
  liveProductId: process.env.DODO_PAYMENTS_LIVE_PRODUCT_ID!,
} as const;

// Initialize DODO Payments client
export const dodoClient = new DodoPayments({
  bearerToken: DODO_CONFIG.apiKey,
});

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
      ? 'https://avchat.xyz/api/webhooks/dodo'
      : 'https://test.avchat.xyz/api/webhooks/dodo',
  };
};

// Export types for TypeScript support
export type DodoEnvironment = typeof DODO_CONFIG.environment;
export type DodoConfig = typeof DODO_CONFIG;
