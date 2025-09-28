"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { SparklesCore } from "@/frontend/components/ui/sparkles";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { UnfoldHorizontal } from "lucide-react";
import { useMemo } from "react";
import CapybaraIcon from "./CapybaraIcon";

interface CompareProps {
  firstImage?: string;
  secondImage?: string;
  className?: string;
  firstImageClassName?: string;
  secondImageClassname?: string;
  initialSliderPercentage?: number;
  slideMode?: "hover" | "drag";
  showHandlebar?: boolean;
  autoplay?: boolean;
  autoplayDuration?: number;
  style?: React.CSSProperties;
}
const CompareComponent = ({
  firstImage = "",
  secondImage = "",
  className,
  firstImageClassName,
  secondImageClassname,
  initialSliderPercentage = 50,
  slideMode = "hover",
  showHandlebar = true,
  autoplay = false,
  autoplayDuration = 5000,
  style,
}: CompareProps) => {
  const [sliderXPercent, setSliderXPercent] = useState(initialSliderPercentage);
  const [isDragging, setIsDragging] = useState(false);

  const sliderRef = useRef<HTMLDivElement>(null);
  const autoplayRef = useRef<number | null>(null);
  const pendingFrameRef = useRef<number | null>(null);

  const startAutoplay = useCallback(() => {
    if (!autoplay) return;

    const startTime = Date.now();
    const animate = () => {
      const elapsedTime = Date.now() - startTime;
      const progress =
        (elapsedTime % (autoplayDuration * 2)) / autoplayDuration;
      const percentage = progress <= 1 ? progress * 100 : (2 - progress) * 100;

      setSliderXPercent(percentage);
      autoplayRef.current = requestAnimationFrame(animate);
    };

    animate();
  }, [autoplay, autoplayDuration]);

  const stopAutoplay = useCallback(() => {
    if (autoplayRef.current) {
      cancelAnimationFrame(autoplayRef.current);
      autoplayRef.current = null;
    }
  }, []);

  useEffect(() => {
    startAutoplay();
    return () => {
      stopAutoplay();
      // Cleanup pending animation frames
      if (pendingFrameRef.current) {
        cancelAnimationFrame(pendingFrameRef.current);
        pendingFrameRef.current = null;
      }
    };
  }, [startAutoplay, stopAutoplay]);

  function mouseEnterHandler() {
    stopAutoplay();
  }

  function mouseLeaveHandler() {
    if (slideMode === "hover") {
      setSliderXPercent(initialSliderPercentage);
    }
    if (slideMode === "drag") {
      setIsDragging(false);
    }
    startAutoplay();
  }

  const handleStart = useCallback(() => {
    if (slideMode === "drag") {
      setIsDragging(true);
    }
  }, [slideMode]);

  const handleEnd = useCallback(() => {
    if (slideMode === "drag") {
      setIsDragging(false);
    }
  }, [slideMode]);

  const handleMove = useCallback(
    (clientX: number) => {
      if (!sliderRef.current) return;
      if (slideMode === "hover" || (slideMode === "drag" && isDragging)) {
        // Cancel any pending frame to prevent stacking
        if (pendingFrameRef.current) {
          cancelAnimationFrame(pendingFrameRef.current);
        }

        const rect = sliderRef.current.getBoundingClientRect();
        const x = clientX - rect.left;
        const percent = (x / rect.width) * 100;

        pendingFrameRef.current = requestAnimationFrame(() => {
          setSliderXPercent(Math.max(0, Math.min(100, percent)));
          pendingFrameRef.current = null;
        });
      }
    },
    [slideMode, isDragging]
  );

  const handleMouseDown = useCallback(() => handleStart(), [handleStart]);
  const handleMouseUp = useCallback(() => handleEnd(), [handleEnd]);
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => handleMove(e.clientX),
    [handleMove]
  );

  const handleTouchStart = useCallback(() => {
    if (!autoplay) {
      handleStart();
    }
  }, [handleStart, autoplay]);

  const handleTouchEnd = useCallback(() => {
    if (!autoplay) {
      handleEnd();
    }
  }, [handleEnd, autoplay]);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!autoplay) {
        handleMove(e.touches[0].clientX);
      }
    },
    [handleMove, autoplay]
  );

  // Memoize container style to prevent re-renders
  const containerStyle = useMemo(
    () => ({
      position: "relative" as const,
      cursor: slideMode === "drag" ? "grab" : "col-resize",
      ...style,
    }),
    [slideMode, style]
  );

  // Memoize slider line style
  const sliderLineStyle = useMemo(
    () => ({
      left: `${sliderXPercent}%`,
      top: "0",
      zIndex: 40,
    }),
    [sliderXPercent]
  );

  // Memoize clip path style for first image
  const firstImageClipStyle = useMemo(
    () => ({
      clipPath: `inset(0 ${100 - sliderXPercent}% 0 0)`,
    }),
    [sliderXPercent]
  );

  // Memoize image styles to prevent re-renders
  const imageStyle = useMemo(
    () => ({
      userSelect: "none" as const,
      WebkitUserSelect: "none" as const,
      MozUserSelect: "none" as const,
      width: "100%",
      height: "100%",
      objectFit: "cover" as const,
    }),
    []
  );

  return (
    <div
      ref={sliderRef}
      className={cn("w-[400px] h-[400px] overflow-hidden", className)}
      style={containerStyle}
      onMouseMove={handleMouseMove}
      onMouseLeave={mouseLeaveHandler}
      onMouseEnter={mouseEnterHandler}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchMove}
    >
      <AnimatePresence initial={false}>
        <motion.div
          className="h-full w-px absolute top-0 m-auto z-30 bg-gradient-to-b from-transparent from-[5%] to-[95%] via-primary to-transparent"
          style={sliderLineStyle}
          transition={{ duration: 0 }}
        >
          <div className="w-36 h-full [mask-image:radial-gradient(100px_at_left,white,transparent)] absolute top-1/2 -translate-y-1/2 left-0 bg-gradient-to-r from-primary/60 via-transparent to-transparent z-20 opacity-50" />
          <div className="w-10 h-1/2 [mask-image:radial-gradient(50px_at_left,white,transparent)] absolute top-1/2 -translate-y-1/2 left-0 bg-gradient-to-r from-primary/80 via-transparent to-transparent z-10 opacity-100" />
          <div className="w-10 h-3/4 top-1/2 -translate-y-1/2 absolute -right-10 [mask-image:radial-gradient(100px_at_left,white,transparent)]">
            <MemoizedSparklesCore
              background="transparent"
              minSize={0.4}
              maxSize={1}
              particleDensity={1200}
              className="w-full h-full"
              particleColor="#FFFFFF"
            />
          </div>
          {showHandlebar && (
            <div className="h-8 w-8 rounded-md top-1/2 -translate-y-1/2 bg-background border border-border z-30 -right-2.5 absolute flex items-center justify-center shadow-md">
              {/* <UnfoldHorizontal className="h-4 w-4 text-primary" /> */}
              <CapybaraIcon size="text-sm" animated={false} showLoader={true} />
            </div>
          )}
        </motion.div>
      </AnimatePresence>
      <div className="overflow-hidden w-full h-full relative z-20 pointer-events-none">
        <AnimatePresence initial={false}>
          {firstImage ? (
            <motion.div
              className={cn(
                "absolute inset-0 z-20 rounded-2xl shrink-0 w-full h-full select-none overflow-hidden",
                firstImageClassName
              )}
              style={firstImageClipStyle}
              transition={{ duration: 0 }}
            >
              <img
                alt="Light theme"
                src={firstImage}
                className={cn(
                  "absolute inset-0 z-20 rounded-2xl shrink-0 w-full h-full select-none pointer-events-none object-cover",
                  firstImageClassName
                )}
                draggable={false}
                onDragStart={(e) => e.preventDefault()}
                style={imageStyle}
              />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      <AnimatePresence initial={false}>
        {secondImage ? (
          <motion.img
            className={cn(
              "absolute top-0 left-0 z-[19] rounded-2xl w-full h-full select-none pointer-events-none object-cover",
              secondImageClassname
            )}
            alt="Dark theme"
            src={secondImage}
            draggable={false}
            onDragStart={(e) => e.preventDefault()}
            style={imageStyle}
          />
        ) : null}
      </AnimatePresence>
    </div>
  );
};

const MemoizedSparklesCore = React.memo(SparklesCore);

// Memoize the Compare component to prevent unnecessary re-renders
export const Compare = React.memo(CompareComponent);
