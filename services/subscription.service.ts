/**
 * Subscription Service
 * 
 * Handles subscription management, currency detection, and DODO Payments integration.
 * Provides methods for creating checkouts, managing subscriptions, and detecting user currency.
 */

import { dodoClient, getProductId } from '@/lib/dodo-client';
import { getUserSubscription, updateUserSubscription, UserSubscription } from '@/lib/appwrite';

// Pricing configuration
export const SUBSCRIPTION_PRICING = {
  INR: 999,
  USD: 12,
} as const;

export type Currency = keyof typeof SUBSCRIPTION_PRICING;

/**
 * Detect user's preferred currency based on timezone and locale
 */
export const detectUserCurrency = (): Currency => {
  try {
    // Check if we're in browser environment
    if (typeof window === 'undefined') {
      return 'USD'; // Default for server-side
    }

    // Method 1: Check timezone for India
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (timezone === 'Asia/Kolkata' || timezone === 'Asia/Calcutta') {
      return 'INR';
    }

    // Method 2: Check browser locale for India
    const locale = navigator.language || navigator.languages?.[0];
    if (locale && (locale.includes('IN') || locale.startsWith('hi'))) {
      return 'INR';
    }

    // Method 3: Check other Indian timezones
    const indianTimezones = [
      'Asia/Kolkata',
      'Asia/Calcutta',
      'Asia/Mumbai',
      'Asia/Delhi',
      'Asia/Chennai',
      'Asia/Bangalore'
    ];
    
    if (indianTimezones.includes(timezone)) {
      return 'INR';
    }

    // Default to USD
    return 'USD';
  } catch (error) {
    console.error('Error detecting currency:', error);
    return 'USD';
  }
};

/**
 * Create a subscription checkout session
 */
export const createSubscriptionCheckout = async (
  userEmail: string,
  userId: string,
  currency?: Currency
): Promise<{ paymentUrl: string; customerId: string }> => {
  try {
    const detectedCurrency = currency || detectUserCurrency();
    const amount = SUBSCRIPTION_PRICING[detectedCurrency];
    const productId = getProductId();

    console.log('Creating subscription checkout:', {
      userEmail,
      userId,
      currency: detectedCurrency,
      amount,
      productId
    });

    const response = await dodoClient.subscriptions.create({
      product_id: productId,
      customer: {
        email: userEmail,
        name: userEmail.split('@')[0], // Use email prefix as name
      },
      quantity: 1,
      billing: {
        city: 'Unknown',
        country: detectedCurrency === 'INR' ? 'IN' : 'US',
        state: 'Unknown',
        street: 'Unknown',
        zipcode: '000000',
      },
      billing_currency: detectedCurrency,
      payment_link: true,
      metadata: {
        userId,
        appwriteUserId: userId,
        source: 'avchat',
        // Store return URLs in metadata for potential future use
        success_url: process.env.NODE_ENV === 'production'
          ? 'https://avchat.xyz/payment/success'
          : 'https://test.avchat.xyz/payment/success',
        cancel_url: process.env.NODE_ENV === 'production'
          ? 'https://avchat.xyz/payment/cancelled'
          : 'https://test.avchat.xyz/payment/cancelled',
      },
    });

    if (!response.payment_link) {
      throw new Error('No payment link returned from DODO Payments');
    }

    return {
      paymentUrl: response.payment_link,
      customerId: response.customer.customer_id,
    };
  } catch (error) {
    console.error('Error creating subscription checkout:', error);
    throw new Error('Failed to create subscription checkout');
  }
};

/**
 * Create customer portal session for subscription management
 */
export const createCustomerPortalSession = async (
  customerId: string
): Promise<{ portalUrl: string }> => {
  try {
    // Use direct HTTP call for customer portal session
    const response = await fetch('https://api.dodopayments.com/v1/customer-portal-sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.DODO_PAYMENTS_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        customer_id: customerId,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return {
      portalUrl: data.url,
    };
  } catch (error) {
    console.error('Error creating customer portal session:', error);
    throw new Error('Failed to create customer portal session');
  }
};

/**
 * Check if user has premium subscription
 */
export const isPremium = async (): Promise<boolean> => {
  try {
    const subscription = await getUserSubscription();
    
    if (!subscription) {
      return false;
    }

    // Check admin override first
    if (subscription.adminOverride) {
      return true;
    }

    // Check subscription status and expiry
    if (subscription.status === 'active' && subscription.tier === 'PREMIUM') {
      // Check if subscription is still valid
      if (subscription.currentPeriodEnd) {
        const expiryDate = new Date(subscription.currentPeriodEnd);
        const now = new Date();
        return expiryDate > now;
      }
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error checking premium status:', error);
    return false;
  }
};

/**
 * Get subscription status details
 */
export const getSubscriptionStatus = async (): Promise<{
  isPremium: boolean;
  subscription: UserSubscription | null;
  daysUntilExpiry?: number;
}> => {
  try {
    const subscription = await getUserSubscription();
    const premium = await isPremium();

    let daysUntilExpiry: number | undefined;
    
    if (subscription?.currentPeriodEnd) {
      const expiryDate = new Date(subscription.currentPeriodEnd);
      const now = new Date();
      const diffTime = expiryDate.getTime() - now.getTime();
      daysUntilExpiry = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    return {
      isPremium: premium,
      subscription,
      daysUntilExpiry,
    };
  } catch (error) {
    console.error('Error getting subscription status:', error);
    return {
      isPremium: false,
      subscription: null,
    };
  }
};

/**
 * Update subscription from webhook data
 */
export const updateSubscriptionFromWebhook = async (
  webhookData: any
): Promise<void> => {
  try {
    const { customer_id, subscription_id, status, current_period_end, metadata } = webhookData;
    
    // Extract user ID from metadata
    const userId = metadata?.userId || metadata?.appwriteUserId;
    if (!userId) {
      console.error('No user ID found in webhook metadata');
      return;
    }

    const subscriptionUpdate: Partial<UserSubscription> = {
      customerId: customer_id,
      subscriptionId: subscription_id,
      status: mapDodoStatusToInternal(status),
      currentPeriodEnd: current_period_end,
      tier: status === 'active' ? 'PREMIUM' : 'FREE',
    };

    await updateUserSubscription(subscriptionUpdate);
    
    console.log('Subscription updated from webhook:', subscriptionUpdate);
  } catch (error) {
    console.error('Error updating subscription from webhook:', error);
    throw error;
  }
};

/**
 * Map DODO status to internal status
 */
const mapDodoStatusToInternal = (dodoStatus: string): UserSubscription['status'] => {
  switch (dodoStatus) {
    case 'active':
      return 'active';
    case 'cancelled':
      return 'cancelled';
    case 'expired':
      return 'expired';
    case 'on_hold':
      return 'on_hold';
    case 'failed':
      return 'failed';
    default:
      return 'expired';
  }
};

/**
 * Cancel subscription
 */
export const cancelSubscription = async (subscriptionId: string): Promise<void> => {
  try {
    // Use direct HTTP call for subscription cancellation
    const response = await fetch(`https://api.dodopayments.com/v1/subscriptions/${subscriptionId}/cancel`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.DODO_PAYMENTS_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    await updateUserSubscription({
      status: 'cancelled',
      cancelAtPeriodEnd: true,
    });
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    throw new Error('Failed to cancel subscription');
  }
};
