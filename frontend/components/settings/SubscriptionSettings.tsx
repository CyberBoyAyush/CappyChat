/**
 * Subscription Settings Component
 * 
 * Displays current subscription status and provides management options.
 * Handles upgrade, cancellation, and customer portal access.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { 
  Crown, 
  Calendar, 
  CreditCard, 
  Settings, 
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Shield
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getSubscriptionStatus } from '@/services/subscription.service';
import { UserSubscription } from '@/lib/appwrite';
import { format } from 'date-fns';
import UpgradeButton from './UpgradeButton';

interface SubscriptionSettingsProps {
  className?: string;
}

export default function SubscriptionSettings({ className }: SubscriptionSettingsProps) {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [isPremium, setIsPremium] = useState(false);
  const [daysUntilExpiry, setDaysUntilExpiry] = useState<number | undefined>();
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load subscription status
  useEffect(() => {
    loadSubscriptionStatus();
  }, [user]);

  const loadSubscriptionStatus = async () => {
    if (!user?.$id) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const status = await getSubscriptionStatus();
      setSubscription(status.subscription);
      setIsPremium(status.isPremium);
      setDaysUntilExpiry(status.daysUntilExpiry);
    } catch (err) {
      console.error('Error loading subscription status:', err);
      setError('Failed to load subscription status');
    } finally {
      setLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    if (!user?.$id) return;
    
    try {
      setPortalLoading(true);
      setError(null);

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
        throw new Error(data.error || 'Failed to create portal session');
      }

      // Redirect to customer portal
      window.open(data.portalUrl, '_blank');
    } catch (err) {
      console.error('Error creating portal session:', err);
      setError(err instanceof Error ? err.message : 'Failed to open customer portal');
    } finally {
      setPortalLoading(false);
    }
  };

  const getStatusBadge = () => {
    if (!subscription) {
      return (
        <Badge variant="secondary" className="flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" />
          Free
        </Badge>
      );
    }

    if (subscription.adminOverride) {
      return (
        <Badge variant="default" className="flex items-center gap-1 bg-purple-600">
          <Shield className="w-3 h-3" />
          Admin Override
        </Badge>
      );
    }

    switch (subscription.status) {
      case 'active':
        return (
          <Badge variant="default" className="flex items-center gap-1 bg-green-600">
            <CheckCircle2 className="w-3 h-3" />
            Active
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            Cancelled
          </Badge>
        );
      case 'expired':
        return (
          <Badge variant="secondary" className="flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            Expired
          </Badge>
        );
      case 'on_hold':
        return (
          <Badge variant="outline" className="flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            On Hold
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            Payment Failed
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            Unknown
          </Badge>
        );
    }
  };

  const formatExpiryDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch {
      return 'Invalid date';
    }
  };

  if (loading) {
    return (
      <div className="p-6 border rounded-xl bg-card shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Crown className="h-5 w-5 text-primary animate-pulse" />
          <h3 className="text-lg font-medium">Subscription</h3>
        </div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-3/4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 border rounded-xl bg-card shadow-sm space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Crown className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-medium">Subscription</h3>
        </div>
        {getStatusBadge()}
      </div>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      <div className="space-y-3">
        {/* Current Plan */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Current Plan</span>
          <span className="font-medium">
            {isPremium ? 'Premium' : 'Free'}
          </span>
        </div>

        {/* Subscription Details */}
        {subscription && (
          <>
            {subscription.currency && subscription.amount && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Price</span>
                <span className="font-medium">
                  {subscription.currency === 'INR' ? '₹' : '$'}{subscription.amount}
                  {subscription.status === 'active' ? '/month' : ''}
                </span>
              </div>
            )}

            {subscription.currentPeriodEnd && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {subscription.status === 'cancelled' ? 'Expires On' : 'Next Billing'}
                </span>
                <div className="text-right">
                  <span className="font-medium">
                    {formatExpiryDate(subscription.currentPeriodEnd)}
                  </span>
                  {daysUntilExpiry !== undefined && (
                    <p className="text-xs text-muted-foreground">
                      {daysUntilExpiry > 0 
                        ? `${daysUntilExpiry} days remaining`
                        : 'Expired'
                      }
                    </p>
                  )}
                </div>
              </div>
            )}

            {subscription.adminOverride && (
              <div className="p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-purple-600" />
                  <span className="text-sm text-purple-600 dark:text-purple-400 font-medium">
                    Admin Override Active
                  </span>
                </div>
                <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                  Your premium access has been granted by an administrator.
                </p>
              </div>
            )}
          </>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          {!isPremium ? (
            <UpgradeButton />
          ) : (
            subscription?.customerId && !subscription.adminOverride && (
              <Button
                onClick={handleManageSubscription}
                disabled={portalLoading}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Settings className="w-4 h-4" />
                {portalLoading ? 'Loading...' : 'Manage Subscription'}
                <ExternalLink className="w-3 h-3" />
              </Button>
            )
          )}
        </div>
      </div>
    </div>
  );
}


