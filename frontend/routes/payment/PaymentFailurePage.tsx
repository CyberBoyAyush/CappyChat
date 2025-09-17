/**
 * Payment Failure Page
 * 
 * Displays payment failure information when DODO Payments subscription fails.
 * Provides retry options and support information.
 */

'use client';

import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button } from '@/frontend/components/ui/button';
import { AlertTriangle, ArrowLeft, RefreshCw, CreditCard, MessageSquare, HelpCircle } from 'lucide-react';

const PaymentFailurePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const errorCode = searchParams.get('error') || 'unknown';
  const errorMessage = searchParams.get('message') || '';

  const getErrorDetails = (code: string) => {
    switch (code.toLowerCase()) {
      case 'card_declined':
        return {
          title: 'Card Declined',
          message: 'Your payment method was declined. Please try a different card or contact your bank.',
          suggestion: 'Check your card details and try again, or use a different payment method.',
        };
      case 'insufficient_funds':
        return {
          title: 'Insufficient Funds',
          message: 'Your card doesn\'t have enough funds for this transaction.',
          suggestion: 'Please add funds to your account or use a different payment method.',
        };
      case 'expired_card':
        return {
          title: 'Card Expired',
          message: 'The payment card you used has expired.',
          suggestion: 'Please update your card information and try again.',
        };
      case 'processing_error':
        return {
          title: 'Processing Error',
          message: 'There was an error processing your payment.',
          suggestion: 'This is usually temporary. Please try again in a few minutes.',
        };
      case 'network_error':
        return {
          title: 'Network Error',
          message: 'We couldn\'t connect to the payment processor.',
          suggestion: 'Please check your internet connection and try again.',
        };
      default:
        return {
          title: 'Payment Failed',
          message: errorMessage || 'We couldn\'t process your payment at this time.',
          suggestion: 'Please try again or contact support if the problem persists.',
        };
    }
  };

  const { title, message, suggestion } = getErrorDetails(errorCode);

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

        {/* Failure Card */}
        <div className="bg-card border rounded-xl p-6 shadow-sm text-center space-y-6">
          <div className="space-y-4">
            <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
              <p className="text-muted-foreground">{message}</p>
            </div>
          </div>

          {/* Error Details */}
          {suggestion && (
            <div className="p-4 bg-muted/30 rounded-lg text-left">
              <div className="flex items-start gap-2">
                <HelpCircle className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div className="space-y-1">
                  <p className="text-sm font-medium">What can you do?</p>
                  <p className="text-sm text-muted-foreground">{suggestion}</p>
                </div>
              </div>
            </div>
          )}

          {/* Common Issues */}
          <div className="space-y-3 text-left">
            <h3 className="font-medium text-center">Common solutions:</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <div className="w-1 h-1 bg-muted-foreground rounded-full mt-2 flex-shrink-0"></div>
                Check your card details are correct
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1 h-1 bg-muted-foreground rounded-full mt-2 flex-shrink-0"></div>
                Ensure your card has sufficient funds
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1 h-1 bg-muted-foreground rounded-full mt-2 flex-shrink-0"></div>
                Try a different payment method
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1 h-1 bg-muted-foreground rounded-full mt-2 flex-shrink-0"></div>
                Contact your bank if the issue persists
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button asChild className="w-full">
              <Link to="/settings?section=subscription">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Link>
            </Button>
            
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" asChild>
                <Link to="/chat">
                  <MessageSquare className="h-4 w-4 mr-1" />
                  Continue Free
                </Link>
              </Button>
              
              <Button variant="outline" asChild>
                <a href="mailto:support@cappychat.com?subject=Payment%20Issue">
                  <HelpCircle className="h-4 w-4 mr-1" />
                  Get Help
                </a>
              </Button>
            </div>
          </div>

          {/* Error Code */}
          {errorCode !== 'unknown' && (
            <div className="pt-4 border-t">
              <p className="text-xs text-muted-foreground">
                Error Code: {errorCode.toUpperCase()}
              </p>
            </div>
          )}

          {/* Support Info */}
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">
              Need immediate help?
            </p>
            <p className="text-xs text-muted-foreground">
              Email us at{' '}
              <a href="mailto:support@cappychat.com" className="text-primary hover:underline">
                support@cappychat.com
              </a>
              {' '}or try our live chat
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentFailurePage;
