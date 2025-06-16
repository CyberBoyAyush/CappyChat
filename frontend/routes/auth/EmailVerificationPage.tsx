/**
 * Email Verification Page
 * 
 * Handles email verification process and provides options to resend verification emails.
 * Shows verification status and provides navigation options.
 */

'use client';

import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Button } from '@/frontend/components/ui/button';
import { useAuth } from '@/frontend/contexts/AuthContext';
import { ArrowLeft, Mail, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { ThemeToggleButton } from '@/frontend/components/ui/ThemeComponents';

const EmailVerificationPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { user, verifyEmail, resendVerificationEmail, isEmailVerified, loading, refreshUser } = useAuth();
  const navigate = useNavigate();
  
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'success' | 'error' | 'resent'>('pending');
  const [error, setError] = useState('');
  const [isResending, setIsResending] = useState(false);

  const userId = searchParams.get('userId');
  const secret = searchParams.get('secret');

  useEffect(() => {
    if (userId && secret) {
      handleVerification();
    } else if (isEmailVerified) {
      setVerificationStatus('success');
    }
  }, [userId, secret, isEmailVerified]);

  // Periodically check verification status for users who are waiting
  useEffect(() => {
    if (!userId && !secret && user && !isEmailVerified && verificationStatus === 'pending') {
      const checkInterval = setInterval(async () => {
        await refreshUser();
      }, 3000); // Check every 3 seconds

      return () => clearInterval(checkInterval);
    }
  }, [userId, secret, user, isEmailVerified, verificationStatus, refreshUser]);

  // Auto-update verification status when isEmailVerified changes
  useEffect(() => {
    if (isEmailVerified && verificationStatus !== 'success') {
      setVerificationStatus('success');
    }
  }, [isEmailVerified, verificationStatus]);

  const handleVerification = async () => {
    if (!userId || !secret) return;

    try {
      await verifyEmail(userId, secret);
      setVerificationStatus('success');
      setError('');

      // Refresh user data to ensure UI reflects the updated verification status
      await refreshUser();
    } catch (err: any) {
      setVerificationStatus('error');
      setError(err.message || 'Verification failed. Please try again.');
    }
  };

  const handleResendVerification = async () => {
    if (!user) return;

    setIsResending(true);
    setError('');

    try {
      await resendVerificationEmail();
      setVerificationStatus('resent');
    } catch (err: any) {
      setError(err.message || 'Failed to resend verification email.');
    } finally {
      setIsResending(false);
    }
  };

  const handleContinue = () => {
    navigate('/chat');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Navigation */}
      <div className="fixed top-4 left-4 z-50">
        <Link to="/">
          <Button variant="outline" size="icon" className="focus-enhanced">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
      </div>

      <div className="fixed top-4 right-4 z-50">
        <ThemeToggleButton variant="inline" />
      </div>

      <div className="w-full max-w-md">
        <div className="bg-card rounded-2xl shadow-xl p-8 border border-border text-center">
          {/* Icon */}
          <div className="mb-6">
            {verificationStatus === 'success' ? (
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
            ) : verificationStatus === 'error' ? (
              <AlertCircle className="h-16 w-16 text-red-500 mx-auto" />
            ) : verificationStatus === 'resent' ? (
              <Mail className="h-16 w-16 text-blue-500 mx-auto" />
            ) : (
              <Mail className="h-16 w-16 text-muted-foreground mx-auto" />
            )}
          </div>

          {/* Content based on status */}
          {verificationStatus === 'success' && (
            <>
              <h1 className="text-2xl font-bold text-foreground mb-4">
                Email Verified!
              </h1>
              <p className="text-muted-foreground mb-6">
                Your email has been successfully verified. You can now access all features of the application.
              </p>
              <Button onClick={handleContinue} className="w-full">
                Continue to App
              </Button>
            </>
          )}

          {verificationStatus === 'error' && (
            <>
              <h1 className="text-2xl font-bold text-foreground mb-4">
                Verification Failed
              </h1>
              <p className="text-muted-foreground mb-4">
                {error}
              </p>
              <div className="space-y-3">
                <Button 
                  onClick={handleResendVerification} 
                  disabled={isResending || !user}
                  className="w-full"
                >
                  {isResending ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Resending...
                    </>
                  ) : (
                    'Resend Verification Email'
                  )}
                </Button>
                <Button variant="outline" asChild className="w-full">
                  <Link to="/auth/login">Back to Login</Link>
                </Button>
              </div>
            </>
          )}

          {verificationStatus === 'resent' && (
            <>
              <h1 className="text-2xl font-bold text-foreground mb-4">
                Verification Email Sent
              </h1>
              <p className="text-muted-foreground mb-6">
                We've sent a new verification email to your address. Please check your inbox and click the verification link.
              </p>
              <div className="space-y-3">
                <Button 
                  onClick={handleResendVerification} 
                  disabled={isResending}
                  variant="outline"
                  className="w-full"
                >
                  {isResending ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Resending...
                    </>
                  ) : (
                    'Resend Again'
                  )}
                </Button>
                <Button variant="outline" asChild className="w-full">
                  <Link to="/auth/login">Back to Login</Link>
                </Button>
              </div>
            </>
          )}

          {verificationStatus === 'pending' && !isEmailVerified && user && (
            <>
              <h1 className="text-2xl font-bold text-foreground mb-4">
                Verify Your Email
              </h1>
              <p className="text-muted-foreground mb-4">
                Please check your email inbox for a verification link. Click the link to verify your email address.
              </p>
              <p className="text-sm text-muted-foreground mb-6">
                Didn't receive the email? Check your spam folder or request a new one.
              </p>
              {error && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}
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
                    'Resend Verification Email'
                  )}
                </Button>
                <Button variant="outline" asChild className="w-full">
                  <Link to="/">Back to Home</Link>
                </Button>
              </div>
            </>
          )}

          {!user && (
            <>
              <h1 className="text-2xl font-bold text-foreground mb-4">
                Login Required
              </h1>
              <p className="text-muted-foreground mb-6">
                Please log in to verify your email address.
              </p>
              <Button asChild className="w-full">
                <Link to="/">Go to Home</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationPage;
