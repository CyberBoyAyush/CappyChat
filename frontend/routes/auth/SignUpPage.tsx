/**
 * Sign Up Page Component
 *
 * Provides user registration through email/password and Google OAuth.
 * Features modern UI with validation, loading states, and error handling.
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
  Mail,
  Lock,
  AlertCircle,
  User,
  CheckCircle,
  Shield,
  UserPlus,
} from "lucide-react";
import { ThemeToggleButton } from "@/frontend/components/ui/ThemeComponents";
import { GoogleIcon, GitHubIcon } from "@/frontend/components/ui/icons";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const SignUpPage: React.FC = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { register, loginWithGoogle, loginWithGitHub, loading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/chat";

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !loading) {
      navigate(redirectTo);
    }
  }, [isAuthenticated, loading, navigate, redirectTo]);

  const validateForm = () => {
    if (!name.trim()) {
      setError("Name is required");
      return false;
    }
    if (!email.trim()) {
      setError("Email is required");
      return false;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters long");
      return false;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return false;
    }
    return true;
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      await register(email, password, name);
      // Redirect to verification page instead of main app
      navigate("/auth/verify");
    } catch (err: any) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setError("");
    try {
      await loginWithGoogle();
    } catch (err: any) {
      setError(err.message || "Google sign up failed. Please try again.");
    }
  };

  const handleGitHubSignUp = async () => {
    setError("");
    try {
      await loginWithGitHub();
    } catch (err: any) {
      setError(err.message || "GitHub sign up failed. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Setting up your account...</p>
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
              <img src="/logo.png" alt="AtChat Logo" className="h-8 w-8 mr-2" />
              <span className="text-lg font-semibold hidden sm:inline-block">
                AtChat
              </span>
            </div>
          </div>
          <ThemeToggleButton variant="inline" />
        </div>
      </header>

      {/* Main content */}
      <main className="flex-grow  flex items-center justify-center pt-24 px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-xl"
        >
          <div className="bg-card border border-border rounded-2xl shadow-lg overflow-hidden">
            {/* Signup form header */}
            <div className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 px-6 py-8 text-center">
              <UserPlus className="h-10 w-10 text-primary mx-auto mb-2" />
              <h1 className="text-2xl font-bold text-foreground">
                Create an Account
              </h1>
              <p className="text-muted-foreground text-sm">
                Join AtChat and start conversations
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

              {/* OAuth Signup Buttons */}
              <div className="space-y-3 mb-6">
                <Button
                  onClick={handleGoogleSignUp}
                  disabled={isLoading || loading}
                  className="w-full bg-card hover:bg-accent/50 text-foreground border border-border h-11 relative overflow-hidden group"
                >
                  <span className="absolute inset-0 w-3 bg-gradient-to-r from-transparent via-primary/10 to-transparent -translate-x-full group-hover:animate-shimmer"></span>
                  <GoogleIcon className="h-5 w-5 mr-3" />
                  <span>Continue with Google</span>
                </Button>

                <Button
                  onClick={handleGitHubSignUp}
                  disabled={isLoading || loading}
                  className="w-full bg-card hover:bg-accent/50 text-foreground border border-border h-11 relative overflow-hidden group"
                >
                  <span className="absolute inset-0 w-3 bg-gradient-to-r from-transparent via-primary/10 to-transparent -translate-x-full group-hover:animate-shimmer"></span>
                  <GitHubIcon className="h-5 w-5 mr-3" />
                  <span>Continue with GitHub</span>
                </Button>
              </div>

              {/* Divider */}
              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-2 bg-card text-muted-foreground">
                    Or create with email
                  </span>
                </div>
              </div>

              {/* Email Signup Form */}
              <form onSubmit={handleEmailSignUp} className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label
                      htmlFor="name"
                      className="text-sm font-medium text-foreground"
                    >
                      Full Name
                    </label>
                    <span className="text-xs text-muted-foreground">
                      Required
                    </span>
                  </div>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="John Doe"
                      className="pl-10 h-11"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label
                      htmlFor="email"
                      className="text-sm font-medium text-foreground"
                    >
                      Email Address
                    </label>
                    <span className="text-xs text-muted-foreground">
                      Required
                    </span>
                  </div>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your.email@example.com"
                      className="pl-10 h-11"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label
                      htmlFor="password"
                      className="text-sm font-medium text-foreground"
                    >
                      Password
                    </label>
                    <span className="text-xs text-muted-foreground">
                      8+ characters
                    </span>
                  </div>
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
                  <div className="flex justify-between items-center mb-2">
                    <label
                      htmlFor="confirmPassword"
                      className="text-sm font-medium text-foreground"
                    >
                      Confirm Password
                    </label>
                    <span className="text-xs text-muted-foreground">
                      Required
                    </span>
                  </div>
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
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
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

                {/* Terms and Conditions */}
                <div className="flex items-start space-x-2 my-3">
                  <input
                    type="checkbox"
                    id="terms"
                    className="rounded border-border text-primary focus:ring-primary/30 h-4 w-4 mt-1"
                    required
                  />
                  <label
                    htmlFor="terms"
                    className="text-sm text-muted-foreground"
                  >
                    I agree to the{" "}
                    <Link to="/terms" className="text-primary hover:underline">
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link
                      to="/privacy"
                      className="text-primary hover:underline"
                    >
                      Privacy Policy
                    </Link>
                  </label>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
                  disabled={isLoading || loading}
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground"></div>
                      <span>Creating account...</span>
                    </div>
                  ) : (
                    "Create Account"
                  )}
                </Button>
              </form>

              {/* Login link */}
              <div className="mt-8 text-center">
                <p className="text-muted-foreground text-sm">
                  Already have an account?{" "}
                  <Link
                    to="/auth/login"
                    className="text-primary hover:text-primary/80 font-medium transition-colors"
                  >
                    Sign in
                  </Link>
                </p>
              </div>
            </div>
          </div>

          {/* Security note */}
          <div className="mt-6 mb-2 flex items-center justify-center text-xs text-muted-foreground gap-2">
            <Shield className="h-3 w-3" />
            <span>Secure, encrypted registration</span>
          </div>
        </motion.div>
      </main>

      {/* Professional minimal footer */}
      <footer className="py-6 border-t border-border bg-card/30 backdrop-blur-sm mt-auto">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center space-x-1.5">
              <img src="/logo.png" alt="AtChat Logo" className="h-5 w-5" />
              <span className="text-sm text-muted-foreground">
                © {new Date().getFullYear()} AtChat. All rights reserved.
              </span>
            </div>

            <div className="flex items-center space-x-6">
              <Link
                to="/settings#privacy"
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Privacy Policy
              </Link>
              <Link
                to="/terms"
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Terms of Service
              </Link>
              <a
                href="mailto:support@atchat.com"
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Contact Support
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default SignUpPage;
