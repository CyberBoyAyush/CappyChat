"use client";

import React, { useEffect, useState, useRef } from "react";
import { RotatingText } from "./rotating-text";
import { cn } from "@/lib/utils";

interface AnimatedPriceProps {
  value: number;
  currency: string;
  className?: string;
  duration?: number;
}

export const AnimatedPrice: React.FC<AnimatedPriceProps> = ({
  value,
  currency,
  className = "",
  duration = 1000,
}) => {
  const [displayValue, setDisplayValue] = useState(value);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const previousValueRef = useRef(value);
  const previousCurrencyRef = useRef(currency);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const formatPrice = (price: number): string => {
    if (price === 0) return "0";
    return price.toLocaleString();
  };

  // Generate transition texts only for same currency changes
  const generateTransitionTexts = (
    startValue: number,
    endValue: number
  ): string[] => {
    if (startValue === endValue) {
      return [formatPrice(endValue)];
    }

    const steps = 6;
    const texts: string[] = [];

    for (let i = 0; i <= steps; i++) {
      const progress = i / steps;
      // Use easing function for smoother transition
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      const currentPrice = Math.round(
        startValue + (endValue - startValue) * easedProgress
      );
      texts.push(formatPrice(currentPrice));
    }

    return texts.length > 0 ? texts : [formatPrice(endValue)];
  };

  useEffect(() => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Check if currency changed
    const currencyChanged = previousCurrencyRef.current !== currency;
    const valueChanged = previousValueRef.current !== value;

    if (currencyChanged) {
      // Currency changed - immediately update without animation
      setIsTransitioning(false);
      setDisplayValue(value);
      previousValueRef.current = value;
      previousCurrencyRef.current = currency;
    } else if (valueChanged) {
      // Same currency, different value - animate the transition
      setIsTransitioning(true);

      // Update the display value after animation completes
      timeoutRef.current = setTimeout(() => {
        setDisplayValue(value);
        previousValueRef.current = value;
        setIsTransitioning(false);
      }, duration);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, currency, duration]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Generate texts based on current state
  const currentTexts = isTransitioning
    ? generateTransitionTexts(previousValueRef.current, value)
    : [formatPrice(displayValue)];

  // Safety check to ensure we always have valid texts
  const safeTexts = currentTexts.length > 0 ? currentTexts : ["0"];

  return (
    <span className={cn("tabular-nums inline-flex items-baseline", className)}>
      <span className="flex-shrink-0">{currency}</span>
      <RotatingText
        key={`${currency}-${isTransitioning ? "transitioning" : "static"}`}
        texts={safeTexts}
        auto={isTransitioning && safeTexts.length > 1}
        loop={false}
        rotationInterval={duration / Math.max(safeTexts.length - 1, 1)}
        transition={{
          type: "spring",
          damping: 30,
          stiffness: 500,
        }}
        initial={{ y: "100%", opacity: 0, scale: 0.8 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: "-100%", opacity: 0, scale: 0.8 }}
        splitBy="characters"
        staggerDuration={0.03}
        staggerFrom="center"
        mainClassName="overflow-hidden min-h-[1em] flex items-center"
        splitLevelClassName="overflow-hidden"
        elementLevelClassName="inline-block"
        animatePresenceMode="wait"
        animatePresenceInitial={false}
      />
    </span>
  );
};
