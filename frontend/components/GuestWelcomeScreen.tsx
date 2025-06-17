/**
 * GuestWelcomeScreen Component
 *
 * Used in: frontend/components/ChatInterface.tsx
 * Purpose: Welcome screen specifically for guest users showing features showcase
 * and pricing section. Only displayed on / and /chat pages for unauthenticated users.
 */

import React from "react";
import { motion } from "framer-motion";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import { 
  Zap, 
  RefreshCw, 
  FileImage, 
  Check, 
  Sparkles,
  Crown,
  Building2,
  Mail
} from "lucide-react";

interface GuestWelcomeScreenProps {
  isDarkTheme: boolean;
  onSignUp: () => void;
  onLogin: () => void;
}

export default function GuestWelcomeScreen({
  isDarkTheme,
  onSignUp,
  onLogin,
}: GuestWelcomeScreenProps) {
  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-12"
      >
        <h1 className="text-3xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
          Welcome to AVChat
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
          Experience the next generation of AI conversation with cutting-edge features and lightning-fast responses
        </p>
      </motion.div>

      {/* Features Showcase */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="mb-16"
      >
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
          Why Choose AVChat?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className={cn(
              "p-6 rounded-2xl border border-border/50 text-center group hover:border-primary/50 transition-all duration-300",
              isDarkTheme ? "bg-card/30 hover:bg-card/50" : "bg-card/50 hover:bg-card/70"
            )}
          >
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Zap className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Fast 4x faster</h3>
            <p className="text-muted-foreground">
              Lightning-fast responses powered by optimized AI models and advanced caching
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className={cn(
              "p-6 rounded-2xl border border-border/50 text-center group hover:border-primary/50 transition-all duration-300",
              isDarkTheme ? "bg-card/30 hover:bg-card/50" : "bg-card/50 hover:bg-card/70"
            )}
          >
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <RefreshCw className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Real-time sync</h3>
            <p className="text-muted-foreground">
              Seamless conversation sync across all your devices with instant updates
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className={cn(
              "p-6 rounded-2xl border border-border/50 text-center group hover:border-primary/50 transition-all duration-300",
              isDarkTheme ? "bg-card/30 hover:bg-card/50" : "bg-card/50 hover:bg-card/70"
            )}
          >
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <FileImage className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Multi-modal support</h3>
            <p className="text-muted-foreground">
              Text, images, files, and voice - all in one powerful interface
            </p>
          </motion.div>
        </div>
      </motion.div>

      {/* Pricing Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6 }}
        className="mb-12"
      >
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Choose the plan that works for your needs, with access to cutting-edge AI models
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {/* Starter Plan */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            className={cn(
              "p-6 rounded-2xl border border-border/50 relative",
              isDarkTheme ? "bg-card/30" : "bg-card/50"
            )}
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-orange-500" />
              </div>
              <span className="text-sm font-medium text-orange-500">Free</span>
            </div>
            <h3 className="text-2xl font-bold mb-2">Starter</h3>
            <p className="text-muted-foreground mb-4">Perfect for trying out AVChat</p>
            <div className="mb-6">
              <span className="text-3xl font-bold">$0</span>
              <span className="text-muted-foreground">/month</span>
            </div>
            <ul className="space-y-3 mb-6">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span className="text-sm">200 prompts per month with free models</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span className="text-sm">20 premium model credits</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span className="text-sm">2 super premium model credits</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span className="text-sm">Basic conversation history</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span className="text-sm">Standard response speed</span>
              </li>
            </ul>
            <Button 
              onClick={onSignUp}
              variant="outline" 
              className="w-full"
            >
              Get Started Free
            </Button>
          </motion.div>

          {/* Pro Plan - Popular */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            className={cn(
              "p-6 rounded-2xl border-2 border-primary/50 relative",
              isDarkTheme ? "bg-card/50" : "bg-card/70"
            )}
          >
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <span className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                Popular
              </span>
            </div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <Crown className="h-4 w-4 text-primary" />
              </div>
              <span className="text-sm font-medium text-primary">Premium</span>
            </div>
            <h3 className="text-2xl font-bold mb-2">Pro</h3>
            <p className="text-muted-foreground mb-4">For power users who need more</p>
            <div className="mb-6">
              <span className="text-3xl font-bold">$10</span>
              <span className="text-muted-foreground">/month</span>
            </div>
            <ul className="space-y-3 mb-6">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span className="text-sm">1500 prompts with free models</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span className="text-sm">600 premium model credits</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span className="text-sm">30 super premium model credits</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span className="text-sm">Priority response speed</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span className="text-sm">Advanced conversation history</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span className="text-sm">Priority support</span>
              </li>
            </ul>
            <Button 
              onClick={onSignUp}
              className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
            >
              Upgrade to Pro
            </Button>
          </motion.div>

          {/* Enterprise Plan */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.9 }}
            className={cn(
              "p-6 rounded-2xl border border-border/50 relative",
              isDarkTheme ? "bg-card/30" : "bg-card/50"
            )}
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                <Building2 className="h-4 w-4 text-blue-500" />
              </div>
              <span className="text-sm font-medium text-blue-500">Enterprise</span>
            </div>
            <h3 className="text-2xl font-bold mb-2">Organization</h3>
            <p className="text-muted-foreground mb-4">For teams and businesses</p>
            <div className="mb-6">
              <span className="text-3xl font-bold">Custom</span>
              <span className="text-muted-foreground"> quote</span>
            </div>
            <ul className="space-y-3 mb-6">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span className="text-sm">Unlimited access to all models</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span className="text-sm">Custom API integration</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span className="text-sm">Dedicated account manager</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span className="text-sm">Advanced security features</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span className="text-sm">Custom model fine-tuning</span>
              </li>
            </ul>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => window.open('mailto:connect@ayush-sharma.in?subject=Regarding AVChat Pro Account')}
            >
              <Mail className="h-4 w-4 mr-2" />
              Contact CEO
            </Button>
          </motion.div>
        </div>
      </motion.div>

      {/* CTA Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1.0 }}
        className="text-center"
      >
        <div className={cn(
          "p-8 rounded-2xl border border-border/50",
          isDarkTheme ? "bg-primary/5 border-primary/20" : "bg-primary/5 border-primary/20"
        )}>
          <h3 className="text-2xl font-bold mb-4">Ready to get started?</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Join thousands of users already experiencing the future of AI conversation
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={onSignUp}
              size="lg"
              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
            >
              Start Free Trial
            </Button>
            <Button
              onClick={onLogin}
              variant="outline"
              size="lg"
            >
              Sign In
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
