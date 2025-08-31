/**
 * Pricing Page Component
 *
 * Clean, modern pricing page with currency selection and subscription features.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import {
  Crown,
  Check,
  Zap,
  ArrowLeft,
  Loader2
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { detectUserCurrency, Currency } from '@/services/subscription.service';
import { useNavigate } from 'react-router-dom';

const PRICING_CONFIG = {
  USD: {
    original: 15,
    discounted: 11.25,
    currency: '$',
    flag: '🇺🇸'
  },
  INR: {
    original: 1350,
    discounted: 999,
    currency: '₹',
    flag: '🇮🇳'
  }
} as const;

const FEATURES = [
  'Free Models: 1,200 credits/month',
  'Premium Models: 600 credits/month',
  'Super Premium Models: 50 credits/month',
  'Priority support',
  'Advanced features access',
  'No ads or interruptions'
];

export default function PricingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>('USD');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-detect currency on mount
  useEffect(() => {
    const detectedCurrency = detectUserCurrency();
    setSelectedCurrency(detectedCurrency);
  }, []);

  const handleSubscribe = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (!user.email) {
      setError('Email is required for subscription. Please complete your profile.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/checkout/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.$id,
          userEmail: user.email,
          currency: selectedCurrency,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout');
      }

      // Redirect to DODO Payments checkout
      window.location.href = data.paymentUrl;
    } catch (err) {
      console.error('Error creating checkout:', err);
      setError(err instanceof Error ? err.message : 'Failed to create checkout');
    } finally {
      setLoading(false);
    }
  };

  const currentPricing = PRICING_CONFIG[selectedCurrency];
  const hasDiscount = currentPricing.original > currentPricing.discounted;
  const discountPercentage = hasDiscount
    ? Math.round(((currentPricing.original - currentPricing.discounted) / currentPricing.original) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Back Button */}
        <div className="mb-8">
          <Button
            onClick={() => navigate(-1)}
            variant="ghost"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Crown className="w-8 h-8 text-primary" />
            <h1 className="text-4xl font-bold">AVChat Pro</h1>
          </div>
          <p className="text-lg text-muted-foreground">
            Unlock premium AI models with increased credits and priority support.
          </p>
        </div>

        {/* Currency Selector */}
        <div className="flex justify-center mb-8">
          <Select value={selectedCurrency} onValueChange={(value: Currency) => setSelectedCurrency(value)}>
            <SelectTrigger className="w-28 h-10">
              <SelectValue>
                <div className="flex items-center gap-1">
                  <span>{PRICING_CONFIG[selectedCurrency].flag}</span>
                  <span className="text-sm font-medium">{selectedCurrency}</span>
                </div>
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="w-28">
              <SelectItem value="USD">
                <div className="flex items-center gap-1">
                  <span>🇺🇸</span>
                  <span>USD</span>
                </div>
              </SelectItem>
              <SelectItem value="INR">
                <div className="flex items-center gap-1">
                  <span>🇮🇳</span>
                  <span>INR</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Main Pricing Card */}
        <div className="max-w-md mx-auto">
          <Card className="border-2 border-primary/20">
            <CardHeader className="text-center pb-4">
              {hasDiscount && (
                <Badge className="w-fit mx-auto mb-4 bg-green-600 text-white">
                  {discountPercentage}% OFF
                </Badge>
              )}
              <CardTitle className="text-2xl font-bold flex items-center justify-center gap-2">
                <Crown className="w-6 h-6 text-primary" />
                Pro Plan
              </CardTitle>
              <div className="mt-4">
                <div className="flex items-center justify-center gap-2">
                  {hasDiscount && (
                    <span className="text-2xl text-muted-foreground line-through">
                      {currentPricing.currency}{currentPricing.original}
                    </span>
                  )}
                  <span className="text-5xl font-bold text-primary">
                    {currentPricing.currency}{currentPricing.discounted}
                  </span>
                </div>
                <p className="text-muted-foreground mt-1">per month</p>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Features List */}
              <div className="space-y-3">
                {FEATURES.map((feature, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                      <Check className="w-3 h-3 text-primary" />
                    </div>
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>

              {/* CTA Button */}
              <Button
                onClick={handleSubscribe}
                disabled={loading}
                className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Creating Checkout...
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5 mr-2" />
                    {user ? 'Subscribe Now' : 'Sign Up & Subscribe'}
                  </>
                )}
              </Button>

              {error && (
                <div className="text-center text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                  {error}
                </div>
              )}

              {/* Security Badge */}
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <span>🔒 Secure payment powered by DODO Payments</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Additional Info */}
        <div className="text-center text-sm text-muted-foreground mt-8 space-y-2">
          <p>Cancel anytime. No hidden fees.</p>
          <p>
            Need help? Contact us at{' '}
            <a href="mailto:hi@aysh.me" className="text-primary hover:underline">
              hi@aysh.me
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
