/**
 * Upgrade Button Component
 * 
 * Handles premium subscription upgrade flow with currency detection.
 * Creates checkout sessions and redirects users to DODO Payments.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Crown, Loader2, CreditCard } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { detectUserCurrency, Currency, SUBSCRIPTION_PRICING } from '@/services/subscription.service';

interface UpgradeButtonProps {
  className?: string;
  variant?: 'default' | 'outline' | 'secondary';
  size?: 'default' | 'sm' | 'lg';
}

export default function UpgradeButton({ 
  className, 
  variant = 'default',
  size = 'default' 
}: UpgradeButtonProps) {
  const { user } = useAuth();
  const [currency, setCurrency] = useState<Currency>('USD');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Detect user currency on component mount
  useEffect(() => {
    const detectedCurrency = detectUserCurrency();
    setCurrency(detectedCurrency);
  }, []);

  const handleUpgrade = async () => {
    if (!user?.$id || !user?.email) {
      setError('Please sign in to upgrade');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('Creating checkout session:', {
        userId: user.$id,
        userEmail: user.email,
        currency
      });

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
        throw new Error(data.error || 'Failed to create checkout session');
      }

      console.log('Checkout session created:', data);

      // Redirect to DODO Payments checkout
      window.location.href = data.paymentUrl;
    } catch (err) {
      console.error('Error creating checkout:', err);
      setError(err instanceof Error ? err.message : 'Failed to create checkout');
    } finally {
      setLoading(false);
    }
  };

  const getPriceDisplay = () => {
    const price = SUBSCRIPTION_PRICING[currency];
    const symbol = currency === 'INR' ? '₹' : '$';
    return `${symbol}${price}/month`;
  };

  return (
    <div className="space-y-2">
      <Button
        onClick={handleUpgrade}
        disabled={loading || !user}
        variant={variant}
        size={size}
        className={`flex items-center gap-2 ${className}`}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Crown className="w-4 h-4" />
        )}
        {loading ? 'Creating Checkout...' : `Upgrade to Premium`}
      </Button>
      
      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          {getPriceDisplay()} • Cancel anytime
        </p>
        {currency === 'INR' && (
          <p className="text-xs text-muted-foreground">
            Detected location: India
          </p>
        )}
      </div>

      {error && (
        <div className="p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-center">
          <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}
    </div>
  );
}
