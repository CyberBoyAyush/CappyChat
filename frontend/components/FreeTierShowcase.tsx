/**
 * Free Tier Showcase Component
 *
 * Displays upgrade options for free tier users and hides for premium users.
 * Similar functionality to PricingPage but as a compact banner.
 */

"use client";

import React, { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Crown, Zap, X } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { getUserTierInfo, hasSubscriptionPremium } from "@/lib/tierSystem";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useOutletContext } from "react-router-dom";

export default function FreeTierShowcase() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isPremium, setIsPremium] = useState(false);
  const [checkingPremium, setCheckingPremium] = useState(true);
  const [isVisible, setIsVisible] = useState(true);

  // Check premium status using tier system logic
  useEffect(() => {
    const checkPremiumStatus = async () => {
      if (!user) {
        setIsPremium(false);
        setCheckingPremium(false);
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
  const { state } = useOutletContext<{
    state: "open" | "collapsed";
  }>();

  const handleUpgrade = () => {
    if (!user) {
      navigate("/login");
      return;
    }

    // Navigate to pricing page instead of direct payment
    navigate("/pricing");
  };

  const handleDismiss = () => {
    setIsVisible(false);
    // Store dismissal in localStorage to remember user preference
    localStorage.setItem("freeTierShowcaseDismissed", "true");
  };

  // Check if user previously dismissed the showcase
  useEffect(() => {
    const dismissed = localStorage.getItem("freeTierShowcaseDismissed");
    if (dismissed === "true") {
      setIsVisible(false);
    }
  }, []);

  // Don't render if checking premium status, user is premium, or dismissed
  if (checkingPremium || isPremium || !isVisible || !user) {
    return null;
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className={`bg-background px-2 shadow-lg  backdrop-blur-sm ${
            state === "open"
              ? "rounded-b-lg border-b border-x border-primary/30 pb-1.5"
              : "rounded-lg py-1.5"
          }`}
        >
          <div className="flex items-center gap-3 border-border/50 border rounded-md px-2 py-1.5 bg-border/10">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Free </span>
            </div>

            <Button
              onClick={handleUpgrade}
              size="sm"
              variant="secondary"
              className="bg-foreground hover:bg-foreground/90 text-primary-foreground border-0 text-xs font-medium px-3 py-1 h-7"
            >
              Upgrade
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
