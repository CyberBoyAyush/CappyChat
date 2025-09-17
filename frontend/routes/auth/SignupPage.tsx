/**
 * SignupPage Component
 *
 * Purpose: Dedicated signup page for better UX and faster authentication
 * Features: Clean design, loading states, OAuth integration
 */

"use client";

import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import { Label } from "@/frontend/components/ui/label";
import { useAuth } from "@/frontend/contexts/AuthContext";
import { GoogleIcon, GitHubIcon } from "@/frontend/components/ui/icons";
import AuthLoadingScreen from "@/frontend/components/auth/AuthLoadingScreen";
import ThemeToggleButton from "@/frontend/components/ui/ThemeComponents";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  AlertCircle,
  Loader2,
  ArrowLeft,
} from "lucide-react";

const SignupPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<"google" | "github" | null>(
    null
  );

  const { register, loginWithGoogle, loginWithGitHub, isAuthenticated } =
    useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const redirectPath = searchParams.get("redirect") || "/chat";
      navigate(redirectPath, { replace: true });
    }
  }, [isAuthenticated, navigate, searchParams]);

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      if (!email || !password || !name) {
        setError("Please fill in all fields.");
        return;
      }

      if (password.length < 8) {
        setError("Password must be at least 8 characters long.");
        return;
      }

      await register(email, password, name);

      // Redirect will happen automatically via useEffect
    } catch (err: any) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setError("");
    setOauthLoading("google");

    try {
      // Store redirect path for after OAuth
      const redirectPath = searchParams.get("redirect");
      if (redirectPath) {
        sessionStorage.setItem("auth_redirect", redirectPath);
      }

      // Immediate OAuth redirect - no artificial delay
      await loginWithGoogle();
    } catch (err: any) {
      setOauthLoading(null);
      setError(
        err.message || "Google authentication failed. Please try again."
      );
    }
  };

  const handleGitHubAuth = async () => {
    setError("");
    setOauthLoading("github");

    try {
      // Store redirect path for after OAuth
      const redirectPath = searchParams.get("redirect");
      if (redirectPath) {
        sessionStorage.setItem("auth_redirect", redirectPath);
      }

      // Immediate OAuth redirect - no artificial delay
      await loginWithGitHub();
    } catch (err: any) {
      setOauthLoading(null);
      setError(
        err.message || "GitHub authentication failed. Please try again."
      );
    }
  };

  return (
    <>
      {/* Loading Screens */}
      <AnimatePresence>
        {oauthLoading && (
          <AuthLoadingScreen
            type="oauth"
            provider={oauthLoading}
            message={
              oauthLoading === "google"
                ? "Connecting with Google..."
                : "Connecting with GitHub..."
            }
          />
        )}
        {isLoading && !oauthLoading && (
          <AuthLoadingScreen
            type="signup"
            provider="email"
            message="Creating your account..."
          />
        )}
      </AnimatePresence>

      <div className="min-h-screen bg-background">
        {/* Floating Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-32 h-32 bg-primary/5 rounded-full blur-xl animate-pulse" />
          <div className="absolute top-40 right-20 w-24 h-24 bg-primary/10 rounded-full blur-lg animate-pulse delay-1000" />
          <div className="absolute bottom-40 left-1/4 w-40 h-40 bg-primary/5 rounded-full blur-2xl animate-pulse delay-2000" />
        </div>

        <div className="mb-8 border-b border-border">
          <div className="flex items-center justify-between pb-2 px-4 max-w-7xl mx-auto mt-4">
            <Button
              onClick={() => navigate(-1)}
              variant="ghost"
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>

            <ThemeToggleButton variant="inline" />
          </div>
        </div>

        <div className="flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md relative z-10"
          >
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold mb-2">Create account</h1>
              <p className="text-muted-foreground">
                Join CappyChat and start your AI journey
              </p>
            </div>

            {/* Signup Form */}
            <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-8 shadow-xl">
              {/* OAuth Buttons */}
              <div className="space-y-3 mb-6">
                <Button
                  onClick={handleGoogleAuth}
                  variant="outline"
                  className="w-full h-12 text-sm font-medium bg-gradient-to-r from-background to-muted/20 hover:from-muted/30 hover:to-muted/40 border-border/50 hover:border-primary/30 transition-all duration-300"
                  disabled={isLoading || oauthLoading !== null}
                >
                  {oauthLoading === "google" ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <GoogleIcon className="w-5 h-5 mr-3" />
                      Continue with Google
                    </>
                  )}
                </Button>

                <Button
                  onClick={handleGitHubAuth}
                  variant="outline"
                  className="w-full h-12 text-sm font-medium bg-gradient-to-r from-background to-muted/20 hover:from-muted/30 hover:to-muted/40 border-border/50 hover:border-primary/30 transition-all duration-300"
                  disabled={isLoading || oauthLoading !== null}
                >
                  {oauthLoading === "github" ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <GitHubIcon className="w-5 h-5 mr-3" />
                      Continue with GitHub
                    </>
                  )}
                </Button>
              </div>

              {/* Divider */}
              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border/50" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-4 py-1 text-muted-foreground font-medium rounded-full border border-border/30">
                    Or continue with email
                  </span>
                </div>
              </div>

              {/* Email Form */}
              <form onSubmit={handleEmailSignup} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium">
                    Full Name
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="Enter your full name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="pl-10 h-12 bg-background/50 border-border/50"
                      disabled={isLoading || oauthLoading !== null}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="your.email@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 h-12 bg-background/50 border-border/50"
                      disabled={isLoading || oauthLoading !== null}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-12 h-12 bg-background/50 border-border/50"
                      disabled={isLoading || oauthLoading !== null}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isLoading || oauthLoading !== null}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Must be at least 8 characters long
                  </p>
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-start gap-3 text-sm text-destructive bg-destructive/10 p-4 rounded-xl border border-destructive/20"
                  >
                    <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>{error}</span>
                  </motion.div>
                )}

                <Button
                  type="submit"
                  className="w-full h-12 text-sm font-semibold bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all duration-300"
                  disabled={isLoading || oauthLoading !== null}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    "Create account"
                  )}
                </Button>
              </form>

              {/* Footer */}
              <div className="text-center mt-6">
                <p className="text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <Link
                    to={`/login${
                      searchParams.get("redirect")
                        ? `?redirect=${encodeURIComponent(
                            searchParams.get("redirect")!
                          )}`
                        : ""
                    }`}
                    className="font-semibold text-primary hover:text-primary/80 transition-colors"
                  >
                    Sign in
                  </Link>
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default SignupPage;
