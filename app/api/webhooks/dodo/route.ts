/**
 * DODO Payments Webhook Handler
 * 
 * Handles webhook events from DODO Payments using the Next.js adapter.
 * Processes subscription lifecycle events and updates user preferences accordingly.
 */

import { Webhooks } from '@dodopayments/nextjs';
import { DODO_CONFIG } from '@/lib/dodo-client';
import { UserSubscription, TIER_LIMITS } from '@/lib/appwrite';
import { createSafeWebhookHandler, extractUserIdSafely } from '@/lib/webhookSafety';

// Server-side function to update user subscription and tier atomically
const updateUserSubscriptionAndTierServer = async (
  userId: string,
  subscriptionData: Partial<UserSubscription>,
  tierData?: Partial<{ tier: 'free' | 'premium' | 'admin'; freeCredits: number; premiumCredits: number; superPremiumCredits: number; lastResetDate: string }>
): Promise<void> => {
  try {
    // Get current user preferences
    const { Client, Users } = await import('node-appwrite');

    const client = new Client()
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
      .setKey(process.env.APPWRITE_API_KEY!);

    const users = new Users(client);
    const user = await users.get(userId);

    const currentPrefs = user.prefs as Record<string, unknown>;

    // Combine subscription and tier updates atomically
    const updatedPrefs = {
      ...currentPrefs,
      // Subscription fields as separate preferences
      subscriptionTier: subscriptionData.tier ?? currentPrefs.subscriptionTier ?? 'FREE',
      subscriptionStatus: subscriptionData.status ?? currentPrefs.subscriptionStatus ?? 'expired',
      subscriptionCustomerId: subscriptionData.customerId ?? currentPrefs.subscriptionCustomerId,
      subscriptionId: subscriptionData.subscriptionId ?? currentPrefs.subscriptionId,
      subscriptionPeriodEnd: subscriptionData.currentPeriodEnd ?? currentPrefs.subscriptionPeriodEnd,
      subscriptionCancelAtEnd: subscriptionData.cancelAtPeriodEnd ?? currentPrefs.subscriptionCancelAtEnd,
      subscriptionNextBillingDate: subscriptionData.next_billing_date ?? subscriptionData.currentPeriodEnd ?? currentPrefs.subscriptionNextBillingDate,
      subscriptionCurrency: subscriptionData.currency ?? currentPrefs.subscriptionCurrency,
      subscriptionAmount: subscriptionData.amount ?? currentPrefs.subscriptionAmount,
      subscriptionLastPayment: subscriptionData.lastPaymentId ?? currentPrefs.subscriptionLastPayment,
      subscriptionRetryCount: subscriptionData.retryCount ?? currentPrefs.subscriptionRetryCount,
      subscriptionUpdatedAt: new Date().toISOString(),
      // Tier system fields (if provided)
      ...(tierData && {
        tier: tierData.tier,
        freeCredits: tierData.freeCredits,
        premiumCredits: tierData.premiumCredits,
        superPremiumCredits: tierData.superPremiumCredits,
        lastResetDate: tierData.lastResetDate,
      }),
    };

    // Single atomic update
    console.log('🔧 About to update preferences with:', {
      subscriptionTier: updatedPrefs.subscriptionTier,
      subscriptionStatus: updatedPrefs.subscriptionStatus,
      tier: updatedPrefs.tier
    });
    await users.updatePrefs(userId, updatedPrefs);

    console.log('Server-side subscription and tier update successful:', {
      userId,
      subscription: {
        tier: updatedPrefs.subscriptionTier,
        status: updatedPrefs.subscriptionStatus,
        customerId: updatedPrefs.subscriptionCustomerId,
        subscriptionId: updatedPrefs.subscriptionId,
      },
      tierSystem: tierData ? {
        tier: updatedPrefs.tier,
        credits: `${updatedPrefs.freeCredits}/${updatedPrefs.premiumCredits}/${updatedPrefs.superPremiumCredits}`,
      } : 'unchanged'
    });
  } catch (error) {
    console.error('Error updating user subscription and tier server-side:', error);
    throw error;
  }
};

// Legacy function for backward compatibility
const updateUserSubscriptionServer = async (
  userId: string,
  subscriptionData: Partial<UserSubscription>
): Promise<void> => {
  return updateUserSubscriptionAndTierServer(userId, subscriptionData);
};

// Extract user ID from webhook payload (legacy - use extractUserIdSafely for new code)
const extractUserId = (payload: any): string | null => {
  const { userId } = extractUserIdSafely(payload);
  return userId;
};



export const POST = Webhooks({
  webhookKey: DODO_CONFIG.webhookSecret,
  
  // Handle all webhook events for logging
  onPayload: async (payload) => {
    console.log('DODO Webhook received:', {
      type: payload.type,
      timestamp: new Date().toISOString(),
      data: JSON.stringify(payload.data, null, 2)
    });
  },

  // Subscription became active (new subscription or reactivation)
  onSubscriptionActive: createSafeWebhookHandler('SubscriptionActive', async (payload) => {
    console.log('🎉 Subscription activated webhook received!');

    const userId = extractUserId(payload);
    const subscriptionData = payload.data as any;

    const subscriptionUpdate = {
      tier: 'PREMIUM' as const,
      status: 'active' as const,
      customerId: subscriptionData.customer?.customer_id || subscriptionData.customer_id,
      subscriptionId: subscriptionData.subscription_id || subscriptionData.id,
      currentPeriodEnd: subscriptionData.current_period_end,
      next_billing_date: subscriptionData.next_billing_date || subscriptionData.current_period_end, // Set next billing date
      cancelAtPeriodEnd: false,
      currency: subscriptionData.billing_currency as 'INR' | 'USD',
      amount: subscriptionData.recurring_pre_tax_amount || subscriptionData.amount,
    };

    const tierUpdate = {
      tier: 'premium' as const,
      freeCredits: 1200,      // Premium tier free model credits
      premiumCredits: 600,    // Premium tier premium model credits
      superPremiumCredits: 50, // Premium tier super premium model credits
      lastResetDate: new Date().toISOString(),
    };

    console.log('📝 Atomically updating subscription and tier system...');
    console.log('📋 Subscription update data:', subscriptionUpdate);
    console.log('📋 Tier update data:', tierUpdate);
    await updateUserSubscriptionAndTierServer(userId!, subscriptionUpdate, tierUpdate);

    console.log('🎊 User successfully upgraded to premium:', userId);
  }),

  // Subscription renewed (successful recurring payment)
  onSubscriptionRenewed: createSafeWebhookHandler('SubscriptionRenewed', async (payload) => {
    console.log('🔄 Subscription renewed webhook received');

    const userId = extractUserId(payload);
    const subscriptionData = payload.data as any;

    const subscriptionUpdate = {
      tier: 'PREMIUM' as const,
      status: 'active' as const,
      customerId: subscriptionData.customer?.customer_id || subscriptionData.customer_id,
      currentPeriodEnd: subscriptionData.current_period_end,
      next_billing_date: subscriptionData.next_billing_date || subscriptionData.current_period_end, // Set next billing date
      lastPaymentId: subscriptionData.payment_id,
      retryCount: 0, // Reset retry count on successful payment
      cancelAtPeriodEnd: false, // Reset cancellation flag on renewal
    };

    const tierUpdate = {
      tier: 'premium' as const,
      freeCredits: 1200,      // Reset credits for new billing period
      premiumCredits: 600,
      superPremiumCredits: 50,
      lastResetDate: new Date().toISOString(),
    };

    console.log('📝 Atomically updating subscription renewal and resetting credits...');
    await updateUserSubscriptionAndTierServer(userId!, subscriptionUpdate, tierUpdate);

    console.log('✅ Subscription renewed and credits reset for user:', userId);
  }),

  // Subscription cancelled (stays premium until period end)
  onSubscriptionCancelled: createSafeWebhookHandler('SubscriptionCancelled', async (payload) => {
    console.log('❌ Subscription cancelled webhook received');

    const userId = extractUserId(payload);
    console.log('📝 Processing subscription cancellation for user:', userId);

    await updateUserSubscriptionServer(userId!, {
      status: 'cancelled',
      cancelAtPeriodEnd: true,
    });

    console.log('✅ Subscription cancelled for user:', userId);
  }),

  // Subscription expired (downgrade to free)
  onSubscriptionExpired: createSafeWebhookHandler('SubscriptionExpired', async (payload) => {
    console.log('⏰ Subscription expired webhook received');

    const userId = extractUserId(payload);

    const subscriptionUpdate = {
      tier: 'FREE' as const,
      status: 'expired' as const,
    };

    const tierUpdate = {
      tier: 'free' as const,
      freeCredits: TIER_LIMITS.free.freeCredits,        // Consistent with TIER_LIMITS (80)
      premiumCredits: TIER_LIMITS.free.premiumCredits,  // Consistent with TIER_LIMITS (10)
      superPremiumCredits: TIER_LIMITS.free.superPremiumCredits, // Consistent with TIER_LIMITS (2)
      lastResetDate: new Date().toISOString(),
    };

    console.log('📝 Atomically downgrading subscription and resetting to free tier credits...');
    await updateUserSubscriptionAndTierServer(userId!, subscriptionUpdate, tierUpdate);

    console.log('⬇️ User downgraded to free with proper credit limits:', userId);
  }),

  // Subscription failed (payment failure)
  onSubscriptionFailed: createSafeWebhookHandler('SubscriptionFailed', async (payload) => {
    console.log('💳 Subscription failed webhook received');

    const userId = extractUserId(payload);
    const subscriptionData = payload.data as any;
    const currentRetryCount = subscriptionData.retry_count || 0;
    const newRetryCount = currentRetryCount + 1;

    // If too many retries, expire the subscription
    if (newRetryCount >= 3) {
      const subscriptionUpdate = {
        tier: 'FREE' as const,
        status: 'expired' as const,
        retryCount: newRetryCount,
      };

      const tierUpdate = {
        tier: 'free' as const,
        freeCredits: TIER_LIMITS.free.freeCredits,        // Consistent with TIER_LIMITS (80)
        premiumCredits: TIER_LIMITS.free.premiumCredits,  // Consistent with TIER_LIMITS (10)
        superPremiumCredits: TIER_LIMITS.free.superPremiumCredits, // Consistent with TIER_LIMITS (2)
        lastResetDate: new Date().toISOString(),
      };

      console.log('📝 Expiring subscription due to failed payments (3+ retries)...');
      await updateUserSubscriptionAndTierServer(userId!, subscriptionUpdate, tierUpdate);

      console.log('⬇️ Subscription expired due to failed payments:', userId);
    } else {
      // Just update retry count, keep premium status
      await updateUserSubscriptionServer(userId!, {
        status: 'failed',
        retryCount: newRetryCount,
      });

      console.log('🔄 Subscription payment failed, retry count:', newRetryCount);
    }
  }),

  // Payment succeeded
  onPaymentSucceeded: createSafeWebhookHandler('PaymentSucceeded', async (payload) => {
    console.log('💰 Payment succeeded webhook received');

    const userId = extractUserId(payload);
    const paymentData = payload.data as any;

    console.log('✅ Processing payment success for user:', userId);

    // Update payment info, customer ID, and reset retry count
    const updateData: any = {
      lastPaymentId: paymentData.payment_id || paymentData.id,
      retryCount: 0, // Reset retry count on successful payment
    };

    // Capture customer ID if available
    if (paymentData.customer?.customer_id || paymentData.customer_id) {
      updateData.customerId = paymentData.customer?.customer_id || paymentData.customer_id;
      console.log('📝 Captured customer ID from payment:', updateData.customerId);
    }

    // Log subscription payments for monitoring (no automatic activation)
    if (paymentData.subscription_id) {
      console.log('🔍 MONITOR: Payment for subscription detected', {
        userId,
        subscriptionId: paymentData.subscription_id,
        paymentId: paymentData.payment_id || paymentData.id,
        timestamp: new Date().toISOString(),
        note: 'Expecting subscription.active webhook to follow'
      });
    }

    await updateUserSubscriptionServer(userId!, updateData);

    console.log('🎊 Payment success processed for user:', userId);
  }),

  // Payment failed
  onPaymentFailed: createSafeWebhookHandler('PaymentFailed', async (payload) => {
    console.log('💳 Payment failed webhook received');

    const userId = extractUserId(payload);
    const paymentData = payload.data as any;
    const currentRetryCount = paymentData.retry_count || 0;
    const newRetryCount = currentRetryCount + 1;

    await updateUserSubscriptionServer(userId!, {
      retryCount: newRetryCount,
    });

    console.log('🔄 Payment failed, retry count updated:', newRetryCount);
  }),

  // Subscription on hold (paused by DODO)
  onSubscriptionOnHold: createSafeWebhookHandler('SubscriptionOnHold', async (payload) => {
    console.log('⏸️ Subscription on hold webhook received');

    const userId = extractUserId(payload);
    console.log('📝 Processing subscription on hold for user:', userId);

    await updateUserSubscriptionServer(userId!, {
      status: 'on_hold',
    });

    console.log('⏸️ Subscription put on hold for user:', userId);
  }),
});
