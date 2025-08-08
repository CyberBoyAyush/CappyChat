/**
 * AuthLoadingScreen Component
 *
 * Purpose: Beautiful loading screen for authentication processes
 * Used during login, signup, and OAuth authentication flows
 * Features smooth animations and theme-matching design
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Loader2, Shield, Zap, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AuthLoadingScreenProps {
  type?: 'login' | 'signup' | 'oauth' | 'callback';
  provider?: 'google' | 'github' | 'email';
  message?: string;
  className?: string;
}

const AuthLoadingScreen: React.FC<AuthLoadingScreenProps> = ({
  type = 'login',
  provider = 'email',
  message,
  className
}) => {
  // Dynamic messages based on type and provider
  const getLoadingMessage = () => {
    if (message) return message;
    
    switch (type) {
      case 'oauth':
        return provider === 'google' 
          ? 'Connecting with Google...' 
          : 'Connecting with GitHub...';
      case 'callback':
        return 'Completing authentication...';
      case 'signup':
        return 'Creating your account...';
      case 'login':
      default:
        return 'Signing you in...';
    }
  };

  const getSubMessage = () => {
    switch (type) {
      case 'oauth':
        return 'You\'ll be redirected to complete the process';
      case 'callback':
        return 'Almost done, setting up your session';
      case 'signup':
        return 'Setting up your workspace';
      case 'login':
      default:
        return 'Verifying your credentials';
    }
  };

  // Animation variants
  const containerVariants = {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm",
        className
      )}
    >
      {/* Background overlay with subtle pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-muted/20" />
      
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          className="absolute top-1/4 left-1/4 w-32 h-32 rounded-full bg-primary/5 blur-2xl"
          animate={{ 
            x: [0, 20, 0], 
            y: [0, -20, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{ 
            duration: 4, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
        />
        <motion.div 
          className="absolute bottom-1/4 right-1/4 w-24 h-24 rounded-full bg-primary/3 blur-xl"
          animate={{ 
            x: [0, -15, 0], 
            y: [0, 15, 0],
            scale: [1, 0.9, 1]
          }}
          transition={{ 
            duration: 3, 
            repeat: Infinity, 
            ease: "easeInOut",
            delay: 1
          }}
        />
      </div>

      {/* Main loading content */}
      <div className="relative z-10 text-center space-y-6 max-w-md mx-auto px-6">
        {/* Loading icon with pulse animation */}
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="flex items-center justify-center"
        >
          <div className="relative">
            {/* Main spinner */}
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
            
            {/* Outer ring */}
            <div className="absolute inset-0 w-12 h-12 border-2 border-primary/20 rounded-full animate-pulse" />
            
            {/* Security shield for OAuth */}
            {type === 'oauth' && (
              <motion.div
                className="absolute -top-1 -right-1"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5 }}
              >
                <Shield className="w-5 h-5 text-green-500" />
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Loading messages */}
        <div className="space-y-2">
          <motion.h3
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg font-semibold text-foreground"
          >
            {getLoadingMessage()}
          </motion.h3>
          
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-sm text-muted-foreground"
          >
            {getSubMessage()}
          </motion.p>
        </div>

        {/* Progress bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="w-full max-w-xs mx-auto"
        >
          <div className="h-1 bg-muted rounded-full overflow-hidden">
            <motion.div
              animate={{ width: ["0%", "100%"] }}
              transition={{ duration: 3, ease: "easeInOut", repeat: Infinity }}
              className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full"
            />
          </div>
        </motion.div>

        {/* Feature highlights for longer loading (OAuth) */}
        {type === 'oauth' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
            className="grid grid-cols-2 gap-4 pt-4"
          >
            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              <Zap className="w-3 h-3 text-primary" />
              <span>Secure</span>
            </div>
            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              <CheckCircle className="w-3 h-3 text-green-500" />
              <span>Encrypted</span>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default AuthLoadingScreen;
