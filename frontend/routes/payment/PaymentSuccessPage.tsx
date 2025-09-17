/**
 * Payment Success Page
 * 
 * Displays payment success confirmation after successful DODO Payments subscription.
 * Shows premium activation status and provides navigation options.
 */

'use client';

import React, { useEffect, useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/frontend/components/ui/button';
import { CheckCircle2, ArrowLeft, Crown, Settings, MessageSquare, Loader2 } from 'lucide-react';
import { useAuth } from '@/frontend/contexts/AuthContext';
import { useSubscription } from '@/frontend/hooks/useSubscription';

const PaymentSuccessPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { subscription, isPremium, loading, refreshSubscription } = useSubscription();
  const [isChecking, setIsChecking] = useState(true);
  const [checkAttempts, setCheckAttempts] = useState(0);

  const sessionId = searchParams.get('session_id');
  const maxAttempts = 10; // Check for up to 30 seconds (3s intervals)

  // Poll for subscription status update
  useEffect(() => {
    if (!user) return;

    const checkSubscriptionStatus = async () => {
      try {
        await refreshSubscription();
        
        // If premium is active, stop checking
        if (isPremium && !loading) {
          setIsChecking(false);
          return;
        }

        // Continue checking if not premium yet and haven't exceeded max attempts
        if (checkAttempts < maxAttempts) {
          setCheckAttempts(prev => prev + 1);
          setTimeout(checkSubscriptionStatus, 3000); // Check every 3 seconds
        } else {
          // Max attempts reached, stop checking
          setIsChecking(false);
        }
      } catch (error) {
        console.error('Error checking subscription status:', error);
        setIsChecking(false);
      }
    };

    // Start checking after a brief delay
    const timeoutId = setTimeout(checkSubscriptionStatus, 2000);
    
    return () => clearTimeout(timeoutId);
  }, [user, isPremium, loading, checkAttempts, refreshSubscription]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user && !loading) {
      navigate('/login?redirect=/payment/success');
    }
  }, [user, loading, navigate]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center">
          <Link
            to="/settings"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Settings
          </Link>
        </div>

        {/* Success Card */}
        <div className="bg-card border rounded-xl p-6 shadow-sm text-center space-y-6">
          <div className="space-y-4">
            <div className="mx-auto w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-emerald-500" />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight">Payment Successful!</h1>
              <p className="text-muted-foreground">
                Thank you for upgrading to CappyChat Premium
              </p>
            </div>
          </div>

          {/* Status Section */}
          <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
            {isChecking ? (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Activating your premium account...
              </div>
            ) : isPremium ? (
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2 text-emerald-600">
                  <Crown className="h-4 w-4" />
                  <span className="font-medium">Premium Active</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Your account has been upgraded successfully
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2 text-amber-600">
                  <Loader2 className="h-4 w-4" />
                  <span className="font-medium">Processing...</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Your premium access will be activated shortly
                </p>
              </div>
            )}

            {sessionId && (
              <p className="text-xs text-muted-foreground">
                Transaction ID: {sessionId.slice(-8)}
              </p>
            )}
          </div>

          {/* Premium Features */}
          <div className="space-y-3 text-left">
            <h3 className="font-medium text-center">What's included:</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-3 w-3 text-emerald-500 flex-shrink-0" />
                Access to premium AI models
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-3 w-3 text-emerald-500 flex-shrink-0" />
                Higher usage limits
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-3 w-3 text-emerald-500 flex-shrink-0" />
                Priority support
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-3 w-3 text-emerald-500 flex-shrink-0" />
                Advanced features
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button asChild className="w-full">
              <Link to="/chat">
                <MessageSquare className="h-4 w-4 mr-2" />
                Start Chatting
              </Link>
            </Button>
            
            <Button variant="outline" asChild className="w-full">
              <Link to="/settings">
                <Settings className="h-4 w-4 mr-2" />
                Manage Subscription
              </Link>
            </Button>
          </div>

          {/* Help Text */}
          <p className="text-xs text-muted-foreground">
            Need help? Contact us at{' '}
            <a href="mailto:support@cappychat.com" className="text-primary hover:underline">
              support@cappychat.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccessPage;
