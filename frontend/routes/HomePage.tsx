/**
 * Home Page Component
 *
 * Entry point for the application with authentication options.
 * Features modern design with login and signup options.
 */

"use client";

import React, { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/frontend/components/ui/button";
import { useAuth } from "@/frontend/contexts/AuthContext";
import { Moon } from "lucide-react";
import { Check } from "lucide-react";
import { Building2, Mail } from "lucide-react";
import {
  Sparkles,
  Shield,
  ArrowRight,
  LogIn,
  UserPlus,
  Zap,
  RefreshCw,
  Brain,
  Clock,
  Users2,
  Globe,
  Star,
  TrendingUp,
  Cpu,
  Smartphone,
  CheckCircle,
  Play,
  BarChart3,
  Layers,
  ExternalLink,
  MessageSquare,
  Code,
  Database,
  Wifi,
  Settings,
  Search,
  Heart,
  Lightbulb,
} from "lucide-react";
import { GoogleIcon, GitHubIcon } from "@/frontend/components/ui/icons";
import { ThemeToggleButton } from "@/frontend/components/ui/ThemeComponents";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";

// Optimized floating background icons data (reduced for performance)
const floatingIcons = [
  { Icon: MessageSquare, delay: 0, duration: 25, x: 15, y: 25 },
  { Icon: Code, delay: 3, duration: 30, x: 80, y: 20 },
  { Icon: Database, delay: 6, duration: 35, x: 20, y: 70 },
  { Icon: Wifi, delay: 2, duration: 28, x: 85, y: 75 },
  { Icon: Settings, delay: 5, duration: 32, x: 65, y: 35 },
  { Icon: Search, delay: 1, duration: 27, x: 30, y: 55 },
  { Icon: Heart, delay: 4, duration: 29, x: 75, y: 60 },
  { Icon: Lightbulb, delay: 7, duration: 33, x: 45, y: 15 },
];

const HomePage: React.FC = () => {
  const { isAuthenticated, loading, loginWithGoogle, loginWithGitHub } =
    useAuth();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // For animated background blobs with performance optimization
  const [mousePosition, setMousePosition] = useState({ x: 0.5, y: 0.5 });
  const rafRef = useRef<number | null>(null);

  // Optimized mouse movement handler with throttling
  useEffect(() => {
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const handleMouseMove = (e: MouseEvent) => {
      // Cancel previous RAF if pending
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }

      // Use RAF to throttle updates to 60fps
      rafRef.current = requestAnimationFrame(() => {
        setMousePosition({
          x: e.clientX / window.innerWidth,
          y: e.clientY / window.innerHeight,
        });
      });
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  // Redirect authenticated users to chat
  useEffect(() => {
    if (isAuthenticated && !loading) {
      navigate("/chat");
    }
  }, [isAuthenticated, loading, navigate]);

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
    } catch (error) {
      console.error("Google login failed:", error);
    }
  };

  const handleGitHubLogin = async () => {
    try {
      await loginWithGitHub();
    } catch (error) {
      console.error("GitHub login failed:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden homepage-optimized">
      {/* Interactive gradient background */}
      <div
        className="absolute inset-0 z-0 opacity-30 dark:opacity-20"
        style={{
          background: isDark
            ? `radial-gradient(circle at ${mousePosition.x * 100}% ${
                mousePosition.y * 100
              }%, rgba(247, 111, 82, 0.15) 0%, rgba(0, 0, 0, 0) 50%),
               radial-gradient(circle at ${100 - mousePosition.x * 100}% ${
                100 - mousePosition.y * 100
              }%, rgba(247, 111, 82, 0.08) 0%, rgba(0, 0, 0, 0) 50%)`
            : `radial-gradient(circle at ${mousePosition.x * 100}% ${
                mousePosition.y * 100
              }%, rgba(247, 111, 82, 0.2) 0%, rgba(0, 0, 0, 0) 60%),
               radial-gradient(circle at ${100 - mousePosition.x * 100}% ${
                100 - mousePosition.y * 100
              }%, rgba(247, 111, 82, 0.1) 0%, rgba(0, 0, 0, 0) 50%)`,
        }}
      />

      {/* Fixed gradient elements */}
      <div className="absolute top-0 left-0 w-full h-full z-0">
        <div className="absolute top-0 left-1/4 w-[30rem] h-[30rem] rounded-full bg-primary/5 blur-[8rem] -translate-y-1/2" />
        <div className="absolute bottom-0 right-1/4 w-[30rem] h-[30rem] rounded-full bg-primary/3 blur-[8rem] translate-y-1/3" />

        {/* Additional gradient orbs for more depth */}
        <div className="absolute top-1/3 right-1/3 w-[20rem] h-[20rem] rounded-full bg-primary/2 blur-[6rem]" />
        <div className="absolute bottom-1/3 left-1/3 w-[25rem] h-[25rem] rounded-full bg-primary/3 blur-[7rem]" />
        <div className="absolute top-2/3 left-1/2 w-[15rem] h-[15rem] rounded-full bg-primary/4 blur-[5rem]" />
      </div>

      {/* Optimized Floating Background Icons */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {floatingIcons.map((item, index) => (
          <motion.div
            key={index}
            className="absolute opacity-[0.04] dark:opacity-[0.06] floating-element"
            style={{
              left: `${item.x}%`,
              top: `${item.y}%`,
            }}
            animate={{
              y: [0, -20, 0],
              x: [0, 10, 0],
              rotate: [0, 180],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: item.duration,
              delay: item.delay,
              repeat: Infinity,
              ease: "easeInOut",
              type: "tween",
            }}
          >
            <item.Icon className="h-6 w-6 sm:h-8 sm:w-8 lg:h-10 lg:w-10 text-primary" />
          </motion.div>
        ))}

        {/* Optimized floating elements */}
        <motion.div
          className="absolute top-1/4 left-1/4 w-2 h-2 bg-primary/15 rounded-full floating-element"
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
            type: "tween",
          }}
        />
        <motion.div
          className="absolute top-3/4 right-1/3 w-2 h-2 bg-primary/12 rounded-full floating-element"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.5, 0.2],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 3,
            type: "tween",
          }}
        />
      </div>

      {/* Optimized Navigation Header */}
      <nav className="fixed top-0 w-full z-50 bg-gradient-to-r from-background/95 via-background/90 to-background/95 optimized-blur border-b border-border/50 shadow-lg shadow-primary/5">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/3 via-transparent to-primary/3 opacity-50" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="flex justify-between items-center h-16 sm:h-18">
            <motion.div
              className="flex items-center space-x-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <motion.div
                whileHover={{
                  scale: 1.05,
                  transition: { duration: 0.2, ease: "easeOut" },
                }}
                className="relative"
                style={{ willChange: 'transform' }}
              >
                <motion.div
                  className="absolute inset-0 bg-primary/15 rounded-full blur-sm"
                  animate={{
                    scale: [1, 1.1, 1],
                    opacity: [0.2, 0.4, 0.2],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    repeatType: "reverse",
                    ease: "easeInOut",
                  }}
                />
                <img
                  src="/logo.png"
                  alt="Logo"
                  className="h-8 w-8 sm:h-10 sm:w-10 relative z-10"
                />
              </motion.div>
              <span className="text-xl sm:text-2xl font-bold text-foreground">
                AV<span className="text-primary">Chat</span>
              </span>
            </motion.div>

            <motion.div
              className="flex items-center space-x-2 sm:space-x-3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <ThemeToggleButton variant="inline" />

              {/* Mobile-optimized buttons */}
              <div className="flex items-center space-x-2">
                <Link to="/auth/login">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center space-x-1.5 text-sm font-medium px-3 py-2 rounded-lg hover:bg-secondary/80 transition-all duration-200"
                  >
                    <LogIn className="h-4 w-4" />
                    <span className="hidden sm:block">Login</span>
                  </Button>
                </Link>

                <Link to="/auth/signup">
                  <Button
                    size="sm"
                    className="flex items-center space-x-1.5 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold px-3 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                  >
                    <UserPlus className="h-4 w-4" />
                    <span className="hidden sm:block">Sign Up</span>
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </nav>

      {/* Enhanced Hero Section */}
      <main className="pt-6 sm:pt-20 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 md:py-16 lg:py-24">
          <div className="text-center relative">
            {/* Hero background glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 blur-3xl opacity-30 rounded-full transform scale-150" />
            <motion.div
              className="flex justify-center mb-4 sm:mb-8"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                duration: 0.4,
                ease: "easeOut",
              }}
            >
              <div className="relative">
                <motion.div
                  className="absolute inset-0 bg-primary rounded-xl opacity-15"
                  style={{ willChange: 'transform' }}
                  animate={{
                    scale: [1, 1.05, 1],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    repeatType: "reverse",
                    ease: "easeInOut",
                  }}
                />
                <img
                  src="/logo.png"
                  alt="Hero Background"
                  className="h-16 w-16 sm:h-20 sm:w-20 relative z-10"
                />
              </div>
            </motion.div>

            <motion.div
              className="space-y-3 sm:space-y-6 mb-8 sm:mb-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
            >
              <h1 className="text-3xl xs:text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold text-foreground leading-tight px-1 sm:px-0">
                The Future of{" "}
                <span className="relative inline-block">
                  <span className="bg-gradient-to-r from-primary via-primary/90 to-primary bg-clip-text text-transparent animate-gradient-x">
                    AI Conversations
                  </span>
                </span>
              </h1>

              <motion.p
                className="text-base xs:text-lg sm:text-xl md:text-2xl lg:text-3xl text-muted-foreground max-w-4xl mx-auto leading-relaxed px-2 sm:px-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.4 }}
              >
                Experience{" "}
                <motion.span
                  className="text-primary font-semibold"
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  lightning-fast
                </motion.span>{" "}
                AI interactions with multiple models.
                <br className="hidden md:block" />
                <motion.span
                  className="text-primary font-semibold"
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  10x faster
                </motion.span>{" "}
                than ChatGPT,{" "}
                <motion.span
                  className="text-primary font-semibold"
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  smarter
                </motion.span>{" "}
                than Claude, and{" "}
                <motion.span
                  className="text-primary font-semibold"
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  synced
                </motion.span>{" "}
                across all your devices.
              </motion.p>
            </motion.div>

            {/* Optimized Feature Pills */}
            <motion.div
              className="flex flex-wrap justify-center gap-2 xs:gap-3 sm:gap-4 mb-8 sm:mb-12 lg:mb-16 px-2 sm:px-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4, ease: "easeOut" }}
            >
              <motion.div
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="group relative overflow-hidden bg-gradient-to-r from-primary/10 via-primary/15 to-primary/20 hover:from-primary/20 hover:via-primary/25 hover:to-primary/30 text-primary px-3 xs:px-4 sm:px-6 py-2 xs:py-2.5 sm:py-3 rounded-full text-xs sm:text-sm lg:text-base font-semibold border border-primary/30 hover:border-primary/50 transition-all duration-200 hover:shadow-lg hover:shadow-primary/25 backdrop-blur-sm"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.5, ease: "easeOut" }}
                style={{ willChange: 'transform' }}
              >
                <Zap className="h-3 w-3 sm:h-4 sm:w-4 inline mr-1.5 sm:mr-2 relative z-10" />
                <span className="hidden xs:inline relative z-10">10x</span>{" "}
                <span className="relative z-10">Faster Response</span>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="group relative overflow-hidden bg-gradient-to-r from-secondary/40 via-secondary/50 to-secondary/60 hover:from-secondary/60 hover:via-secondary/70 hover:to-secondary/80 text-foreground px-3 xs:px-4 sm:px-6 py-2 xs:py-2.5 sm:py-3 rounded-full text-xs sm:text-sm lg:text-base font-semibold border border-border hover:border-primary/30 transition-all duration-200 hover:shadow-lg backdrop-blur-sm"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.6, ease: "easeOut" }}
                style={{ willChange: 'transform' }}
              >
                <Brain className="h-3 w-3 sm:h-4 sm:w-4 inline mr-1.5 sm:mr-2 relative z-10" />
                <span className="relative z-10">Multi-Model AI</span>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="group relative overflow-hidden bg-gradient-to-r from-secondary/40 via-secondary/50 to-secondary/60 hover:from-secondary/60 hover:via-secondary/70 hover:to-secondary/80 text-foreground px-3 xs:px-4 sm:px-6 py-2 xs:py-2.5 sm:py-3 rounded-full text-xs sm:text-sm lg:text-base font-semibold border border-border hover:border-primary/30 transition-all duration-200 hover:shadow-lg backdrop-blur-sm"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.7, ease: "easeOut" }}
                style={{ willChange: 'transform' }}
              >
                <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4 inline mr-1.5 sm:mr-2 relative z-10" />
                <span className="relative z-10">Real-time Sync</span>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="group relative overflow-hidden bg-gradient-to-r from-secondary/40 via-secondary/50 to-secondary/60 hover:from-secondary/60 hover:via-secondary/70 hover:to-secondary/80 text-foreground px-3 xs:px-4 sm:px-6 py-2 xs:py-2.5 sm:py-3 rounded-full text-xs sm:text-sm lg:text-base font-semibold border border-border hover:border-primary/30 transition-all duration-200 hover:shadow-lg backdrop-blur-sm"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.8, ease: "easeOut" }}
                style={{ willChange: 'transform' }}
              >
                <Shield className="h-3 w-3 sm:h-4 sm:w-4 inline mr-1.5 sm:mr-2 relative z-10" />
                <span className="relative z-10">Privacy First</span>
              </motion.div>
            </motion.div>

            {/* Optimized Authentication Buttons */}
            <motion.div
              className="flex flex-col items-center gap-4 sm:gap-6 lg:gap-8 mb-8 sm:mb-12 px-2 sm:px-4 relative"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6, ease: "easeOut" }}
            >
              {/* Simplified glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-primary/8 via-transparent to-primary/8 blur-xl opacity-40 rounded-2xl" />
              {/* Primary CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full justify-center max-w-4xl">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full sm:w-auto flex-1 sm:flex-initial"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.5, ease: "easeOut" }}
                >
                  <Button
                    onClick={handleGoogleLogin}
                    size="lg"
                    className="group relative w-full sm:min-w-[280px] md:min-w-[320px] flex items-center justify-center space-x-3 bg-gradient-to-r from-[#ff6b3d] to-[#ff8c3d] hover:from-[#ff5722] hover:to-[#ff7043] text-white shadow-lg hover:shadow-xl hover:shadow-orange-500/25 transition-all duration-200 px-6 py-4 lg:py-5 text-base lg:text-lg font-semibold rounded-xl overflow-hidden"
                    disabled={loading}
                  >
                    <GoogleIcon className="h-5 w-5 lg:h-6 lg:w-6 flex-shrink-0" />
                    <span className="font-medium">Continue with Google</span>
                    <ArrowRight className="h-4 w-4 lg:h-5 lg:w-5 group-hover:translate-x-1 transition-transform duration-200 flex-shrink-0" />
                  </Button>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full sm:w-auto flex-1 sm:flex-initial"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.6, ease: "easeOut" }}
                >
                  <Button
                    onClick={handleGitHubLogin}
                    size="lg"
                    variant="outline"
                    className="btn-optimized group relative w-full sm:min-w-[280px] md:min-w-[320px] flex items-center justify-center space-x-3 border-2 border-foreground/20 hover:border-foreground/40 bg-card/50 hover:bg-card/80 text-foreground shadow-lg hover:shadow-xl px-6 py-4 lg:py-5 text-base lg:text-lg font-semibold rounded-xl backdrop-blur-sm"
                    disabled={loading}
                  >
                    <GitHubIcon className="h-5 w-5 lg:h-6 lg:w-6 flex-shrink-0" />
                    <span className="font-medium">Continue with GitHub</span>
                    <ArrowRight className="h-4 w-4 lg:h-5 lg:w-5 group-hover:translate-x-1 transition-transform duration-200 flex-shrink-0" />
                  </Button>
                </motion.div>
              </div>
            </motion.div>

            {/* Enhanced Trust Indicators */}
            <motion.div className="flex flex-col md:flex-row items-center justify-center gap-3 xs:gap-4 sm:gap-8 text-xs sm:text-sm text-muted-foreground/80">
              <motion.div className="flex items-center space-x-2 bg-primary/10 px-3 py-1.5 rounded-full border border-primary/20">
                <CheckCircle className="h-4 w-4 text-primary" />
                <span className="font-medium">Free to start</span>
              </motion.div>

              <motion.div className="flex items-center space-x-2 bg-primary/10 px-3 py-1.5 rounded-full border border-primary/20">
                <CheckCircle className="h-4 w-4 text-primary" />
                <span className="font-medium">No credit card required</span>
              </motion.div>

              <motion.div className="flex items-center space-x-2 bg-primary/10 px-3 py-1.5 rounded-full border border-primary/20">
                <CheckCircle className="h-4 w-4 text-primary" />
                <span className="font-medium">Trusted by 50K+ users</span>
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative">
          {/* Enhanced background */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 rounded-3xl" />
          <div className="absolute inset-0 bg-gradient-to-br from-primary/3 via-transparent to-primary/5 rounded-3xl" />

          <div className="relative z-10">
            <motion.div
              className="text-center mb-12"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
                Performance That{" "}
                <span className="bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                  Speaks for Itself
                </span>
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Real metrics from real users. See why AVChat is the fastest AI
                platform.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              {/* Response Time */}
              <div className="text-center p-4 md:p-8 bg-card/50 backdrop-blur-sm border border-border rounded-3xl hover:shadow-lg transition-all duration-300">
                <div className="bg-primary/10 rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-4">
                  <Clock className="h-8 w-8 text-primary" />
                </div>
                <div className="text-lg md:text-4xl font-bold text-foreground mb-2">
                  0.8s
                </div>
                <div className="text-lg font-medium text-primary mb-1">
                  Average Response Time
                </div>
                <div className="text-sm text-muted-foreground">
                  vs 8.2s on ChatGPT
                </div>
              </div>

              {/* Accuracy */}
              <div className="text-center p-4 md:p-8 bg-card/50 backdrop-blur-sm border border-border rounded-3xl hover:shadow-lg transition-all duration-300">
                <div className="bg-primary/10 rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="h-8 w-8 text-primary" />
                </div>
                <div className="text-lg md:text-4xl font-bold text-foreground mb-2">
                  98.5%
                </div>
                <div className="text-lg font-medium text-primary mb-1">
                  Accuracy Score
                </div>
                <div className="text-sm text-muted-foreground">
                  Consistently high quality
                </div>
              </div>

              {/* Models Supported */}
              <div className="text-center p-4 md:p-8 bg-card/50 backdrop-blur-sm border border-border rounded-3xl hover:shadow-lg transition-all duration-300">
                <div className="bg-primary/10 rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-4">
                  <Layers className="h-8 w-8 text-primary" />
                </div>
                <div className="text-lg md:text-4xl font-bold text-foreground mb-2">
                  15+
                </div>
                <div className="text-lg font-medium text-primary mb-1">
                  AI Models
                </div>
                <div className="text-sm text-muted-foreground">
                  GPT-4, Claude, Gemini & more
                </div>
              </div>
            </div>

            {/* Speed Comparison Chart */}
            <div className="bg-card/30 backdrop-blur-sm border border-border rounded-3xl p-4 md:p-8">
              <h3 className="text-xl font-semibold text-foreground mb-6 text-center">
                Response Speed Comparison
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-primary rounded-full"></div>
                    <span className="text-foreground font-medium">AVChat</span>
                  </div>
                  <div className="flex-1 mx-4 bg-secondary rounded-full h-2 relative overflow-hidden">
                    <div
                      className="absolute left-0 top-0 h-full bg-primary rounded-full animate-pulse"
                      style={{ width: "8%" }}
                    ></div>
                  </div>
                  <span className="text-primary font-medium text-sm w-12">
                    0.8s
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-muted-foreground rounded-full"></div>
                    <span className="text-muted-foreground">ChatGPT</span>
                  </div>
                  <div className="flex-1 mx-4 bg-secondary rounded-full h-2 relative overflow-hidden">
                    <div
                      className="absolute left-0 top-0 h-full bg-muted-foreground rounded-full"
                      style={{ width: "82%" }}
                    ></div>
                  </div>
                  <span className="text-muted-foreground text-sm w-12">
                    8.2s
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-muted-foreground rounded-full"></div>
                    <span className="text-muted-foreground">Claude</span>
                  </div>
                  <div className="flex-1 mx-4 bg-secondary rounded-full h-2 relative overflow-hidden">
                    <div
                      className="absolute left-0 top-0 h-full bg-muted-foreground rounded-full"
                      style={{ width: "65%" }}
                    ></div>
                  </div>
                  <span className="text-muted-foreground text-sm w-12">
                    6.5s
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Key Features Grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative">
          {/* Background gradient */}
          <div className="absolute inset-0 " />

          <motion.div
            className="text-center mb-16 relative z-10"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
              Everything You Need in{" "}
              <span className="bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                One Platform
              </span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Powerful features designed for the future of AI conversations
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 relative z-10">
            {/* Speed */}
            <motion.div
              className="group relative bg-gradient-to-br from-card/50 to-card/30 backdrop-blur-sm border border-border rounded-3xl p-4 md:p-8 hover:bg-card/80 transition-all duration-200 hover:shadow-xl hover:scale-[1.02]"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              viewport={{ once: true }}
            >
              {/* Card glow effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl" />
              <div className="bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl h-16 w-16 flex items-center justify-center mb-6 group-hover:scale-105 transition-transform duration-200">
                <Zap className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">
                Lightning Fast Responses
              </h3>
              <p className="text-muted-foreground mb-4 leading-relaxed">
                10x faster than ChatGPT with our optimized AI routing system.
                Get answers in under a second.
              </p>
              <div className="flex items-center text-primary text-sm font-medium">
                <TrendingUp className="h-4 w-4 mr-1" />
                Average 0.8s response time
              </div>
            </motion.div>

            {/* Multi-Model */}
            <motion.div
              className="group relative bg-gradient-to-br from-card/50 to-card/30 backdrop-blur-sm border border-border rounded-3xl p-4 md:p-8 hover:bg-card/80 transition-all duration-500 hover:shadow-2xl hover:scale-105"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              whileHover={{ y: -5 }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl" />
              <div className="bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl h-16 w-16 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Brain className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">
                Multi-Model Intelligence
              </h3>
              <p className="text-muted-foreground mb-4 leading-relaxed">
                Access GPT-4, Claude-3, Gemini Pro, and 15+ cutting-edge AI
                models in one unified interface.
              </p>
              <div className="flex items-center text-primary text-sm font-medium">
                <Layers className="h-4 w-4 mr-1" />
                15+ AI models available
              </div>
            </motion.div>

            {/* Sync */}
            <motion.div
              className="group relative bg-gradient-to-br from-card/50 to-card/30 backdrop-blur-sm border border-border rounded-3xl p-4 md:p-8 hover:bg-card/80 transition-all duration-500 hover:shadow-2xl hover:scale-105"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
              whileHover={{ y: -5 }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl" />
              <div className="bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl h-16 w-16 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <RefreshCw className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">
                Real-time Sync
              </h3>
              <p className="text-muted-foreground mb-4 leading-relaxed">
                Seamless conversation sync across all your devices. Start on
                mobile, continue on desktop.
              </p>
              <div className="flex items-center text-primary text-sm font-medium">
                <Smartphone className="h-4 w-4 mr-1" />
                Works on all devices
              </div>
            </motion.div>

            {/* Privacy */}
            <motion.div
              className="group relative bg-gradient-to-br from-card/50 to-card/30 backdrop-blur-sm border border-border rounded-3xl p-4 md:p-8 hover:bg-card/80 transition-all duration-500 hover:shadow-2xl hover:scale-105"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              viewport={{ once: true }}
              whileHover={{ y: -5 }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl" />
              <div className="bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl h-16 w-16 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">
                Privacy-First Design
              </h3>
              <p className="text-muted-foreground mb-4 leading-relaxed">
                End-to-end encryption, zero data retention policy, and complete
                control over your conversations.
              </p>
              <div className="flex items-center text-primary text-sm font-medium">
                <CheckCircle className="h-4 w-4 mr-1" />
                GDPR compliant
              </div>
            </motion.div>

            {/* Advanced Features */}
            <motion.div
              className="group relative bg-gradient-to-br from-card/50 to-card/30 backdrop-blur-sm border border-border rounded-3xl p-4 md:p-8 hover:bg-card/80 transition-all duration-500 hover:shadow-2xl hover:scale-105"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              viewport={{ once: true }}
              whileHover={{ y: -5 }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl" />
              <div className="bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl h-16 w-16 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Cpu className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">
                Advanced AI Features
              </h3>
              <p className="text-muted-foreground mb-4 leading-relaxed">
                Code generation, image analysis, document processing, and
                intelligent conversation memory.
              </p>
              <div className="flex items-center text-primary text-sm font-medium">
                <Star className="h-4 w-4 mr-1" />
                Pro features included
              </div>
            </motion.div>

            {/* Team Collaboration */}
            <motion.div
              className="group relative bg-gradient-to-br from-card/50 to-card/30 backdrop-blur-sm border border-border rounded-3xl p-4 md:p-8 hover:bg-card/80 transition-all duration-500 hover:shadow-2xl hover:scale-105"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              viewport={{ once: true }}
              whileHover={{ y: -5 }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl" />
              <div className="bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl h-16 w-16 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Users2 className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">
                Team Collaboration
              </h3>
              <p className="text-muted-foreground mb-4 leading-relaxed">
                Share conversations, collaborate on projects, and manage team
                workspaces with enterprise-grade tools.
              </p>
              <div className="flex items-center text-primary text-sm font-medium">
                <Globe className="h-4 w-4 mr-1" />
                Enterprise ready
              </div>
            </motion.div>
          </div>
        </div>

        {/* Enhanced Responsive Comparison Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-3 sm:mb-4">
              Why Switch to AV<span className="text-primary">Chat</span>?
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground">
              See how we compare to other AI platforms
            </p>
          </div>

          {/* Mobile-First Comparison Cards */}
          <div className="block lg:hidden space-y-4 mb-8">
            {[
              { feature: "Response Speed", avchat: "10x Faster", others: "Standard/Slow" },
              { feature: "Model Access", avchat: "All Models", others: "Limited" },
              { feature: "Device Sync", avchat: "Real-time", others: "Basic/None" },
              { feature: "Privacy Level", avchat: "Maximum", others: "Standard/Good" }
            ].map((item, index) => (
              <div key={index} className="bg-card/40 backdrop-blur-sm border border-border rounded-2xl p-4 sm:p-6">
                <h3 className="text-foreground font-semibold mb-3 text-sm sm:text-base">{item.feature}</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-xs text-muted-foreground mb-1">AVChat</div>
                    <div className="text-primary font-medium text-sm">{item.avchat}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-muted-foreground mb-1">Others</div>
                    <div className="text-muted-foreground text-sm">{item.others}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table */}
          <div className="hidden lg:block bg-card/30 backdrop-blur-sm border border-border rounded-3xl p-6 lg:p-8 shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 lg:py-4 text-foreground font-semibold text-sm lg:text-base">
                      Feature
                    </th>
                    <th className="text-center py-3 lg:py-4 text-primary font-semibold text-sm lg:text-base">
                      AVChat
                    </th>
                    <th className="text-center py-3 lg:py-4 text-muted-foreground text-sm lg:text-base">
                      ChatGPT
                    </th>
                    <th className="text-center py-3 lg:py-4 text-muted-foreground text-sm lg:text-base">
                      Claude
                    </th>
                    <th className="text-center py-3 lg:py-4 text-muted-foreground text-sm lg:text-base">
                      Others
                    </th>
                  </tr>
                </thead>
                <tbody className="text-xs lg:text-sm">
                  <tr className="border-b border-border/50">
                    <td className="py-3 lg:py-4 text-foreground font-medium">Response Speed</td>
                    <td className="text-center py-3 lg:py-4">
                      <div className="flex items-center justify-center">
                        <Zap className="h-3 w-3 lg:h-4 lg:w-4 text-primary mr-1" />
                        <span className="text-primary font-medium text-xs lg:text-sm">
                          10x Faster
                        </span>
                      </div>
                    </td>
                    <td className="text-center py-3 lg:py-4 text-muted-foreground">
                      Standard
                    </td>
                    <td className="text-center py-3 lg:py-4 text-muted-foreground">
                      Slow
                    </td>
                    <td className="text-center py-3 lg:py-4 text-muted-foreground">
                      Varies
                    </td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-3 lg:py-4 text-foreground font-medium">Model Access</td>
                    <td className="text-center py-3 lg:py-4">
                      <div className="flex items-center justify-center">
                        <Brain className="h-3 w-3 lg:h-4 lg:w-4 text-primary mr-1" />
                        <span className="text-primary font-medium text-xs lg:text-sm">
                          All Models
                        </span>
                      </div>
                    </td>
                    <td className="text-center py-3 lg:py-4 text-muted-foreground">
                      GPT Only
                    </td>
                    <td className="text-center py-3 lg:py-4 text-muted-foreground">
                      Claude Only
                    </td>
                    <td className="text-center py-3 lg:py-4 text-muted-foreground">
                      Limited
                    </td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-3 lg:py-4 text-foreground font-medium">Device Sync</td>
                    <td className="text-center py-3 lg:py-4">
                      <div className="flex items-center justify-center">
                        <RefreshCw className="h-3 w-3 lg:h-4 lg:w-4 text-primary mr-1" />
                        <span className="text-primary font-medium text-xs lg:text-sm">
                          Real-time
                        </span>
                      </div>
                    </td>
                    <td className="text-center py-3 lg:py-4 text-muted-foreground">
                      Basic
                    </td>
                    <td className="text-center py-3 lg:py-4 text-muted-foreground">
                      None
                    </td>
                    <td className="text-center py-3 lg:py-4 text-muted-foreground">
                      Limited
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 lg:py-4 text-foreground font-medium">Privacy Level</td>
                    <td className="text-center py-3 lg:py-4">
                      <div className="flex items-center justify-center">
                        <Shield className="h-3 w-3 lg:h-4 lg:w-4 text-primary mr-1" />
                        <span className="text-primary font-medium text-xs lg:text-sm">
                          Maximum
                        </span>
                      </div>
                    </td>
                    <td className="text-center py-3 lg:py-4 text-muted-foreground">
                      Standard
                    </td>
                    <td className="text-center py-3 lg:py-4 text-muted-foreground">
                      Good
                    </td>
                    <td className="text-center py-3 lg:py-4 text-muted-foreground">
                      Varies
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Enhanced Social Proof */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-12">
            <h2 className="text-xl md:text-4xl font-bold text-foreground mb-4">
              Trusted by Professionals Worldwide
            </h2>
            <p className="text-lg text-muted-foreground">
              Join thousands of developers, researchers, and teams already using
              AVChat
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
            <div className="text-center group">
              <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-6 mb-4 group-hover:scale-105 transition-transform duration-300">
                <div className="text-xl md:text-4xl font-bold text-primary mb-1">
                  50K+
                </div>
                <div className="text-sm text-muted-foreground">
                  Active Users
                </div>
              </div>
            </div>

            <div className="text-center group">
              <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-6 mb-4 group-hover:scale-105 transition-transform duration-300">
                <div className="text-xl md:text-4xl font-bold text-primary mb-1">
                  5M+
                </div>
                <div className="text-sm text-muted-foreground">
                  Messages Sent
                </div>
              </div>
            </div>

            <div className="text-center group">
              <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-6 mb-4 group-hover:scale-105 transition-transform duration-300">
                <div className="text-xl md:text-4xl font-bold text-primary mb-1">
                  99.9%
                </div>
                <div className="text-sm text-muted-foreground">Uptime</div>
              </div>
            </div>

            <div className="text-center group">
              <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-6 mb-4 group-hover:scale-105 transition-transform duration-300">
                <div className="text-xl md:text-4xl font-bold text-primary mb-1">
                  4.9/5
                </div>
                <div className="text-sm text-muted-foreground">User Rating</div>
              </div>
            </div>
          </div>

          {/* Testimonials */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-6 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center mb-4">
                <div className="flex text-primary">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-current" />
                  ))}
                </div>
              </div>
              <p className="text-muted-foreground mb-4 italic">
                "AVChat is incredibly fast. I can get complex code explanations
                in seconds, not minutes."
              </p>
              <div className="flex items-center">
                <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center mr-3">
                  <span className="text-primary text-sm font-semibold">AS</span>
                </div>
                <div>
                  <div className="text-foreground font-medium text-sm">
                    Alex Smith
                  </div>
                  <div className="text-muted-foreground text-xs">
                    Senior Developer
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-6 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center mb-4">
                <div className="flex text-primary">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-current" />
                  ))}
                </div>
              </div>
              <p className="text-muted-foreground mb-4 italic">
                "The multi-model approach is game-changing. I can compare
                responses from different AIs instantly."
              </p>
              <div className="flex items-center">
                <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center mr-3">
                  <span className="text-primary text-sm font-semibold">MJ</span>
                </div>
                <div>
                  <div className="text-foreground font-medium text-sm">
                    Maria Johnson
                  </div>
                  <div className="text-muted-foreground text-xs">
                    AI Researcher
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-6 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center mb-4">
                <div className="flex text-primary">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-current" />
                  ))}
                </div>
              </div>
              <p className="text-muted-foreground mb-4 italic">
                "Privacy-first design with enterprise features. Perfect for our
                team's sensitive projects."
              </p>
              <div className="flex items-center">
                <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center mr-3">
                  <span className="text-primary text-sm font-semibold">DL</span>
                </div>
                <div>
                  <div className="text-foreground font-medium text-sm">
                    David Lee
                  </div>
                  <div className="text-muted-foreground text-xs">
                    CTO, TechCorp
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Responsive Demo Preview Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
          <div className="bg-gradient-to-br from-primary/5 via-transparent to-primary/5 rounded-2xl lg:rounded-3xl p-4 sm:p-6 lg:p-8">
            <div className="text-center mb-8 sm:mb-12">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-3 sm:mb-4">
                See AV<span className="text-primary">Chat</span> in Action
              </h2>
              <p className="text-base sm:text-lg text-muted-foreground">
                Watch how fast and intelligent our AI responses can be
              </p>
            </div>

            <div className="relative bg-card/80 backdrop-blur-md border border-border rounded-2xl lg:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-2xl max-w-4xl mx-auto">
              {/* Browser Controls */}
              <div className="absolute top-3 sm:top-4 left-3 sm:left-4 flex space-x-1.5 sm:space-x-2">
                <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-red-400 rounded-full"></div>
                <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-yellow-400 rounded-full"></div>
                <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-400 rounded-full"></div>
              </div>

              {/* Chat Interface */}
              <div className="mt-6 sm:mt-8">
                <div className="space-y-3 sm:space-y-4">
                  {/* User Message */}
                  <div className="flex justify-end">
                    <div className="bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-3 sm:px-4 py-2 sm:py-3 max-w-[280px] sm:max-w-xs lg:max-w-sm">
                      <p className="text-xs sm:text-sm">
                        How do I optimize this React component for better performance?
                      </p>
                    </div>
                  </div>

                  {/* AI Response */}
                  <div className="flex items-start space-x-2 sm:space-x-3">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center flex-shrink-0">
                      <Brain className="h-3 w-3 sm:h-4 sm:w-4 text-primary-foreground" />
                    </div>
                    <div className="bg-secondary/50 text-foreground rounded-2xl rounded-tl-sm px-3 sm:px-4 py-2 sm:py-3 max-w-[320px] sm:max-w-lg lg:max-w-xl">
                      <div className="flex items-center space-x-2 mb-1 sm:mb-2">
                        <span className="text-[10px] sm:text-xs font-medium text-primary">
                          GPT-4 • 0.8s
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm leading-relaxed">
                        Here are 5 key optimizations for your React component: 1) Use React.memo for preventing unnecessary re-renders, 2) Implement useMemo for expensive calculations...
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pricing Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Choose the plan that works for your needs, with access to
              cutting-edge AI models
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Free Plan */}
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/30 to-primary/10 rounded-3xl blur opacity-30 group-hover:opacity-70 transition duration-500"></div>
              <div className="relative bg-card border border-border rounded-3xl p-8 transition-all duration-300 group-hover:shadow-xl group-hover:translate-y-[-4px] h-full flex flex-col">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <span className="inline-block px-4 py-1.5 rounded-full text-xs font-medium bg-primary/10 text-primary mb-3">
                      Free
                    </span>
                    <h3 className="text-2xl font-bold text-foreground mb-1">
                      Starter
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      Perfect for trying out AVChat
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                    <Moon className="h-6 w-6" />
                  </div>
                </div>

                <div className="mb-6">
                  <span className="text-foreground text-3xl font-bold">$0</span>
                  <span className="text-muted-foreground">/month</span>
                </div>

                <ul className="space-y-4 mb-8 flex-1">
                  <li className="flex items-start">
                    <div className="mr-3 text-green-500 flex-shrink-0 mt-0.5">
                      <Check className="h-5 w-5" />
                    </div>
                    <span className="text-muted-foreground text-sm">
                      <strong className="text-foreground">200</strong> prompts
                      per month with free models
                      <span className="block text-xs mt-1">
                        (DeepSeek and Sarvam)
                      </span>
                    </span>
                  </li>
                  <li className="flex items-start">
                    <div className="mr-3 text-green-500 flex-shrink-0 mt-0.5">
                      <Check className="h-5 w-5" />
                    </div>
                    <span className="text-muted-foreground text-sm">
                      <strong className="text-foreground">20</strong> premium
                      model credits
                      <span className="block text-xs mt-1">
                        (Gemini, OpenAI)
                      </span>
                    </span>
                  </li>
                  <li className="flex items-start">
                    <div className="mr-3 text-green-500 flex-shrink-0 mt-0.5">
                      <Check className="h-5 w-5" />
                    </div>
                    <span className="text-muted-foreground text-sm">
                      <strong className="text-foreground">2</strong> super
                      premium model credits
                      <span className="block text-xs mt-1">
                        (Claude and Gemini 2.5 Pro)
                      </span>
                    </span>
                  </li>
                  <li className="flex items-start">
                    <div className="mr-3 text-green-500 flex-shrink-0 mt-0.5">
                      <Check className="h-5 w-5" />
                    </div>
                    <span className="text-muted-foreground text-sm">
                      Basic conversation history
                    </span>
                  </li>
                  <li className="flex items-start">
                    <div className="mr-3 text-green-500 flex-shrink-0 mt-0.5">
                      <Check className="h-5 w-5" />
                    </div>
                    <span className="text-muted-foreground text-sm">
                      Standard response speed
                    </span>
                  </li>
                </ul>

                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    onClick={handleGoogleLogin}
                    variant="outline"
                    className="w-full py-6 text-primary border-primary/50 hover:bg-primary/5"
                  >
                    Get Started Free
                  </Button>
                </motion.div>
              </div>
            </div>

            {/* Premium Plan */}
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-primary/60 rounded-3xl blur opacity-50 group-hover:opacity-100 transition duration-500"></div>
              <div className="relative bg-card border border-primary/20 rounded-3xl p-8 transition-all duration-300 group-hover:shadow-xl group-hover:translate-y-[-4px] h-full flex flex-col">
                <div className="absolute top-0 right-8 transform -translate-y-1/2">
                  <div className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-xs font-medium">
                    Popular
                  </div>
                </div>

                <div className="flex items-start justify-between mb-6">
                  <div>
                    <span className="inline-block px-4 py-1.5 rounded-full text-xs font-medium bg-primary/20 text-primary mb-3">
                      Premium
                    </span>
                    <h3 className="text-2xl font-bold text-foreground mb-1">
                      Pro
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      For power users who need more
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-primary/20 rounded-2xl flex items-center justify-center text-primary">
                    <Sparkles className="h-6 w-6" />
                  </div>
                </div>

                <div className="mb-6">
                  <span className="text-foreground text-3xl font-bold">$10</span>
                  <span className="text-muted-foreground">/month</span>
                </div>

                <ul className="space-y-4 mb-8 flex-1">
                  <li className="flex items-start">
                    <div className="mr-3 text-green-500 flex-shrink-0 mt-0.5">
                      <Check className="h-5 w-5" />
                    </div>
                    <span className="text-muted-foreground text-sm">
                      <strong className="text-foreground">Unlimited</strong>{" "}
                      prompts with free models
                      <span className="block text-xs mt-1">
                        (DeepSeek and Sarvam)
                      </span>
                    </span>
                  </li>
                  <li className="flex items-start">
                    <div className="mr-3 text-green-500 flex-shrink-0 mt-0.5">
                      <Check className="h-5 w-5" />
                    </div>
                    <span className="text-muted-foreground text-sm">
                      <strong className="text-foreground">600</strong> premium
                      model credits
                      <span className="block text-xs mt-1">
                        (Gemini, OpenAI)
                      </span>
                    </span>
                  </li>
                  <li className="flex items-start">
                    <div className="mr-3 text-green-500 flex-shrink-0 mt-0.5">
                      <Check className="h-5 w-5" />
                    </div>
                    <span className="text-muted-foreground text-sm">
                      <strong className="text-foreground">30</strong> super
                      premium model credits
                      <span className="block text-xs mt-1">
                        (Claude and Gemini 2.5 Pro)
                      </span>
                    </span>
                  </li>
                  <li className="flex items-start">
                    <div className="mr-3 text-green-500 flex-shrink-0 mt-0.5">
                      <Check className="h-5 w-5" />
                    </div>
                    <span className="text-muted-foreground text-sm">
                      Priority response speed
                    </span>
                  </li>
                  <li className="flex items-start">
                    <div className="mr-3 text-green-500 flex-shrink-0 mt-0.5">
                      <Check className="h-5 w-5" />
                    </div>
                    <span className="text-muted-foreground text-sm">
                      Advanced conversation history
                    </span>
                  </li>
                  <li className="flex items-start">
                    <div className="mr-3 text-green-500 flex-shrink-0 mt-0.5">
                      <Check className="h-5 w-5" />
                    </div>
                    <span className="text-muted-foreground text-sm">
                      Priority support
                    </span>
                  </li>
                </ul>

                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button className="w-full py-6 bg-primary hover:bg-primary/90 text-primary-foreground">
                    Upgrade to Pro
                  </Button>
                </motion.div>
              </div>
            </div>

            {/* Enterprise Plan */}
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600/30 to-primary/30 rounded-3xl blur opacity-30 group-hover:opacity-70 transition duration-500"></div>
              <div className="relative bg-card border border-border rounded-3xl p-8 transition-all duration-300 group-hover:shadow-xl group-hover:translate-y-[-4px] h-full flex flex-col">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <span className="inline-block px-4 py-1.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-500 mb-3">
                      Enterprise
                    </span>
                    <h3 className="text-2xl font-bold text-foreground mb-1">
                      Organization
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      For teams and businesses
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500">
                    <Building2 className="h-6 w-6" />
                  </div>
                </div>

                <div className="mb-6">
                  <span className="text-foreground text-3xl font-bold">
                    Custom
                  </span>
                  <span className="text-muted-foreground"> quote</span>
                </div>

                <ul className="space-y-4 mb-8 flex-1">
                  <li className="flex items-start">
                    <div className="mr-3 text-green-500 flex-shrink-0 mt-0.5">
                      <Check className="h-5 w-5" />
                    </div>
                    <span className="text-muted-foreground text-sm">
                      <strong className="text-foreground">Unlimited</strong>{" "}
                      access to all models
                    </span>
                  </li>
                  {/* <li className="flex items-start">
                    <div className="mr-3 text-green-500 flex-shrink-0 mt-0.5">
                      <Check className="h-5 w-5" />
                    </div>
                    <span className="text-muted-foreground text-sm">
                      Team collaboration features
                    </span>
                  </li> */}
                  <li className="flex items-start">
                    <div className="mr-3 text-green-500 flex-shrink-0 mt-0.5">
                      <Check className="h-5 w-5" />
                    </div>
                    <span className="text-muted-foreground text-sm">
                      Custom API integration
                    </span>
                  </li>
                  <li className="flex items-start">
                    <div className="mr-3 text-green-500 flex-shrink-0 mt-0.5">
                      <Check className="h-5 w-5" />
                    </div>
                    <span className="text-muted-foreground text-sm">
                      Dedicated account manager
                    </span>
                  </li>
                  <li className="flex items-start">
                    <div className="mr-3 text-green-500 flex-shrink-0 mt-0.5">
                      <Check className="h-5 w-5" />
                    </div>
                    <span className="text-muted-foreground text-sm">
                      Advanced security features
                    </span>
                  </li>
                  <li className="flex items-start">
                    <div className="mr-3 text-green-500 flex-shrink-0 mt-0.5">
                      <Check className="h-5 w-5" />
                    </div>
                    <span className="text-muted-foreground text-sm">
                      Custom model fine-tuning
                    </span>
                  </li>
                </ul>

                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    variant="outline"
                    className="w-full py-6 text-foreground border-foreground/20 hover:bg-accent"
                    onClick={() =>
                      (window.location.href = "mailto:connect@ayush-sharma.in")
                    }
                  >
                    <Mail className="mr-2 h-5 w-5" />
                    Contact CEO
                  </Button>
                </motion.div>
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="mt-20">
            <h3 className="text-2xl font-bold text-center mb-8 text-foreground">
              Frequently Asked Questions
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              <div className="bg-card/50 hover:scale-105 transition-transform duration-300 border border-border rounded-xl p-6">
                <h4 className="text-foreground font-medium mb-2">
                  How do model credits work?
                </h4>
                <p className="text-muted-foreground text-sm">
                  Each interaction with premium models consumes one credit. Free
                  models don't consume credits and are only limited by monthly
                  prompt caps on free plans.
                </p>
              </div>

              <div className="bg-card/50 hover:scale-105 transition-transform duration-300 border border-border rounded-xl p-6">
                <h4 className="text-foreground font-medium mb-2">
                  Can I upgrade or downgrade my plan?
                </h4>
                <p className="text-muted-foreground text-sm">
                  Yes, you can upgrade or downgrade your plan at any time.
                  Changes will be applied at the start of the next billing
                  cycle.
                </p>
              </div>

              <div className="bg-card/50 hover:scale-105 transition-transform duration-300 border border-border rounded-xl p-6">
                <h4 className="text-foreground font-medium mb-2">
                  Do credits roll over to the next month?
                </h4>
                <p className="text-muted-foreground text-sm">
                  No, unused credits don't roll over. Each month your account is
                  refreshed with new credits according to your plan.
                </p>
              </div>

              <div className="bg-card/50 hover:scale-105 transition-transform duration-300 border border-border rounded-xl p-6">
                <h4 className="text-foreground font-medium mb-2">
                  What happens if I run out of credits?
                </h4>
                <p className="text-muted-foreground text-sm">
                  You can continue using free models, or purchase additional
                  credit packs to continue using premium models before your next
                  renewal.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Final Call to Action - Improved responsive spacing */}
        <div className="max-w-4xl mx-auto px-3 xs:px-4 sm:px-6 lg:px-8 py-10 sm:py-16 lg:py-20 text-center">
          <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 rounded-2xl sm:rounded-3xl p-4 xs:p-6 sm:p-8 lg:p-12 border border-primary/20">
            <h2 className="text-xl xs:text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-3 sm:mb-4">
              Ready to Experience the Future?
            </h2>
            <p className="text-sm xs:text-base sm:text-lg text-muted-foreground mb-5 xs:mb-6 sm:mb-8 max-w-2xl mx-auto">
              Join 50,000+ users who've already made the switch to faster,
              smarter AI conversations. Start your journey today - completely
              free.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-2xl mx-auto">
              <Button
                onClick={handleGoogleLogin}
                size="lg"
                className="btn-optimized group w-full sm:w-auto sm:min-w-[200px] flex items-center justify-center space-x-3 bg-gradient-to-r from-[#ff6b3d] to-[#ff8c3d] hover:from-[#ff5722] hover:to-[#ff7043] text-white shadow-lg hover:shadow-xl hover:shadow-blue-500/25 px-6 py-4 text-base font-semibold rounded-xl"
                disabled={loading}
              >
                <GoogleIcon className="h-5 w-5 flex-shrink-0" />
                <span>Start with Google</span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-200 flex-shrink-0" />
              </Button>

              <Button
                onClick={handleGitHubLogin}
                size="lg"
                variant="outline"
                className="btn-optimized group w-full sm:w-auto sm:min-w-[200px] flex items-center justify-center space-x-3 border-2 border-foreground/20 hover:border-foreground/40 bg-card/50 hover:bg-card/80 text-foreground shadow-lg hover:shadow-xl px-6 py-4 text-base font-semibold rounded-xl backdrop-blur-sm"
                disabled={loading}
              >
                <GitHubIcon className="h-5 w-5 flex-shrink-0" />
                <span>Start with GitHub</span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-200 flex-shrink-0" />
              </Button>
            </div>

            <div className="flex flex-col xs:flex-row items-center justify-center gap-2 xs:gap-3 sm:gap-6 mt-4 xs:mt-5 sm:mt-6 text-[10px] xs:text-xs sm:text-sm text-muted-foreground/70">
              <div className="flex items-center space-x-1">
                <CheckCircle className="h-2.5 w-2.5 xs:h-3 xs:w-3 sm:h-4 sm:w-4 text-green-500" />
                <span>Free forever plan</span>
              </div>
              <div className="flex items-center space-x-1">
                <CheckCircle className="h-2.5 w-2.5 xs:h-3 xs:w-3 sm:h-4 sm:w-4 text-green-500" />
                <span>Setup in 30 seconds</span>
              </div>
            </div>
          </div>
        </div>

        {/* Minimalistic Footer */}
        <footer className="bg-card/30 backdrop-blur-sm border-t border-border/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            <div className="flex flex-col items-center space-y-4 sm:space-y-6">
              {/* Logo and Brand */}
              <div className="justify-center flex flex-col md:flex-row gap-2.5 md:justify-between w-full md:px-10">
                <div className="flex justify-center items-center space-x-2">
                  <img
                    src="/logo.png"
                    alt="AVChat Logo"
                    className="h-6 w-6 sm:h-8 sm:w-8"
                  />
                  <span className="text-lg sm:text-xl font-bold text-foreground">
                    AV<span className="text-primary">Chat</span>
                  </span>
                </div>

                {/* Social Icons */}
                <div className="flex items-center justify-center space-x-4 sm:space-x-6">
                  <a
                    href="https://github.com/CyberBoyAyush/AVChat"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group p-2 rounded-full bg-secondary/50 hover:bg-primary/10 transition-all duration-200"
                  >
                    <GitHubIcon className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground group-hover:text-primary transition-colors" />
                  </a>

                  <a
                    href="https://x.com/CyberBoyAyush"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group p-2 rounded-full bg-secondary/50 hover:bg-primary/10 transition-all duration-200"
                  >
                    <svg
                      className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground group-hover:text-primary transition-colors"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                  </a>

                  <a
                    href="mailto:connect@ayush-sharma.in"
                    className="group p-2 rounded-full bg-secondary/50 hover:bg-primary/10 transition-all duration-200"
                  >
                    <Mail className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground group-hover:text-primary transition-colors" />
                  </a>
                </div>
              </div>

              {/* Copyright */}
              <div className="text-center">
                <p className="text-xs sm:text-sm text-muted-foreground">
                  © 2025 AVChat. Built with ❤️ for the AI community.
                </p>
                <div className="flex items-center justify-center space-x-2 mt-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-muted-foreground">
                    All systems operational
                  </span>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default HomePage;
