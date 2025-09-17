/**
 * Payment Cancelled Page
 * 
 * Displays when user cancels the DODO Payments subscription process.
 * Provides options to retry or continue with free plan.
 */

'use client';

import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/frontend/components/ui/button';
import { X, ArrowLeft, CreditCard, MessageSquare, Crown, Info } from 'lucide-react';

const PaymentCancelledPage: React.FC = () => {
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

        {/* Cancelled Card */}
        <div className="bg-card border rounded-xl p-6 shadow-sm text-center space-y-6">
          <div className="space-y-4">
            <div className="mx-auto w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center">
              <X className="h-8 w-8 text-amber-500" />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight">Payment Cancelled</h1>
              <p className="text-muted-foreground">
                You cancelled the payment process. No charges were made.
              </p>
            </div>
          </div>

          {/* Info Section */}
          <div className="p-4 bg-muted/30 rounded-lg text-left">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <p className="text-sm font-medium">No worries!</p>
                <p className="text-sm text-muted-foreground">
                  You can continue using CappyChat with the free plan or upgrade anytime.
                </p>
              </div>
            </div>
          </div>

          {/* Free Plan Features */}
          <div className="space-y-3 text-left">
            <h3 className="font-medium text-center">Free plan includes:</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0"></div>
                Access to basic AI models
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0"></div>
                Limited daily usage
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0"></div>
                Core chat features
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0"></div>
                Community support
              </li>
            </ul>
          </div>

          {/* Premium Benefits Reminder */}
          <div className="p-4 bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg border border-primary/20">
            <div className="flex items-center gap-2 mb-2">
              <Crown className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Premium Benefits</span>
            </div>
            <p className="text-xs text-muted-foreground text-left">
              Upgrade anytime to unlock premium models, higher limits, and priority support.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button asChild className="w-full">
              <Link to="/chat">
                <MessageSquare className="h-4 w-4 mr-2" />
                Continue with Free Plan
              </Link>
            </Button>
            
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" asChild>
                <Link to="/settings?section=subscription">
                  <CreditCard className="h-4 w-4 mr-1" />
                  Try Again
                </Link>
              </Button>
              
              <Button variant="outline" asChild>
                <Link to="/about">
                  <Info className="h-4 w-4 mr-1" />
                  Learn More
                </Link>
              </Button>
            </div>
          </div>

          {/* Help Text */}
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">
              Questions about premium features?
            </p>
            <p className="text-xs text-muted-foreground">
              Contact us at{' '}
              <a href="mailto:support@cappychat.com" className="text-primary hover:underline">
                support@cappychat.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentCancelledPage;
