/**
 * Webhook Safety - Minimal but Robust Protection
 * 
 * Provides essential safety features for webhook processing:
 * - Idempotency protection against duplicate webhooks
 * - Basic validation to prevent crashes
 * - Simple concurrency protection
 */

// Simple in-memory cache for processed webhooks
const processedWebhooks = new Map<string, number>();
const processingLocks = new Map<string, Promise<any>>();

// Clean up old entries every hour
setInterval(() => {
  const oneHourAgo = Date.now() - (60 * 60 * 1000);
  for (const [key, timestamp] of processedWebhooks.entries()) {
    if (timestamp < oneHourAgo) {
      processedWebhooks.delete(key);
    }
  }
}, 60 * 60 * 1000);

/**
 * Generate unique webhook ID for idempotency
 */
export const generateWebhookId = (payload: any): string => {
  const type = payload.type || 'unknown';
  const id = payload.data?.id || payload.data?.subscription_id || payload.data?.payment_id || 'no-id';
  const timestamp = payload.data?.timestamp || payload.data?.created_at || Date.now();
  
  return `${type}_${id}_${timestamp}`;
};

/**
 * Check if webhook was already processed
 */
export const isWebhookProcessed = (webhookId: string): boolean => {
  return processedWebhooks.has(webhookId);
};

/**
 * Mark webhook as processed
 */
export const markWebhookProcessed = (webhookId: string): void => {
  processedWebhooks.set(webhookId, Date.now());
};

/**
 * Basic webhook payload validation
 */
export const validateWebhookPayload = (payload: any): { isValid: boolean; error?: string } => {
  if (!payload) {
    return { isValid: false, error: 'Empty payload' };
  }

  if (!payload.type || typeof payload.type !== 'string') {
    return { isValid: false, error: 'Missing or invalid webhook type' };
  }

  if (!payload.data || typeof payload.data !== 'object') {
    return { isValid: false, error: 'Missing or invalid webhook data' };
  }

  return { isValid: true };
};

/**
 * Extract user ID with validation
 */
export const extractUserIdSafely = (payload: any): { userId: string | null; error?: string } => {
  if (!payload?.data) {
    return { userId: null, error: 'No data in payload' };
  }

  const userId = payload.data?.metadata?.userId ||
                 payload.data?.metadata?.appwriteUserId ||
                 payload.data?.customer?.metadata?.userId ||
                 payload.data?.customer?.metadata?.appwriteUserId ||
                 payload.data?.subscription?.metadata?.userId ||
                 payload.data?.subscription?.metadata?.appwriteUserId ||
                 null;

  if (!userId) {
    return { userId: null, error: 'No user ID found in webhook metadata' };
  }

  if (typeof userId !== 'string' || userId.trim().length === 0) {
    return { userId: null, error: 'Invalid user ID format' };
  }

  return { userId: userId.trim() };
};

/**
 * Process webhook with safety protections
 */
export const processWebhookSafely = async <T>(
  webhookId: string,
  userId: string,
  processor: () => Promise<T>
): Promise<{ success: boolean; result?: T; error?: string }> => {
  // Check if already processed
  if (isWebhookProcessed(webhookId)) {
    console.log('⚠️ Duplicate webhook ignored:', webhookId);
    return { success: true, error: 'Duplicate webhook ignored' };
  }

  // Check if already processing (concurrency protection)
  const lockKey = userId; // Lock by user only to prevent all concurrent webhooks for same user
  if (processingLocks.has(lockKey)) {
    console.log('⚠️ Concurrent webhook processing detected, waiting...', lockKey);
    try {
      await processingLocks.get(lockKey);
    } catch {
      // Ignore errors from concurrent processing
    }

    // Check again if processed while waiting
    if (isWebhookProcessed(webhookId)) {
      return { success: true, error: 'Processed by concurrent request' };
    }
  }

  // Create processing lock
  const processingPromise = (async () => {
    try {
      console.log('🔄 Processing webhook:', webhookId);
      const result = await processor();
      
      // Mark as processed only on success
      markWebhookProcessed(webhookId);
      console.log('✅ Webhook processed successfully:', webhookId);
      
      return { success: true, result };
    } catch (error) {
      console.error('❌ Webhook processing failed:', webhookId, error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    } finally {
      // Remove processing lock
      processingLocks.delete(lockKey);
    }
  })();

  processingLocks.set(lockKey, processingPromise);
  return await processingPromise;
};

/**
 * Safe wrapper for webhook handlers
 */
export const createSafeWebhookHandler = <T extends any[]>(
  handlerName: string,
  handler: (payload: any, ...args: T) => Promise<void>
) => {
  return async (payload: any, ...args: T): Promise<void> => {
    try {
      // Basic validation
      const validation = validateWebhookPayload(payload);
      if (!validation.isValid) {
        console.error(`❌ Invalid ${handlerName} webhook:`, validation.error);
        return;
      }

      // Extract user ID safely
      const { userId, error } = extractUserIdSafely(payload);
      if (!userId) {
        console.error(`❌ ${handlerName} webhook missing user ID:`, error);
        return;
      }

      // Generate webhook ID
      const webhookId = generateWebhookId(payload);
      
      // Process safely with protections
      await processWebhookSafely(webhookId, userId, async () => {
        await handler(payload, ...args);
      });

    } catch (error) {
      console.error(`💥 Unexpected error in ${handlerName} webhook:`, error);
    }
  };
};
