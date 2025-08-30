/**
 * Payment Result Page
 *
 * Handles both successful and failed payments from DODO Payments.
 * Redirects to appropriate success/failure page based on subscription status.
 */

'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/frontend/contexts/AuthContext';
import { useSubscription } from '@/frontend/hooks/useSubscription';

const PaymentResultPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { isPremium, refreshSubscription } = useSubscription();
  const [checkAttempts, setCheckAttempts] = useState(0);

  // Use refs to track polling state and avoid dependency issues
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const attemptsRef = useRef(0);
  const isPollingRef = useRef(false);

  const maxAttempts = 8; // Check for up to 24 seconds (3s intervals)
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (!user) {
      navigate('/login?redirect=/payment/result');
      return;
    }

    // Prevent multiple polling loops
    if (isPollingRef.current) return;
    isPollingRef.current = true;

    const checkPaymentResult = async () => {
      try {
        console.log(`Checking payment result - attempt ${attemptsRef.current + 1}/${maxAttempts}`);

        // Refresh subscription status
        await refreshSubscription();

        // If premium is active, redirect to success
        if (isPremium) {
          console.log('Payment successful - redirecting to success page');
          const successUrl = sessionId
            ? `/payment/success?session_id=${sessionId}`
            : '/payment/success';
          navigate(successUrl, { replace: true });
          return;
        }

        // Increment attempts
        attemptsRef.current += 1;
        setCheckAttempts(attemptsRef.current);

        // Continue checking if not premium yet and haven't exceeded max attempts
        if (attemptsRef.current < maxAttempts) {
          pollingRef.current = setTimeout(checkPaymentResult, 3000);
        } else {
          // Max attempts reached, assume payment failed
          console.log('Payment verification timeout - redirecting to failure page');
          const failureUrl = '/payment/failure?error=processing_timeout&message=Payment processing took too long';
          navigate(failureUrl, { replace: true });
        }
      } catch (error) {
        console.error('Error checking payment result:', error);
        // On error, redirect to failure page
        const failureUrl = '/payment/failure?error=processing_error&message=Unable to verify payment status';
        navigate(failureUrl, { replace: true });
      }
    };

    // Start checking after a brief delay to allow webhooks to process
    pollingRef.current = setTimeout(checkPaymentResult, 2000);

    // Cleanup function
    return () => {
      isPollingRef.current = false;
      if (pollingRef.current) {
        clearTimeout(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [user, navigate, sessionId, refreshSubscription]); // Removed isPremium and checkAttempts from dependencies

  // Additional effect to handle immediate premium status changes
  useEffect(() => {
    if (isPremium && isPollingRef.current) {
      console.log('Premium status detected - stopping polling and redirecting');
      isPollingRef.current = false;
      if (pollingRef.current) {
        clearTimeout(pollingRef.current);
        pollingRef.current = null;
      }

      const successUrl = sessionId
        ? `/payment/success?session_id=${sessionId}`
        : '/payment/success';
      navigate(successUrl, { replace: true });
    }
  }, [isPremium, navigate, sessionId]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="bg-card border rounded-xl p-6 shadow-sm text-center space-y-6">
          <div className="space-y-4">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight">Processing Payment</h1>
              <p className="text-muted-foreground">
                Please wait while we verify your payment...
              </p>
            </div>
          </div>

          <div className="space-y-2 p-4 bg-muted/30 rounded-lg">
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Checking payment status ({checkAttempts + 1}/{maxAttempts})
            </div>
            <p className="text-xs text-muted-foreground">
              This usually takes just a few seconds
            </p>
          </div>

          {sessionId && (
            <p className="text-xs text-muted-foreground">
              Transaction ID: {sessionId.slice(-8)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentResultPage;
