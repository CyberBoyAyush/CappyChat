/**
 * Reset Password Page Component
 *
 * Handles password reset using the token from the recovery email.
 * Features modern UI with validation, loading states, and success feedback.
 */

"use client";

import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import { useAuth } from "@/frontend/contexts/AuthContext";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Lock,
  AlertCircle,
  CheckCircle,
  Shield,
} from "lucide-react";
import { ThemeToggleButton } from "@/frontend/components/ui/ThemeComponents";
import { motion } from "framer-motion";

const ResetPasswordPage: React.FC = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const { resetPassword, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const userId = searchParams.get("userId");
  const secret = searchParams.get("secret");

  // Redirect if missing required parameters
  useEffect(() => {
    if (!userId || !secret) {
      setError("Invalid or missing reset parameters. Please request a new password reset.");
    }
  }, [userId, secret]);

  const validateForm = () => {
    if (!password) {
      setError("Please enter a new password.");
      return false;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return false;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return false;
    }

    return true;
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!validateForm() || !userId || !secret) {
      return;
    }

    setIsLoading(true);

    try {
      await resetPassword(userId, secret, password);
      setIsSuccess(true);
    } catch (err: any) {
      setError(err.message || "Failed to reset password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Loading, please wait...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header with back button and theme toggle */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/95 backdrop-blur-md">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="flex items-center justify-center h-9 w-9 rounded-full border border-border bg-background hover:bg-muted transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="sr-only">Back to Home</span>
            </Link>
            <div className="flex items-center">
              <img src="/logo.png" alt="AVChat Logo" className="h-8 w-8 mr-2" />
              <span className="text-lg font-semibold hidden sm:inline-block">
                AVChat
              </span>
            </div>
          </div>
          <ThemeToggleButton variant="inline" />
        </div>
      </header>

      {/* Main content */}
      <main className="flex-grow flex items-center justify-center pt-22 px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-xl"
        >
          <div className="bg-card border border-border rounded-2xl shadow-lg overflow-hidden">
            {!isSuccess ? (
              <>
                {/* Reset form header */}
                <div className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 px-6 py-8 text-center">
                  <Shield className="h-10 w-10 text-primary mx-auto mb-2" />
                  <h1 className="text-2xl font-bold text-foreground">
                    Reset Password
                  </h1>
                  <p className="text-muted-foreground text-sm">
                    Enter your new password below
                  </p>
                </div>

                {/* Form content */}
                <div className="p-6">
                  {/* Error Message */}
                  {error && (
                    <div className="mb-6 p-3 bg-destructive/10 border border-destructive/30 rounded-lg flex items-center gap-3">
                      <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
                      <p className="text-destructive text-sm">{error}</p>
                    </div>
                  )}

                  {/* Reset Password Form */}
                  <form onSubmit={handleResetPassword} className="space-y-4">
                    <div>
                      <label
                        htmlFor="password"
                        className="text-sm font-medium text-foreground block mb-2"
                      >
                        New Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className="pl-10 pr-10 h-11"
                          required
                          disabled={isLoading}
                          autoFocus
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                          disabled={isLoading}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="confirmPassword"
                        className="text-sm font-medium text-foreground block mb-2"
                      >
                        Confirm New Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="••••••••"
                          className="pl-10 pr-10 h-11"
                          required
                          disabled={isLoading}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 hover:bg-transparent"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          disabled={isLoading}
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Submit Button */}
                    <Button
                      type="submit"
                      className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
                      disabled={isLoading || !userId || !secret}
                    >
                      {isLoading ? (
                        <div className="flex items-center space-x-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground"></div>
                          <span>Resetting...</span>
                        </div>
                      ) : (
                        "Reset Password"
                      )}
                    </Button>
                  </form>
                </div>
              </>
            ) : (
              <>
                {/* Success header */}
                <div className="bg-gradient-to-r from-emerald-500/5 via-emerald-500/10 to-emerald-500/5 px-6 py-8 text-center">
                  <CheckCircle className="h-10 w-10 text-emerald-500 mx-auto mb-2" />
                  <h1 className="text-2xl font-bold text-foreground">
                    Password Reset Successful
                  </h1>
                  <p className="text-muted-foreground text-sm">
                    Your password has been successfully updated
                  </p>
                </div>

                {/* Success content */}
                <div className="p-6">
                  <div className="text-center space-y-4">
                    <p className="text-muted-foreground">
                      You can now log in with your new password.
                    </p>

                    <Button
                      onClick={handleBackToLogin}
                      className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
                    >
                      Continue to Login
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Security note */}
          <div className="mt-6 mb-2 flex items-center justify-center text-xs text-muted-foreground gap-2">
            <CheckCircle className="h-3 w-3" />
            <span>Secure, encrypted connection</span>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default ResetPasswordPage;
