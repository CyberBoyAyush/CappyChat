/**
 * Email Verification Guard
 * 
 * A component that prevents unverified users from accessing protected parts of the app.
 * Shows a verification prompt and options to resend verification emails.
 */

'use client';

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/frontend/components/ui/button';
import { useAuth } from '@/frontend/contexts/AuthContext';
import { Mail, RefreshCw, AlertCircle, LogOut } from 'lucide-react';

interface EmailVerificationGuardProps {
  children: React.ReactNode;
}

const EmailVerificationGuard: React.FC<EmailVerificationGuardProps> = ({ children }) => {
  const { user, isEmailVerified, resendVerificationEmail, logout } = useAuth();
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState('');
  const [resendSuccess, setResendSuccess] = useState(false);

  // If user is verified or not logged in, render children
  if (!user || isEmailVerified) {
    return <>{children}</>;
  }

  const handleResendVerification = async () => {
    setIsResending(true);
    setError('');
    setResendSuccess(false);

    try {
      await resendVerificationEmail();
      setResendSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to resend verification email.');
    } finally {
      setIsResending(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-2xl shadow-xl p-8 border border-border text-center">
          {/* Icon */}
          <div className="mb-6">
            <div className="relative">
              <Mail className="h-16 w-16 text-black dark:text-white mx-auto" />
              <AlertCircle className="h-6 w-6 text-red-500 absolute -top-1 -right-1" />
            </div>
          </div>

          {/* Content */}
          <h1 className="text-2xl font-bold text-foreground mb-4">
            Email Verification Required
          </h1>
          <p className="text-muted-foreground mb-4">
            Please verify your email address to continue using the application.
          </p>
          <p className="text-sm text-muted-foreground mb-6">
            We've sent a verification link to <strong>{user.email}</strong>. 
            Check your inbox and click the link to verify your account.
          </p>

          {/* Success message */}
          {resendSuccess && (
            <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-sm text-green-600 dark:text-green-400">
                Verification email sent successfully! Please check your inbox.
              </p>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3">
            <Button 
              onClick={handleResendVerification} 
              disabled={isResending}
              className="w-full"
            >
              {isResending ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Resending...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  Resend Verification Email
                </>
              )}
            </Button>

            <Button 
              variant="outline" 
              onClick={handleLogout}
              className="w-full"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>

          {/* Help text */}
          <div className="mt-6 pt-6 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Didn't receive the email? Check your spam folder or try resending the verification email.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationGuard;
