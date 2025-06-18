/**
 * GuestWelcomeScreen Component
 *
 * Used in: frontend/components/ChatInterface.tsx
 * Purpose: Professional welcome screen for guest users showcasing AI chat features
 * and pricing. Only displayed on / and /chat pages for unauthenticated users.
 */

import React from "react";
import { motion } from "framer-motion";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import {
  MessageSquare,
  Brain,
  Zap,
  Globe,
  Shield,
  Sparkles,
  Check,
  Crown,
  Building2,
  Mail,
  ArrowRight,
  Star,
} from "lucide-react";

interface GuestWelcomeScreenProps {
  onSignUp: () => void;
  onLogin: () => void;
}

export default function GuestWelcomeScreen({
  onSignUp,
  onLogin,
}: GuestWelcomeScreenProps) {
  return (
    <div className="min-h-screen pt-6">
      {/* Floating Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-primary/5 rounded-full blur-xl animate-pulse" />
        <div className="absolute top-40 right-20 w-24 h-24 bg-primary/10 rounded-full blur-lg animate-pulse delay-1000" />
        <div className="absolute bottom-40 left-1/4 w-40 h-40 bg-primary/5 rounded-full blur-2xl animate-pulse delay-2000" />
      </div>

      <div className="relative container mx-auto px-4 pb-12 max-w-7xl">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Sparkles className="h-4 w-4" />
            Next-Generation AI Chat Platform
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
            <span className="bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
              Welcome to
            </span>
            <br />
            <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-foreground">
              AV<span className="text-primary">Chat</span>
            </span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-8 leading-relaxed">
            Experience intelligent conversations with advanced AI models. Fast,
            secure, and designed for the future of communication.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              onClick={onSignUp}
              size="lg"
              className="bg-primary text-primary-foreground px-8 py-5 text-lg font-medium group"
            >
              Start Free
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button
              onClick={onLogin}
              size="lg"
              className="px-8 py-5 text-primary dark:text-foreground text-lg border-[1px] border-primary/20 bg-background hover:bg-border/5 font-medium"
            >
              Sign In
            </Button>
          </div>
        </motion.div>

        {/* Features Showcase */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mb-20"
        >
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Why Choose AV<span className="text-primary">Chat</span> ?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Discover the features that make AVChat the preferred choice for
              intelligent conversations
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className={cn(
                "p-6 rounded-xl border border-border/50 text-center group hover:border-primary/30 hover:shadow-lg transition-all duration-300",
                "bg-card/50 backdrop-blur-sm"
              )}
            >
              <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Zap className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Lightning Fast</h3>
              <p className="text-sm text-muted-foreground">
                Optimized AI responses with minimal latency for seamless
                conversations
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className={cn(
                "p-6 rounded-xl border border-border/50 text-center group hover:border-primary/30 hover:shadow-lg transition-all duration-300",
                "bg-card/50 backdrop-blur-sm"
              )}
            >
              <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Brain className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Smart AI</h3>
              <p className="text-sm text-muted-foreground">
                Access to cutting-edge language models for intelligent responses
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className={cn(
                "p-6 rounded-xl border border-border/50 text-center group hover:border-primary/30 hover:shadow-lg transition-all duration-300",
                "bg-card/50 backdrop-blur-sm"
              )}
            >
              <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Globe className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Real-time Sync</h3>
              <p className="text-sm text-muted-foreground">
                Seamless conversation sync across all your devices instantly
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className={cn(
                "p-6 rounded-xl border border-border/50 text-center group hover:border-primary/30 hover:shadow-lg transition-all duration-300",
                "bg-card/50 backdrop-blur-sm"
              )}
            >
              <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Shield className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Secure & Private</h3>
              <p className="text-sm text-muted-foreground">
                Your conversations are protected with enterprise-grade security
              </p>
            </motion.div>
          </div>
        </motion.div>

        {/* Pricing Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mb-20"
        >
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Choose the perfect plan for your AI conversation needs
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Starter Plan */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="p-8 rounded-2xl border border-border/50 relative bg-card/50 backdrop-blur-sm hover:border-primary/30 transition-all duration-300"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Starter</h3>
                  <p className="text-sm text-muted-foreground">
                    Perfect for trying out
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <span className="text-4xl font-bold">$0</span>
                <span className="text-muted-foreground text-lg">/month</span>
              </div>

              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                    <Check className="h-3 w-3 text-primary" />
                  </div>
                  <span className="text-sm">200 free model prompts</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                    <Check className="h-3 w-3 text-primary" />
                  </div>
                  <span className="text-sm">
                    20 premium credits (Chat + Image Gen)
                  </span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                    <Check className="h-3 w-3 text-primary" />
                  </div>
                  <span className="text-sm">Basic conversation history</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                    <Check className="h-3 w-3 text-primary" />
                  </div>
                  <span className="text-sm">Standard support</span>
                </li>
              </ul>

              <Button
                onClick={onSignUp}
                className="w-full py-3 bg-primary/85 font-medium"
              >
                Get Started Free
              </Button>
            </motion.div>

            {/* Pro Plan - Popular */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="p-8 rounded-2xl border-2 border-primary/50 relative bg-card/70 backdrop-blur-sm hover:border-primary/60 transition-all duration-300 scale-105"
            >
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <div className="bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  Most Popular
                </div>
              </div>

              <div className="flex items-center gap-3 mb-6 mt-4">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Crown className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Pro</h3>
                  <p className="text-sm text-muted-foreground">
                    For power users
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <span className="text-4xl font-bold">$10</span>
                <span className="text-muted-foreground text-lg">/month</span>
              </div>

              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                    <Check className="h-3 w-3 text-primary" />
                  </div>
                  <span className="text-sm">1,500 free model prompts</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                    <Check className="h-3 w-3 text-primary" />
                  </div>
                  <span className="text-sm">
                    600 premium credits (Chat + Image Gen)
                  </span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                    <Check className="h-3 w-3 text-primary" />
                  </div>
                  <span className="text-sm">30 super premium credits</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                    <Check className="h-3 w-3 text-primary" />
                  </div>
                  <span className="text-sm">Priority response speed</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                    <Check className="h-3 w-3 text-primary" />
                  </div>
                  <span className="text-sm">Advanced conversation history</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                    <Check className="h-3 w-3 text-primary" />
                  </div>
                  <span className="text-sm">Priority support</span>
                </li>
              </ul>

              <Button
                onClick={onSignUp}
                className="w-full py-3 font-medium bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                Upgrade to Pro
              </Button>
            </motion.div>

            {/* Enterprise Plan */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
              className="p-8 rounded-2xl border border-border/50 relative bg-card/50 backdrop-blur-sm hover:border-primary/30 transition-all duration-300"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Enterprise</h3>
                  <p className="text-sm text-muted-foreground">
                    For teams & businesses
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <span className="text-4xl font-bold">Custom</span>
                <span className="text-muted-foreground text-lg"> pricing</span>
              </div>

              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                    <Check className="h-3 w-3 text-primary" />
                  </div>
                  <span className="text-sm">Unlimited model access</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                    <Check className="h-3 w-3 text-primary" />
                  </div>
                  <span className="text-sm">Custom API integration</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                    <Check className="h-3 w-3 text-primary" />
                  </div>
                  <span className="text-sm">Dedicated account manager</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                    <Check className="h-3 w-3 text-primary" />
                  </div>
                  <span className="text-sm">Advanced security</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                    <Check className="h-3 w-3 text-primary" />
                  </div>
                  <span className="text-sm">Custom model fine-tuning</span>
                </li>
              </ul>

              <Button
                className="w-full py-3 font-medium bg-primary/85"
                onClick={() => window.open("mailto:connect@ayush-sharma.in")}
              >
                <Mail className="h-4 w-4 mr-2" />
                Contact Sales
              </Button>
            </motion.div>
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="text-center"
        >
          <div className="p-12 rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/5 via-background to-primary/5 backdrop-blur-sm">
            <div className="max-w-2xl mx-auto">
              <h3 className="text-3xl md:text-4xl font-bold mb-6">
                Ready to Experience the Future?
              </h3>
              <p className="text-muted-foreground mb-8 text-lg leading-relaxed">
                Join thousands of users already experiencing intelligent
                conversations with AVChat. Start your journey with AI-powered
                communication today.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  onClick={onSignUp}
                  size="lg"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-5 text-lg font-medium group"
                >
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button
                  onClick={onLogin}
                  size="lg"
                  className="px-8 py-5 text-lg border-[1px] text-primary dark:text-foreground border-primary/20 bg-background hover:bg-border/35 font-medium"
                >
                  Sign In
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
