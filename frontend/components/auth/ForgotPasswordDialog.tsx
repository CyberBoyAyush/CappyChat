/**
 * Forgot Password Dialog Component
 *
 * Beautiful themed dialog for password recovery using Appwrite.
 * Features modern UI with validation, loading states, and success feedback.
 */

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/frontend/components/ui/dialog";
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import { useAuth } from "@/frontend/contexts/AuthContext";
import {
  Mail,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
  Send,
  Clock,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ForgotPasswordDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ForgotPasswordDialog: React.FC<ForgotPasswordDialogProps> = ({
  isOpen,
  onOpenChange,
}) => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const { sendPasswordRecovery } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email) {
      setError("Please enter your email address.");
      return;
    }

    if (!email.includes("@") || !email.includes(".")) {
      setError("Please enter a valid email address.");
      return;
    }

    setIsLoading(true);

    try {
      await sendPasswordRecovery(email);
      setIsSuccess(true);
    } catch (err: any) {
      setError(err.message || "Failed to send recovery email. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setEmail("");
    setError("");
    setIsSuccess(false);
    setIsLoading(false);
    onOpenChange(false);
  };

  const handleBackToLogin = () => {
    handleClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-card border-border">
        <AnimatePresence mode="wait">
          {!isSuccess ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 px-6 py-6 text-center border-b border-border">
                <div className="flex items-center justify-center w-12 h-12 mx-auto mb-3 bg-primary/10 rounded-full">
                  <Mail className="h-6 w-6 text-primary" />
                </div>
                <DialogTitle className="text-xl font-semibold text-foreground">
                  Forgot Password?
                </DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground mt-1">
                  No worries! Enter your email and we'll send you a reset link.
                </DialogDescription>
              </div>

              {/* Form Content */}
              <div className="p-6">
                {/* Error Message */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 p-3 bg-destructive/10 border border-destructive/30 rounded-lg flex items-center gap-3"
                  >
                    <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0" />
                    <p className="text-destructive text-sm">{error}</p>
                  </motion.div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label
                      htmlFor="recovery-email"
                      className="text-sm font-medium text-foreground block mb-2"
                    >
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="recovery-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your.email@example.com"
                        className="pl-10 h-11"
                        required
                        disabled={isLoading}
                        autoFocus
                      />
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-3 pt-2">
                    <Button
                      type="submit"
                      className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <div className="flex items-center space-x-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground"></div>
                          <span>Sending...</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <Send className="h-4 w-4" />
                          <span>Send Reset Link</span>
                        </div>
                      )}
                    </Button>

                    <Button
                      type="button"
                      variant="ghost"
                      onClick={handleBackToLogin}
                      disabled={isLoading}
                      className="w-full h-11 text-muted-foreground hover:text-foreground"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back to Login
                    </Button>
                  </div>
                </form>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="success"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* Success Header */}
              <div className="bg-gradient-to-r from-emerald-500/5 via-emerald-500/10 to-emerald-500/5 px-6 py-6 text-center border-b border-border">
                <div className="flex items-center justify-center w-12 h-12 mx-auto mb-3 bg-emerald-500/10 rounded-full">
                  <CheckCircle className="h-6 w-6 text-emerald-500" />
                </div>
                <DialogTitle className="text-xl font-semibold text-foreground">
                  Check Your Email
                </DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground mt-1">
                  We've sent a password reset link to your email address.
                </DialogDescription>
              </div>

              {/* Success Content */}
              <div className="p-6">
                <div className="text-center space-y-4">
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-2">
                      <Clock className="h-4 w-4" />
                      <span>Email sent to:</span>
                    </div>
                    <p className="font-medium text-foreground break-all">{email}</p>
                  </div>

                  <div className="text-sm text-muted-foreground space-y-2">
                    <p>Click the link in the email to reset your password.</p>
                    <p>If you don't see the email, check your spam folder.</p>
                  </div>

                  <Button
                    onClick={handleBackToLogin}
                    className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Login
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

export default ForgotPasswordDialog;
