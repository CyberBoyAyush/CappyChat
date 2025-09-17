/**
 * Authentication Dialog Component
 * 
 * Modal dialogs for login and signup that appear when guest users hit limits
 * or try to access premium features. Matches the overall theme.
 */

"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/frontend/components/ui/dialog";
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import { Label } from "@/frontend/components/ui/label";
import { useAuth } from "@/frontend/contexts/AuthContext";
import { GoogleIcon, GitHubIcon } from "@/frontend/components/ui/icons";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AuthLoadingScreen from "./AuthLoadingScreen";

interface AuthDialogProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: "login" | "signup";
  title?: string;
  description?: string;
}

const AuthDialog: React.FC<AuthDialogProps> = ({
  isOpen,
  onClose,
  initialMode = "login",
  title,
  description,
}) => {
  const [mode, setMode] = useState<"login" | "signup">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<'google' | 'github' | null>(null);

  const { login, register, loginWithGoogle, loginWithGitHub } = useAuth();

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setName("");
    setError("");
    setShowPassword(false);
  };

  // Sync mode with initialMode when dialog opens
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      resetForm();
    }
  }, [isOpen, initialMode]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      if (mode === "login") {
        if (!email || !password) {
          setError("Please fill in all fields.");
          return;
        }
        await login(email, password);
      } else {
        if (!email || !password || !name) {
          setError("Please fill in all fields.");
          return;
        }
        await register(email, password, name);
      }

      // Close dialog immediately after successful authentication
      onClose();

      // Reset form state
      resetForm();
    } catch (err: any) {
      setError(
        err.message ||
          `${
            mode === "login" ? "Login" : "Registration"
          } failed. Please try again.`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setError("");
    setOauthLoading('google');

    try {
      // Small delay to show loading state
      await new Promise(resolve => setTimeout(resolve, 500));

      // Start OAuth flow
      await loginWithGoogle();

      // Keep loading state until redirect happens
      // The loading screen will be shown until the page redirects
    } catch (err: any) {
      setOauthLoading(null);
      setError(
        err.message || "Google authentication failed. Please try again."
      );
    }
  };

  const handleGitHubAuth = async () => {
    setError("");
    setOauthLoading('github');

    try {
      // Small delay to show loading state
      await new Promise(resolve => setTimeout(resolve, 500));

      // Start OAuth flow
      await loginWithGitHub();

      // Keep loading state until redirect happens
      // The loading screen will be shown until the page redirects
    } catch (err: any) {
      setOauthLoading(null);
      setError(
        err.message || "GitHub authentication failed. Please try again."
      );
    }
  };

  const switchMode = () => {
    setMode(mode === "login" ? "signup" : "login");
    resetForm();
  };

  return (
    <>
      {/* Loading Screens */}
      <AnimatePresence>
        {oauthLoading && (
          <AuthLoadingScreen
            type="oauth"
            provider={oauthLoading}
            message={oauthLoading === 'google' ? 'Connecting with Google...' : 'Connecting with GitHub...'}
          />
        )}
        {isLoading && !oauthLoading && (
          <AuthLoadingScreen
            type={mode}
            provider="email"
            message={mode === 'login' ? 'Signing you in...' : 'Creating your account...'}
          />
        )}
      </AnimatePresence>

      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-xl md:max-w-3xl lg:max-w-5xl p-0 gap-0 overflow-y-auto border-0 bg-gradient-to-br from-background via-background to-muted max-h-[90vh]">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-32 h-32 rounded-full bg-primary/5 blur-2xl animate-pulse" />
          <div className="absolute bottom-0 right-1/4 w-24 h-24 rounded-full bg-primary/3 blur-xl animate-pulse delay-1000" />
          <div className="absolute top-1/2 left-1/2 w-16 h-16 rounded-full bg-primary/4 blur-lg animate-pulse delay-500" />
        </div>

        {/* Two-column layout container */}
        <div className="flex flex-col md:flex-row w-full">
          {/* Left column - Logo/Image (hidden on mobile) */}
          <div className="hidden md:flex md:w-5/12 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent flex-col items-center justify-center p-8 border-r border-border/30">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="text-center space-y-6"
            >
              <div className="mx-auto w-32 h-32 bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl flex items-center justify-center mb-4 shadow-xl">
                <motion.div
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="w-20 h-20"
                >
                  <img src="/logo.png" alt="CappyChat" className="w-full h-full" />
                </motion.div>
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                  CappyChat
                </h1>
                <p className="text-muted-foreground mt-3 leading-relaxed">
                  Your personal AI assistant for seamless conversations
                </p>
              </div>

              {/* Trust indicators - desktop */}
              <div className="hidden md:flex flex-col items-center justify-center gap-4 mt-8 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span>Secure & encrypted</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse delay-300" />
                  <span>Privacy first</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right column - Form content */}
          <div className="flex-1 flex flex-col h-fit py-5">
            {/* Main form content area with proper padding */}
            <div className="relative px-4 sm:px-6 pt-5 space-y-5 overflow-y-auto md:overflow-visible">
              {/* OAuth Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="space-y-3"
              >
                <Button
                  onClick={handleGoogleAuth}
                  variant="outline"
                  className="w-full h-11 sm:h-12 text-sm font-medium bg-gradient-to-r from-background to-muted/20 hover:from-muted/30 hover:to-muted/40 border-border/50 hover:border-primary/30 transition-all duration-300 group relative overflow-hidden"
                  disabled={isLoading || oauthLoading !== null}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                  {oauthLoading === 'google' ? (
                    <>
                      <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3 animate-spin relative z-10" />
                      <span className="relative z-10">Connecting...</span>
                    </>
                  ) : (
                    <>
                      <GoogleIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3 relative z-10" />
                      <span className="relative z-10">Continue with Google</span>
                    </>
                  )}
                </Button>

                <Button
                  onClick={handleGitHubAuth}
                  variant="outline"
                  className="w-full h-11 sm:h-12 text-sm font-medium bg-gradient-to-r from-background to-muted/20 hover:from-muted/30 hover:to-muted/40 border-border/50 hover:border-primary/30 transition-all duration-300 group relative overflow-hidden"
                  disabled={isLoading || oauthLoading !== null}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                  {oauthLoading === 'github' ? (
                    <>
                      <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3 animate-spin relative z-10" />
                      <span className="relative z-10">Connecting...</span>
                    </>
                  ) : (
                    <>
                      <GitHubIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3 relative z-10" />
                      <span className="relative z-10">Continue with GitHub</span>
                    </>
                  )}
                </Button>
              </motion.div>

              {/* Elegant divider */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="relative"
              >
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gradient-to-r from-transparent via-border to-transparent" />
                </div>
                <div className="relative flex justify-center text-xs uppercase tracking-wider">
                  <span className="bg-background px-4 py-1 text-muted-foreground font-medium rounded-full border border-border/30">
                    Or continue with email
                  </span>
                </div>
              </motion.div>

              {/* Email Form */}
              <motion.form
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                onSubmit={handleEmailAuth}
                className="space-y-5"
              >
                <AnimatePresence mode="wait">
                  {mode === "signup" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, y: -10 }}
                      animate={{ opacity: 1, height: "auto", y: 0 }}
                      exit={{ opacity: 0, height: 0, y: -10 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="space-y-2"
                    >
                      <Label
                        htmlFor="name"
                        className="text-sm font-medium text-foreground/90"
                      >
                        Full Name
                      </Label>
                      <div className="relative group">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input
                          id="name"
                          type="text"
                          placeholder="Enter your full name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="pl-10 h-12 bg-gradient-to-r from-background rounded-lg to-muted/10 border-border/50  transition-all duration-300"
                          disabled={isLoading || oauthLoading !== null}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="space-y-2">
                  <Label
                    htmlFor="email"
                    className="text-sm font-medium text-foreground/90"
                  >
                    Email Address
                  </Label>
                  <div className="relative group">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="your.email@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 h-12 bg-gradient-to-r from-background rounded-lg to-muted/10 border-border/50  transition-all duration-300"
                      disabled={isLoading || oauthLoading !== null}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="password"
                    className="text-sm font-medium text-foreground/90"
                  >
                    Password
                  </Label>
                  <div className="relative group">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-12 h-12 bg-gradient-to-r from-background rounded-lg to-muted/10 border-border/50  transition-all duration-300"
                      disabled={isLoading || oauthLoading !== null}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-muted/50 rounded-md transition-colors"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isLoading || oauthLoading !== null}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
                      )}
                    </Button>
                  </div>
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className="flex items-start gap-3 text-sm text-destructive bg-gradient-to-r from-destructive/10 to-destructive/5 p-4 rounded-xl border border-destructive/20"
                  >
                    <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span className="leading-relaxed">{error}</span>
                  </motion.div>
                )}

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    type="submit"
                    className="w-full h-12 text-sm font-semibold bg-gradient-to-r from-primary via-primary/95 to-primary/90 hover:from-primary/90 hover:via-primary hover:to-primary shadow-lg hover:shadow-xl hover:shadow-primary/25 transition-all duration-300 relative overflow-hidden group"
                    disabled={isLoading || oauthLoading !== null}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin relative z-10" />
                        <span className="relative z-10">
                          {mode === "login"
                            ? "Signing in..."
                            : "Creating account..."}
                        </span>
                      </>
                    ) : (
                      <span className="relative z-10">
                        {mode === "login" ? "Sign in" : "Create account"}
                      </span>
                    )}
                  </Button>
                </motion.div>
              </motion.form>

              {/* Footer */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-center"
              >
                <div className="flex items-center justify-center gap-2 text-sm">
                  <span className="text-muted-foreground">
                    {mode === "login"
                      ? "Don't have an account?"
                      : "Already have an account?"}
                  </span>
                  <Button
                    variant="link"
                    className="p-0 h-auto text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
                    onClick={switchMode}
                    disabled={isLoading || oauthLoading !== null}
                  >
                    {mode === "login" ? "Sign up" : "Sign in"}
                  </Button>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
};

export default AuthDialog;

