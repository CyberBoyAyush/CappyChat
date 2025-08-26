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
    const currentSubscription = (currentPrefs.subscription as UserSubscription) || {};

    const updatedSubscription = {
      ...currentSubscription,
      ...subscriptionData,
      updatedAt: new Date().toISOString(),
    };

    const updatedPrefs = {
      ...currentPrefs,
      subscription: updatedSubscription,
    };

    await users.updatePrefs(userId, updatedPrefs);
    
    console.log('Server-side subscription update successful:', {
      userId,
      subscription: updatedSubscription
    });
  } catch (error) {
    console.error('Error updating user subscription server-side:', error);
    throw error;
  }
};

// Extract user ID from webhook payload
const extractUserId = (payload: any): string | null => {
  return payload.data?.metadata?.userId ||
         payload.data?.metadata?.appwriteUserId ||
         payload.data?.customer?.metadata?.userId ||
         payload.data?.customer?.metadata?.appwriteUserId ||
         null;
};



export const POST = Webhooks({
  webhookKey: DODO_CONFIG.webhookSecret,
  
  // Handle all webhook events for logging
  onPayload: async (payload) => {
    console.log('DODO Webhook received:', {
      type: payload.type,
      timestamp: new Date().toISOString()
    });
  },

  // Subscription became active (new subscription or reactivation)
  onSubscriptionActive: async (payload) => {
    console.log('Subscription activated:', payload);
    
    const userId = extractUserId(payload);
    if (!userId) {
      console.error('No user ID found in subscription active webhook');
      return;
    }

    try {
      const subscriptionData = payload.data as any;
      await updateUserSubscriptionServer(userId, {
        tier: 'PREMIUM',
        status: 'active',
        customerId: subscriptionData.customer?.id || subscriptionData.customer_id,
        subscriptionId: subscriptionData.id,
        currentPeriodEnd: subscriptionData.current_period_end,
        cancelAtPeriodEnd: false,
        currency: subscriptionData.billing_currency as 'INR' | 'USD',
        amount: subscriptionData.amount,
      });

      // Also update tier system to premium
      await updateUserPreferencesServer(userId, {
        tier: 'premium',
      });

      console.log('User upgraded to premium:', userId);
    } catch (error) {
      console.error('Error handling subscription active:', error);
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
    console.log('Subscription cancelled:', payload);
    
    const userId = extractUserId(payload);
    if (!userId) {
      console.error('No user ID found in subscription cancelled webhook');
      return;
    }

    try {
      await updateUserSubscriptionServer(userId, {
        status: 'cancelled',
        cancelAtPeriodEnd: true,
      });

      console.log('Subscription cancelled for user:', userId);
    } catch (error) {
      console.error('Error handling subscription cancellation:', error);
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
    console.log('Payment succeeded:', payload);
    
    const userId = extractUserId(payload);
    if (userId) {
      try {
        const paymentData = payload.data as any;
        await updateUserSubscriptionServer(userId, {
          lastPaymentId: paymentData.id,
          retryCount: 0, // Reset retry count on successful payment
        });
      } catch (error) {
        console.error('Error handling payment success:', error);
      }
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
