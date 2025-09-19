/**
 * Pricing Page Component
 *
 * Clean, modern pricing page with currency selection and subscription features.
 */

"use client";

import React, { useState, useEffect } from "react";
import { Button } from "../components/ui/button";
import { motion } from "framer-motion";
import { AnimatedPrice } from "../components/ui/animated-price";
import {
  Crown,
  Check,
  Zap,
  ArrowLeft,
  Loader2,
  Sparkles,
  Building2,
  Mail,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { detectUserCurrency, Currency } from "@/services/subscription.service";
import { getUserTierInfo, hasSubscriptionPremium } from "@/lib/tierSystem";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import ThemeToggleButton from "../components/ui/ThemeComponents";

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

const FEATURES = [
  "Free Models: 1,200 credits/month",
  "Premium Models: 600 credits/month",
  "Super Premium Models: 50 credits/month",
  "Priority support",
  "Advanced features access",
  "No ads or interruptions",
];

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

export default function PricingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>("USD");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPremium, setIsPremium] = useState(false);
  const [checkingPremium, setCheckingPremium] = useState(false);

  // Auto-detect currency on mount
  useEffect(() => {
    const detectedCurrency = detectUserCurrency();
    setSelectedCurrency(detectedCurrency);
  }, []);

  // Check premium status using tier system logic
  useEffect(() => {
    const checkPremiumStatus = async () => {
      if (!user) {
        setIsPremium(false);
        return;
      }

      setCheckingPremium(true);
      try {
        // Get tier info and subscription status like tier system does
        const tierInfo = await getUserTierInfo();
        const hasSubPremium = await hasSubscriptionPremium();

        // Use same logic as tier system: admin, tier premium, or subscription premium
        const effectivelyPremium =
          tierInfo?.tier === "admin" ||
          tierInfo?.tier === "premium" ||
          hasSubPremium;

        setIsPremium(effectivelyPremium);
      } catch (error) {
        console.error("Error checking premium status:", error);
        setIsPremium(false);
      } finally {
        setCheckingPremium(false);
      }
    };

    checkPremiumStatus();
  }, [user]);

  const handleSignUp = () => {
    navigate("/signup");
  };

  const handleSubscribe = async () => {
    if (!user) {
      navigate("/login");
      return;
    }

    if (!user.email) {
      setError(
        "Email is required for subscription. Please complete your profile."
      );
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/checkout/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.$id,
          userEmail: user.email,
          currency: selectedCurrency,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create checkout");
      }

      // Redirect to DODO Payments checkout
      window.location.href = data.paymentUrl;
    } catch (err) {
      console.error("Error creating checkout:", err);
      setError(
        err instanceof Error ? err.message : "Failed to create checkout"
      );
    } finally {
      setLoading(false);
    }
  };

  const currentPricing = PRICING_CONFIG[selectedCurrency];
  const hasDiscount =
    currentPricing.pro.original > currentPricing.pro.discounted;
  const discountPercentage = hasDiscount
    ? Math.round(
        ((currentPricing.pro.original - currentPricing.pro.discounted) /
          currentPricing.pro.original) *
          100
      )
    : 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="relative container px-8 mx-auto mb-8 max-w-7xl pt-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-8"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full text-sm font-medium text-primary mb-6"
          >
            <Crown className="h-4 w-4" />
            Choose Your Perfect Plan
          </motion.div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-foreground via-foreground to-primary bg-clip-text text-transparent">
            CappyChat Pricing
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            From free tier to enterprise solutions, find the perfect plan for
            your AI conversation needs
          </p>
        </motion.div>

        {/* Currency Toggle */}
        <CurrencyToggle
          currency={selectedCurrency}
          onCurrencyChange={setSelectedCurrency}
        />

        <div className="flex flex-wrap justify-center gap-8 max-w-6xl mx-auto mb-12">
          {/* Free Plan */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className={cn(
              "relative p-8 rounded-2xl border border-border text-center group hover:border-primary/40 transition-all duration-500",
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
                onClick={handleSignUp}
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
            {hasDiscount && (
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <div className="bg-gradient-to-r from-primary to-ring text-background px-4 py-2 rounded-full text-sm font-medium">
                  {discountPercentage}% OFF
                </div>
              </div>
            )}

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
                  {hasDiscount && (
                    <AnimatedPrice
                      value={currentPricing.pro.original}
                      currency={currentPricing.currency}
                      className="text-2xl text-muted-foreground line-through"
                    />
                  )}
                  <AnimatedPrice
                    value={currentPricing.pro.discounted}
                    currency={currentPricing.currency}
                    className="text-5xl font-bold text-primary"
                  />
                </div>
                <p className="text-muted-foreground text-lg">/month</p>
              </div>

              <ul className="space-y-4 mb-8 text-left">
                {FEATURES.map((feature, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                      <Check className="h-3 w-3 text-primary" />
                    </div>
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                onClick={isPremium ? undefined : handleSubscribe}
                disabled={loading || isPremium}
                className={cn(
                  "w-full py-3 font-medium flex items-center gap-2 group",
                  isPremium
                    ? "dark:bg-neutral-300 dark:text-black cursor-default"
                    : "bg-primary hover:bg-primary/90 text-primary-foreground"
                )}
              >
                {checkingPremium ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Checking Status...
                  </>
                ) : loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Creating Checkout...
                  </>
                ) : isPremium ? (
                  <>
                    <Crown className="h-4 w-4" />
                    Already Pro Plan
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4" />
                    {user ? "Subscribe Now" : "Sign Up & Subscribe"}
                  </>
                )}
              </Button>

              {error && (
                <div className="text-center text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg mt-4">
                  {error}
                </div>
              )}

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
              "relative p-8 rounded-2xl border border-border text-center group hover:border-primary/40 transition-all duration-500",
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
                <span className="text-muted-foreground text-lg"> pricing</span>
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

        {/* Additional Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="text-center text-sm text-muted-foreground space-y-2"
        >
          <p>Cancel anytime. No hidden fees.</p>
          <p>
            Need help? Contact us at{" "}
            <a
              href="mailto:hi@aysh.me"
              className="text-primary hover:underline"
            >
              hi@aysh.me
            </a>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
