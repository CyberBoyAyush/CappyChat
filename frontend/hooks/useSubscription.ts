/**
 * Subscription Hook
 * 
 * React hook for managing subscription state and operations.
 * Provides subscription status, premium check, and management functions.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { UserSubscription } from '@/lib/appwrite';
import { getSubscriptionStatus, isPremium as checkIsPremium } from '@/services/subscription.service';
import { useAuth } from '../contexts/AuthContext';

interface UseSubscriptionReturn {
  // State
  subscription: UserSubscription | null;
  isPremium: boolean;
  daysUntilExpiry?: number;
  loading: boolean;
  error: string | null;
  
  // Actions
  refreshSubscription: () => Promise<void>;
  createCheckout: (currency?: 'INR' | 'USD') => Promise<string>;
  openCustomerPortal: () => Promise<void>;
}

export const useSubscription = (): UseSubscriptionReturn => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [isPremium, setIsPremium] = useState(false);
  const [daysUntilExpiry, setDaysUntilExpiry] = useState<number | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load subscription status
  const loadSubscriptionStatus = useCallback(async () => {
    if (!user?.$id) {
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const status = await getSubscriptionStatus();
      
      setSubscription(status.subscription);
      setIsPremium(status.isPremium);
      setDaysUntilExpiry(status.daysUntilExpiry);
    } catch (err) {
      console.error('Error loading subscription status:', err);
      setError(err instanceof Error ? err.message : 'Failed to load subscription');
    } finally {
      setLoading(false);
    }
  }, [user?.$id]);

  // Refresh subscription data
  const refreshSubscription = useCallback(async () => {
    setLoading(true);
    await loadSubscriptionStatus();
  }, [loadSubscriptionStatus]);

  // Create checkout session
  const createCheckout = useCallback(async (currency?: 'INR' | 'USD'): Promise<string> => {
    if (!user?.$id || !user?.email) {
      throw new Error('User not authenticated');
    }

    const response = await fetch('/api/checkout/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: user.$id,
        userEmail: user.email,
        currency,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to create checkout');
    }

    return data.paymentUrl;
  }, [user?.$id, user?.email]);

  // Open customer portal
  const openCustomerPortal = useCallback(async (): Promise<void> => {
    if (!user?.$id) {
      throw new Error('User not authenticated');
    }

    if (!subscription?.customerId) {
      throw new Error('No subscription found');
    }

    const response = await fetch('/api/checkout/portal', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: user.$id,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to open customer portal');
    }

    // Open portal in new tab
    window.open(data.portalUrl, '_blank');
  }, [user?.$id, subscription?.customerId]);

  // Load subscription on mount and user change
  useEffect(() => {
    loadSubscriptionStatus();
  }, [loadSubscriptionStatus]);

  // Auto-refresh subscription status every 5 minutes
  useEffect(() => {
    if (!user?.$id) return;

    const interval = setInterval(() => {
      loadSubscriptionStatus();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [user?.$id, loadSubscriptionStatus]);

  return {
    // State
    subscription,
    isPremium,
    daysUntilExpiry,
    loading,
    error,
    
    // Actions
    refreshSubscription,
    createCheckout,
    openCustomerPortal,
  };
};

// Simplified hook for just checking premium status
export const useIsPremium = (): { isPremium: boolean; loading: boolean } => {
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const checkPremiumStatus = async () => {
      if (!user?.$id) {
        setLoading(false);
        return;
      }

      try {
        const premium = await checkIsPremium();
        setIsPremium(premium);
      } catch (error) {
        console.error('Error checking premium status:', error);
        setIsPremium(false);
      } finally {
        setLoading(false);
      }
    };

    checkPremiumStatus();
  }, [user?.$id]);

  return { isPremium, loading };
};
