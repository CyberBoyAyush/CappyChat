/**
 * GuestWelcomeScreen Component
 *
 * Used in: frontend/components/ChatInterface.tsx
 * Purpose: Professional welcome screen for guest users showcasing AI chat features
 * and pricing. Only displayed on / and /chat pages for unauthenticated users.
 */

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useOutletContext } from "react-router-dom";
import { useIsMobile } from "@/hooks/useMobileDetection";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { AnimatedPrice } from "./ui/animated-price";
import CompareDemo from "./compare-drag-demo";
import ChatInputField from "./ChatInputField";
import BentoGrid from "./ui/bento-grid";
import DemoChat from "./ui/demo-chat";
import FeatureGrid from "./FeatureGrid";
import {
  Zap,
  Sparkles,
  Check,
  Crown,
  Building2,
  Mail,
  ArrowRight,
} from "lucide-react";
import CapybaraIcon from "./ui/CapybaraIcon";

interface GuestWelcomeScreenProps {
  onSignUp: () => void;
  onLogin: () => void;
  // Chat input field props for guest messaging
  threadId: string;
  input: string;
  status: any;
  setInput: any;
  append: any;
  setMessages: any;
  stop: any;
  pendingUserMessageRef: any;
  onWebSearchMessage: any;
  submitRef: any;
  messages: any;
  onMessageAppended: any;
}

// Currency type and pricing configuration
type Currency = "USD" | "INR";

const PRICING_CONFIG = {
  USD: {
    free: { original: 0, discounted: 0 },
    pro: { original: 15, discounted: 11.25 },
    currency: "$",
    flag: "🇺🇸",
  },
  INR: {
    free: { original: 0, discounted: 0 },
    pro: { original: 1350, discounted: 999 },
    currency: "₹",
    flag: "🇮🇳",
  },
} as const;

// Currency Toggle Component
const CurrencyToggle = ({
  currency,
  onCurrencyChange,
}: {
  currency: Currency;
  onCurrencyChange: (currency: Currency) => void;
}) => {
  return (
    <div className="flex items-center justify-center mb-12">
      <div className="relative bg-muted/30 backdrop-blur-sm rounded-full p-1 border border-border/50">
        <motion.div
          className="absolute inset-1 bg-background rounded-full shadow-sm border border-border/30"
          initial={false}
          animate={{
            x: currency === "USD" ? 0 : "100%",
          }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 30,
          }}
          style={{
            width: "calc(50% - 2px)",
          }}
        />
        <div className="relative flex">
          <button
            onClick={() => onCurrencyChange("USD")}
            className={cn(
              "flex items-center gap-2 px-6 py-3 rounded-full text-sm font-medium transition-colors duration-200 relative z-10",
              currency === "USD"
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <span className="text-base">🇺🇸</span>
            <span>USD</span>
          </button>
          <button
            onClick={() => onCurrencyChange("INR")}
            className={cn(
              "flex items-center gap-2 px-6 py-3 rounded-full text-sm font-medium transition-colors duration-200 relative z-10",
              currency === "INR"
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <span className="text-base">🇮🇳</span>
            <span>INR</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default function GuestWelcomeScreen({
  onSignUp,
  onLogin,
  threadId,
  input,
  status,
  setInput,
  append,
  setMessages,
  stop,
  pendingUserMessageRef,
  onWebSearchMessage,
  submitRef,
  messages,
  onMessageAppended,
}: GuestWelcomeScreenProps) {
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>("USD");

  // Get sidebar context for proper positioning
  const { sidebarWidth, state: sidebarState } = useOutletContext<{
    sidebarWidth: number;
    state: "open" | "collapsed";
  }>();
  const isMobile = useIsMobile();

  // Auto-detect currency based on locale (optional enhancement)
  useEffect(() => {
    const userLocale = navigator.language || "en-US";
    const detectedCurrency = userLocale.includes("IN") ? "INR" : "USD";
    setSelectedCurrency(detectedCurrency);
  }, []);

  const handleSubscribe = async () => {
    if (!onSignUp) return;

    try {
      // This would integrate with the existing subscription logic
      // For now, we'll just trigger the signup flow
      onSignUp();
    } catch (error) {
      console.error("Subscription error:", error);
    }
  };

  return (
    <div className="min-h-screen pt-6">
      <div className="relative container mx-auto px-4 pb-32 max-w-7xl">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-8"
        >
          <div
            className="relative inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs md:text-sm font-semibold overflow-hidden
                         bg-gradient-to-r from-primary/20 via-primary/15 to-primary/20
                         text-primary hover:text-primary/90
                         shadow-lg shadow-primary/10 hover:shadow-xl hover:shadow-primary/20
                         backdrop-blur-md border border-primary/20 hover:border-primary/30
                         transition-all duration-300 ease-out "
          >
            <Sparkles className="relative z-10 h-4 w-4 animate-pulse" />
            <span className="relative z-10">
              Next-Generation AI Chat Platform
            </span>
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-3 leading-tight">
            <span className="bg-gradient-to-r from-foreground via-foreground dark:via-primary to-foreground bg-clip-text text-transparent">
              CappyChat
            </span>
            <br />
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-8 leading-relaxed">
            Experience intelligent conversations with 20+ advanced AI models.
            Fast, secure, and designed for the future of communication.
          </p>

          <div className="flex flex-row gap-4 justify-center items-center">
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
              className="px-8 py-5 group text-primary dark:text-foreground text-lg border-[1px] border-primary/20 bg-border/15 hover:bg-border/30 font-medium"
            >
              Sign In
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </motion.div>

        {/* Quick Features */}
        <div className="max-w-4xl px-6 mb-9 mx-auto">
          <DemoChat />
        </div>

        {/* Features Showcase - Bento Grid */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="my-20 md:my-28  relative max-w-4xl mx-auto"
        >
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 rounded-3xl -z-10" />

          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-foreground via-foreground to-primary bg-clip-text text-transparent">
              Why Choose Cappy<span className="text-primary">Chat</span>?
            </h2>
            <p className="text-muted-foreground max-w-3xl mx-auto text-lg leading-relaxed">
              Discover the cutting-edge features that make CappyChat the
              preferred choice for intelligent conversations and seamless AI
              interactions
            </p>
          </div>

          <div className="px-7">
            <BentoGrid />
          </div>
        </motion.div>

        {/* Demo Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="mb-20 md:mb-28"
        >
          {/* Theme Demo Section */}
          <div className="text-center mb-5 mt-16">
            <div
              className="relative inline-flex mb-3  items-center gap-2 px-3 py-1.5 rounded-full text-xs  font-semibold overflow-hidden
                         bg-gradient-to-r from-primary/20 via-primary/15 to-primary/20
                         text-primary hover:text-primary/90
                         shadow-lg shadow-primary/10 hover:shadow-xl hover:shadow-primary/20
                         backdrop-blur-md border border-primary/20 hover:border-primary/30
                         transition-all duration-300 ease-out "
            >
              <Sparkles className="h-4 w-4" />
              <span className="relative z-10">Theme Customization</span>
            </div>
            <h3 className="text-2xl  md:text-5xl font-bold mb-4">
              Light & Dark Theme
            </h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              CappyChat automatically adapts to your system preferences or
              manual theme selection. Experience the seamless transition between
              our beautifully crafted light and dark modes.
            </p>
          </div>

          <div className="max-w-4xl mx-auto flex justify-center">
            <CompareDemo />
          </div>
        </motion.div>

        {/* Core Features Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mb-20 md:mb-28"
        >
          <div className="text-center mb-8">
            <h3 className="text-3xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-foreground via-foreground to-primary bg-clip-text text-transparent">
              Powerful AI Features
            </h3>
            <p className="text-muted-foreground max-w-3xl mx-auto text-lg leading-relaxed">
              From intelligent project sharing to advanced chat capabilities,
              experience the future of AI conversations.
            </p>
          </div>

          <div className="max-w-5xl px-7 mx-auto">
            <FeatureGrid />
          </div>
        </motion.div>

        {/* Pricing Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mb-28"
        >
          <div className="text-center mb-8">
            <div
              className="relative inline-flex mb-4 items-center gap-2 px-3 py-1.5 rounded-full text-xs  font-semibold overflow-hidden
                         bg-gradient-to-r from-primary/20 via-primary/15 to-primary/20
                         text-primary hover:text-primary/90
                         shadow-lg shadow-primary/10 hover:shadow-xl hover:shadow-primary/20
                         backdrop-blur-md border border-primary/20 hover:border-primary/30
                         transition-all duration-300 ease-out "
            >
              <Crown className="h-4 w-4" />
              Simple, Transparent Pricing
            </div>
            <h2 className=" text-3xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-foreground via-foreground to-primary bg-clip-text text-transparent">
              Choose Your Perfect Plan
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg leading-relaxed">
              From free tier to enterprise solutions, find the perfect plan for
              your AI conversation needs
            </p>
          </div>

          {/* Currency Toggle */}
          <CurrencyToggle
            currency={selectedCurrency}
            onCurrencyChange={setSelectedCurrency}
          />

          <div className="flex flex-wrap justify-center gap-8 max-w-6xl mx-auto">
            {/* Free Plan */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className={cn(
                "relative p-8 rounded-2xl border border-ring/50 text-center group hover:border-primary/40 transition-all duration-500",
                "bg-gradient-to-br from-card/80 via-card/60 to-card/40 backdrop-blur-md",

                "before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-br before:from-primary/5 before:to-transparent before:opacity-0 before:transition-opacity before:duration-500 hover:before:opacity-100"
              )}
            >
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6 justify-start">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Sparkles className="h-6 w-6 text-primary" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-xl font-bold">Starter</h3>
                    <p className="text-sm text-muted-foreground">
                      Perfect for trying out
                    </p>
                  </div>
                </div>

                <div className="mb-6 flex items-end justify-start gap-1">
                  <AnimatedPrice
                    value={PRICING_CONFIG[selectedCurrency].free.discounted}
                    currency={PRICING_CONFIG[selectedCurrency].currency}
                    className="text-5xl font-bold"
                  />
                  <span className="text-muted-foreground text-lg">/month</span>
                </div>

                <ul className="space-y-4 mb-8 text-left">
                  <li className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                      <Check className="h-3 w-3 text-primary" />
                    </div>
                    <span className="text-sm">80 budget model prompts</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                      <Check className="h-3 w-3 text-primary" />
                    </div>
                    <span className="text-sm">
                      10 premium credits (Chat + Image Gen)
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
                  className="w-full py-3 bg-muted hover:bg-muted/80 text-foreground font-medium border border-border/50 hover:border-primary/30 transition-all duration-300"
                >
                  Get Started Free
                </Button>
              </div>
            </motion.div>

            {/* Pro Plan - Popular */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className={cn(
                "relative p-8 rounded-2xl border-2 border-primary/50 text-center group hover:border-primary/60 transition-all duration-500 scale-105",
                "bg-gradient-to-br from-primary/5 via-card/80 to-primary/5 backdrop-blur-md",

                "before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-br before:from-primary/10 before:to-transparent before:opacity-0 before:transition-opacity before:duration-500 hover:before:opacity-100"
              )}
            >
              {/* 26% OFF Badge */}
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <div className="bg-gradient-to-r from-primary to-ring text-background px-4 py-2 rounded-full text-sm font-medium">
                  26% OFF
                </div>
              </div>

              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6 mt-4 justify-start">
                  <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center group-hover:bg-primary/30 transition-colors">
                    <Crown className="h-6 w-6 text-primary" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-xl font-bold">Pro Plan</h3>
                  </div>
                </div>

                <div className="mb-6 flex items-end justify-start gap-1">
                  <div className="flex items-center justify-center gap-2">
                    {PRICING_CONFIG[selectedCurrency].pro.original >
                      PRICING_CONFIG[selectedCurrency].pro.discounted && (
                      <AnimatedPrice
                        value={PRICING_CONFIG[selectedCurrency].pro.original}
                        currency={PRICING_CONFIG[selectedCurrency].currency}
                        className="text-2xl text-muted-foreground line-through"
                      />
                    )}
                    <AnimatedPrice
                      value={PRICING_CONFIG[selectedCurrency].pro.discounted}
                      currency={PRICING_CONFIG[selectedCurrency].currency}
                      className="text-5xl font-bold text-primary"
                    />
                  </div>
                  <p className="text-muted-foreground text-lg">/month</p>
                </div>

                <ul className="space-y-4 mb-8 text-left">
                  <li className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                      <Check className="h-3 w-3 text-primary" />
                    </div>
                    <span className="text-sm">
                      Free Models: 1,200 credits/month
                    </span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                      <Check className="h-3 w-3 text-primary" />
                    </div>
                    <span className="text-sm">
                      Premium Models: 600 credits/month
                    </span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                      <Check className="h-3 w-3 text-primary" />
                    </div>
                    <span className="text-sm">
                      Super Premium Models: 50 credits/month
                    </span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                      <Check className="h-3 w-3 text-primary" />
                    </div>
                    <span className="text-sm">Priority support</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                      <Check className="h-3 w-3 text-primary" />
                    </div>
                    <span className="text-sm">Advanced features access</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                      <Check className="h-3 w-3 text-primary" />
                    </div>
                    <span className="text-sm">No ads or interruptions</span>
                  </li>
                </ul>

                <Button
                  onClick={handleSubscribe}
                  className="w-full py-3 font-medium bg-primary hover:bg-primary/90 text-primary-foreground flex items-center gap-2 group"
                >
                  <Zap className="h-4 w-4" />
                  Subscribe Now
                </Button>

                {/* Security Badge */}
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground mt-4">
                  <span>🔒 Secure payment powered by DODO Payments</span>
                </div>
              </div>
            </motion.div>

            {/* Enterprise Plan */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
              className={cn(
                "relative p-8 rounded-2xl border border-ring/50 text-center group hover:border-primary/40 transition-all duration-500",
                "bg-gradient-to-br from-card/80 via-card/60 to-card/40 backdrop-blur-md",

                "before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-br before:from-primary/5 before:to-transparent before:opacity-0 before:transition-opacity before:duration-500 hover:before:opacity-100"
              )}
            >
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6 justify-start">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Building2 className="h-6 w-6 text-primary" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-xl font-bold">Enterprise</h3>
                    <p className="text-sm text-muted-foreground">
                      For teams & businesses
                    </p>
                  </div>
                </div>

                <div className="mb-6 flex items-end justify-start gap-1">
                  <span className="text-5xl font-bold">Custom</span>
                  <span className="text-muted-foreground text-lg">
                    {" "}
                    pricing
                  </span>
                </div>

                <ul className="space-y-4 mb-8 text-left">
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
                  className="w-full py-3 font-medium bg-muted hover:bg-muted/80 text-foreground border border-border/50 hover:border-primary/30 transition-all duration-300"
                  onClick={() => window.open("mailto:connect@aysh.me")}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Contact Sales
                </Button>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Modern CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="w-full max-w-4xl mx-auto"
        >
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-card/80 via-card/60 to-card/50 backdrop-blur-md border border-ring/10 p-8 md:p-12">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-50"></div>

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              {/* Left Content */}
              <div className="space-y-6">
                <div
                  className="relative inline-flex mb-3  items-center gap-2 px-3 py-1.5 rounded-full text-xs  font-semibold overflow-hidden
                         bg-gradient-to-r from-primary/20 via-primary/15 to-primary/20
                         text-primary hover:text-primary/90
                         shadow-lg shadow-primary/10 hover:shadow-xl hover:shadow-primary/20
                         backdrop-blur-md border border-primary/20 hover:border-primary/30
                         transition-all duration-300 ease-out "
                >
                  <span className="relative z-10">CappyChat AI</span>
                </div>

                <div className="space-y-4">
                  <h3 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight">
                    Make your chat a{" "}
                    <span className="text-primary">true standout.</span>
                  </h3>

                  <p className="text-muted-foreground text-lg leading-relaxed max-w-lg">
                    Discover new AI capabilities that help you craft
                    intelligent, highly functional conversations that drive
                    engagement and convert interactions into meaningful
                    connections.
                  </p>
                </div>

                <div className="pt-4">
                  <Button
                    onClick={onSignUp}
                    size="lg"
                    className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-5 text-lg font-medium rounded-lg group shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    Start Chatting
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </div>

              {/* Right Content - CapybaraIcon */}
              <div className="flex justify-center lg:justify-end">
                <div className="relative">
                  {/* Background decoration */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-primary/5 rounded-3xl transform rotate-3 scale-110"></div>
                  <div className="absolute inset-0 bg-gradient-to-tl from-primary/5 to-transparent rounded-3xl transform -rotate-2 scale-105"></div>

                  {/* Icon container */}
                  <div className="relative bg-gradient-to-br from-background/90 to-background/70 backdrop-blur-sm rounded-3xl p-8 md:p-12 border border-border/20 shadow-2xl">
                    <CapybaraIcon
                      size="2xl"
                      animated={true}
                      showLoader={true}
                      className="drop-shadow-lg"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Fixed Bottom Chat Input for Guests */}
      <div className="fixed bottom-5 left-0 right-0 z-10">
        <div
          className={cn(
            "flex justify-center px-4",
            isMobile ? "w-full" : sidebarState === "open" ? "ml-auto" : "w-full"
          )}
          style={{
            width: isMobile
              ? "100%"
              : sidebarState === "open"
              ? `calc(100% - ${sidebarWidth}px)`
              : "100%",
            marginLeft: isMobile
              ? 0
              : sidebarState === "open"
              ? `${sidebarWidth}px`
              : 0,
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="w-full max-w-3xl"
          >
            <ChatInputField
              threadId={threadId}
              input={input}
              status={status}
              setInput={setInput}
              append={append}
              setMessages={setMessages}
              stop={stop}
              pendingUserMessageRef={pendingUserMessageRef}
              onWebSearchMessage={onWebSearchMessage}
              submitRef={submitRef}
              messages={messages}
              onMessageAppended={onMessageAppended}
            />
          </motion.div>
        </div>
      </div>
    </div>
  );
}
