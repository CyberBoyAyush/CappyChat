/**
 * Upgrade Button Component
 * 
 * Handles premium subscription upgrade flow with currency detection.
 * Creates checkout sessions and redirects users to DODO Payments.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Crown, CreditCard } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { detectUserCurrency, Currency, SUBSCRIPTION_PRICING } from '@/services/subscription.service';
import { useNavigate } from 'react-router-dom';

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
  const navigate = useNavigate();
  const [currency, setCurrency] = useState<Currency>('USD');

  // Detect user currency on component mount
  useEffect(() => {
    const detectedCurrency = detectUserCurrency();
    setCurrency(detectedCurrency);
  }, []);

  const handleUpgrade = () => {
    navigate('/pricing');
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
        disabled={!user}
        variant={variant}
        size={size}
        className={`flex items-center gap-2 ${className}`}
      >
        <Crown className="w-4 h-4" />
        Upgrade to Premium
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
    </div>
  );
}
