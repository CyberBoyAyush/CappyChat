/**
 * Auth Error Page
 * 
 * Displays authentication errors when OAuth or other auth processes fail.
 * Provides user-friendly error messages and recovery options.
 */

'use client';

import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button } from '@/frontend/components/ui/button';
import { AlertTriangle, ArrowLeft, RefreshCw } from 'lucide-react';

const AuthErrorPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const errorType = searchParams.get('error') || 'unknown';

  const getErrorMessage = (error: string) => {
    switch (error.toLowerCase()) {
      case 'access_denied':
        return {
          title: 'Access Denied',
          message: 'You cancelled the authentication process. Please try again if you want to sign in.',
        };
      case 'unauthorized':
        return {
          title: 'Unauthorized',
          message: 'We couldn\'t verify your account. Please try signing in again.',
        };
      case 'network_error':
        return {
          title: 'Network Error',
          message: 'We\'re having trouble connecting to our servers. Please check your internet connection and try again.',
        };
      default:
        return {
          title: 'Authentication Failed',
          message: 'Something went wrong during the sign-in process. Please try again.',
        };
    }
  };

  const { title, message } = getErrorMessage(errorType);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </div>

        {/* Error Card */}
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

          <div className="space-y-3">
            <Button asChild className="w-full">
              <Link to="/">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Link>
            </Button>
            
            <Button variant="outline" asChild className="w-full">
              <Link to="/">
                Go Home
              </Link>
            </Button>
          </div>
        </div>

        {/* Help Text */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Need help?{' '}
            <Link
              to="/support"
              className="font-medium text-primary hover:underline"
            >
              Contact Support
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthErrorPage;
