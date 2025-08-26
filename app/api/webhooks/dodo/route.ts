/**
 * DODO Payments Webhook Handler
 * 
 * Handles webhook events from DODO Payments using the Next.js adapter.
 * Processes subscription lifecycle events and updates user preferences accordingly.
 */

import { Webhooks } from '@dodopayments/nextjs';
import { DODO_CONFIG } from '@/lib/dodo-client';
import { UserSubscription } from '@/lib/appwrite';
import { updateUserPreferencesServer } from '@/lib/tierSystem';

// Server-side function to update user subscription
const updateUserSubscriptionServer = async (
  userId: string,
  subscriptionData: Partial<UserSubscription>
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

    // Flatten subscription data into separate fields for better visibility
    const updatedPrefs = {
      ...currentPrefs,
      // Subscription fields as separate preferences
      subscriptionTier: subscriptionData.tier || currentPrefs.subscriptionTier,
      subscriptionStatus: subscriptionData.status || currentPrefs.subscriptionStatus,
      subscriptionCustomerId: subscriptionData.customerId || currentPrefs.subscriptionCustomerId,
      subscriptionId: subscriptionData.subscriptionId || currentPrefs.subscriptionId,
      subscriptionPeriodEnd: subscriptionData.currentPeriodEnd || currentPrefs.subscriptionPeriodEnd,
      subscriptionCancelAtEnd: subscriptionData.cancelAtPeriodEnd || currentPrefs.subscriptionCancelAtEnd,
      subscriptionCurrency: subscriptionData.currency || currentPrefs.subscriptionCurrency,
      subscriptionAmount: subscriptionData.amount || currentPrefs.subscriptionAmount,
      subscriptionLastPayment: subscriptionData.lastPaymentId || currentPrefs.subscriptionLastPayment,
      subscriptionRetryCount: subscriptionData.retryCount !== undefined ? subscriptionData.retryCount : currentPrefs.subscriptionRetryCount,
      subscriptionUpdatedAt: new Date().toISOString(),
    };

    await users.updatePrefs(userId, updatedPrefs);

    console.log('Server-side subscription update successful:', {
      userId,
      subscriptionData: {
        tier: updatedPrefs.subscriptionTier,
        status: updatedPrefs.subscriptionStatus,
        customerId: updatedPrefs.subscriptionCustomerId,
        subscriptionId: updatedPrefs.subscriptionId,
      }
    });
  } catch (error) {
    console.error('Error updating user subscription server-side:', error);
    throw error;
  }
};

// Extract user ID from webhook payload
const extractUserId = (payload: any): string | null => {
  console.log('Extracting user ID from payload:', {
    metadata: payload.data?.metadata,
    customer: payload.data?.customer,
    subscription: payload.data?.subscription,
  });

  const userId = payload.data?.metadata?.userId ||
                 payload.data?.metadata?.appwriteUserId ||
                 payload.data?.customer?.metadata?.userId ||
                 payload.data?.customer?.metadata?.appwriteUserId ||
                 payload.data?.subscription?.metadata?.userId ||
                 payload.data?.subscription?.metadata?.appwriteUserId ||
                 null;

  console.log('Extracted user ID:', userId);
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
  onSubscriptionActive: async (payload) => {
    console.log('🎉 Subscription activated webhook received!');
    console.log('Full payload:', JSON.stringify(payload, null, 2));

    const userId = extractUserId(payload);
    if (!userId) {
      console.error('❌ No user ID found in subscription active webhook');
      console.error('Available data paths:', {
        'payload.data': Object.keys(payload.data || {}),
        'payload.data.metadata': payload.data?.metadata,
        'payload.data.customer': payload.data?.customer,
      });
      return;
    }

    console.log('✅ Found user ID:', userId);

    try {
      const subscriptionData = payload.data as any;

      const subscriptionUpdate = {
        tier: 'PREMIUM' as const,
        status: 'active' as const,
        customerId: subscriptionData.customer?.customer_id || subscriptionData.customer_id,
        subscriptionId: subscriptionData.subscription_id || subscriptionData.id,
        currentPeriodEnd: subscriptionData.current_period_end,
        cancelAtPeriodEnd: false,
        currency: subscriptionData.billing_currency as 'INR' | 'USD',
        amount: subscriptionData.recurring_pre_tax_amount || subscriptionData.amount,
      };

      console.log('📝 Updating subscription with:', subscriptionUpdate);
      await updateUserSubscriptionServer(userId, subscriptionUpdate);

      // Also update tier system to premium with correct credit limits
      console.log('🔄 Updating tier system to premium with credit limits...');
      await updateUserPreferencesServer(userId, {
        tier: 'premium',
        freeCredits: 1200,      // Premium tier free model credits
        premiumCredits: 600,    // Premium tier premium model credits
        superPremiumCredits: 50, // Premium tier super premium model credits
        lastResetDate: new Date().toISOString(),
      });

      console.log('🎊 User successfully upgraded to premium:', userId);
    } catch (error) {
      console.error('💥 Error handling subscription active:', error);
    }
  },

  // Subscription renewed (successful recurring payment)
  onSubscriptionRenewed: async (payload) => {
    console.log('Subscription renewed:', payload);
    
    const userId = extractUserId(payload);
    if (!userId) {
      console.error('No user ID found in subscription renewed webhook');
      return;
    }

    try {
      const subscriptionData = payload.data as any;
      await updateUserSubscriptionServer(userId, {
        tier: 'PREMIUM',
        status: 'active',
        currentPeriodEnd: subscriptionData.current_period_end,
        lastPaymentId: subscriptionData.payment_id,
        retryCount: 0, // Reset retry count on successful payment
      });

      console.log('Subscription renewed for user:', userId);
    } catch (error) {
      console.error('Error handling subscription renewal:', error);
    }
  },

  // Subscription cancelled (stays premium until period end)
  onSubscriptionCancelled: async (payload) => {
    console.log('❌ Subscription cancelled webhook received!');
    console.log('Cancellation payload:', JSON.stringify(payload, null, 2));

    const userId = extractUserId(payload);
    if (!userId) {
      console.error('❌ No user ID found in subscription cancelled webhook');
      return;
    }

    try {
      console.log('📝 Processing subscription cancellation for user:', userId);

      await updateUserSubscriptionServer(userId, {
        status: 'cancelled',
        cancelAtPeriodEnd: true,
      });

      console.log('✅ Subscription cancelled for user:', userId);
    } catch (error) {
      console.error('💥 Error handling subscription cancellation:', error);
    }
  },

  // Subscription expired (downgrade to free)
  onSubscriptionExpired: async (payload) => {
    console.log('Subscription expired:', payload);
    
    const userId = extractUserId(payload);
    if (!userId) {
      console.error('No user ID found in subscription expired webhook');
      return;
    }

    try {
      await updateUserSubscriptionServer(userId, {
        tier: 'FREE',
        status: 'expired',
      });

      // Downgrade tier system to free
      await updateUserPreferencesServer(userId, {
        tier: 'free',
      });

      console.log('User downgraded to free:', userId);
    } catch (error) {
      console.error('Error handling subscription expiration:', error);
    }
  },

  // Subscription failed (payment failure)
  onSubscriptionFailed: async (payload) => {
    console.log('Subscription failed:', payload);
    
    const userId = extractUserId(payload);
    if (!userId) {
      console.error('No user ID found in subscription failed webhook');
      return;
    }

    try {
      const subscriptionData = payload.data as any;
      const currentRetryCount = subscriptionData.retry_count || 0;

      await updateUserSubscriptionServer(userId, {
        status: 'failed',
        retryCount: currentRetryCount + 1,
      });

      // If too many retries, expire the subscription
      if (currentRetryCount >= 3) {
        await updateUserSubscriptionServer(userId, {
          tier: 'FREE',
          status: 'expired',
        });

        await updateUserPreferencesServer(userId, {
          tier: 'free',
        });

        console.log('Subscription expired due to failed payments:', userId);
      } else {
        console.log('Subscription payment failed, retry count:', currentRetryCount + 1);
      }
    } catch (error) {
      console.error('Error handling subscription failure:', error);
    }
  },

  // Payment succeeded
  onPaymentSucceeded: async (payload) => {
    console.log('💰 Payment succeeded webhook received!');
    console.log('Payment payload:', JSON.stringify(payload, null, 2));

    const userId = extractUserId(payload);
    if (userId) {
      try {
        const paymentData = payload.data as any;
        console.log('✅ Processing payment success for user:', userId);

        await updateUserSubscriptionServer(userId, {
          lastPaymentId: paymentData.payment_id || paymentData.id,
          retryCount: 0, // Reset retry count on successful payment
        });

        console.log('🎊 Payment success processed for user:', userId);
      } catch (error) {
        console.error('💥 Error handling payment success:', error);
      }
    } else {
      console.error('❌ No user ID found in payment success webhook');
    }
  },

  // Payment failed
  onPaymentFailed: async (payload) => {
    console.log('Payment failed:', payload);
    
    const userId = extractUserId(payload);
    if (userId) {
      try {
        const paymentData = payload.data as any;
        const currentRetryCount = paymentData.retry_count || 0;

        await updateUserSubscriptionServer(userId, {
          retryCount: currentRetryCount + 1,
        });
      } catch (error) {
        console.error('Error handling payment failure:', error);
      }
    }
  },
});
