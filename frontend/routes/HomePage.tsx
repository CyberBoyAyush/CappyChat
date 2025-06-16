/**
 * Home Page Component
 *
 * Entry point for the application with authentication options.
 * Features modern design with login and signup options.
 */

"use client";

import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/frontend/components/ui/button";
import { useAuth } from "@/frontend/contexts/AuthContext";
import AuthRedirectGuard from "@/frontend/components/AuthRedirectGuard";
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
  Target,
  Rocket,
  Palette,
  Music,
  Camera,
  FileText,
  Download,
  Upload,
  Share2,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Volume2,
  VolumeX,
  Sun,
  CloudRain,
  Wind,
  Snowflake,
} from "lucide-react";
import { GoogleIcon, GitHubIcon } from "@/frontend/components/ui/icons";
import { ThemeToggleButton } from "@/frontend/components/ui/ThemeComponents";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import LLMMarquee from "@/frontend/components/ui/marquee";

// Floating background icons data
const floatingIcons = [
  { Icon: MessageSquare, delay: 0, duration: 20, x: 10 },
  { Icon: Code, delay: 2, duration: 25, x: 85, y: 15 },
  { Icon: Database, delay: 4, duration: 30, x: 15, y: 70 },
  { Icon: Wifi, delay: 1, duration: 22, x: 90, y: 80 },
  { Icon: Settings, delay: 3, duration: 28, x: 70, y: 30 },
  { Icon: Search, delay: 5, duration: 24, x: 25, y: 50 },
  { Icon: Heart, delay: 1.5, duration: 26, x: 80, y: 60 },
  { Icon: Lightbulb, delay: 3.5, duration: 32, x: 40, y: 10 },
  { Icon: Target, delay: 2.5, duration: 27, x: 60, y: 85 },
  { Icon: Rocket, delay: 4.5, duration: 23, x: 5, y: 40 },
  { Icon: Palette, delay: 0.5, duration: 29, x: 95, y: 25 },
  { Icon: Music, delay: 6, duration: 21, x: 35, y: 90 },
  { Icon: Camera, delay: 1.8, duration: 31, x: 75, y: 5 },
  { Icon: FileText, delay: 3.2, duration: 26, x: 20, y: 35 },
  { Icon: Share2, delay: 4.8, duration: 24, x: 85, y: 45 },
  { Icon: Lock, delay: 2.2, duration: 28, x: 50, y: 75 },
  { Icon: Eye, delay: 5.5, duration: 25, x: 65 },
  { Icon: Volume2, delay: 0.8, duration: 30, x: 30, y: 65 },
  { Icon: Sun, delay: 3.8, duration: 22, x: 10, y: 55 },
  { Icon: Wind, delay: 4.2, duration: 27, x: 90, y: 35 },
];

const HomePage: React.FC = () => {
  const { loading, loginWithGoogle, loginWithGitHub } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // For animated background blobs
  const [mousePosition, setMousePosition] = useState({ x: 0 });

  // Handle mouse movement for interactive gradients
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: e.clientX / window.innerWidth,
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  // Remove manual redirection logic - handled by AuthRedirectGuard

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
    <AuthRedirectGuard>
      <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Fixed gradient elements */}
      <div className="absolute top-0 left-0 w-full h-full z-0">
        <div className="absolute top-0 left-1/4 w-[30rem] h-[30rem] rounded-full bg-primary/5 blur-[8rem] -translate-y-1/2" />
        <div className="absolute bottom-0 right-1/4 w-[30rem] h-[30rem] rounded-full bg-primary/3 blur-[8rem] translate-y-1/3" />

        {/* Additional gradient orbs for more depth */}
        <div className="absolute top-1/3 right-1/3 w-[20rem] h-[20rem] rounded-full bg-primary/2 blur-[6rem]" />
        <div className="absolute bottom-1/3 left-1/3 w-[25rem] h-[25rem] rounded-full bg-primary/3 blur-[7rem]" />
        <div className="absolute top-2/3 left-1/2 w-[15rem] h-[15rem] rounded-full bg-primary/4 blur-[5rem]" />
      </div>

      {/* Floating Background Icons */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {floatingIcons.map((item, index) => (
          <motion.div
            key={index}
            className="absolute opacity-10 dark:opacity-[0.05]"
            style={{
              left: `${item.x}%`,
              top: `${item.y}%`,
            }}
            animate={{
              y: [0, -30, 0],
              x: [0, 15, 0],
              rotate: [0, 360],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: item.duration,
              delay: item.delay,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <item.Icon className="h-8 w-8 sm:h-12 sm:w-12 lg:h-16 lg:w-16 text-primary" />
          </motion.div>
        ))}

        {/* Additional floating elements for more visual interest */}
        <motion.div
          className="absolute top-1/4 left-1/4 w-2 h-2 bg-primary/20 rounded-full"
          animate={{
            scale: [1, 2, 1],
            opacity: [0.2, 0.8, 0.2],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute top-3/4 right-1/3 w-3 h-3 bg-primary/15 rounded-full"
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.3, 0.7, 0.3],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2,
          }}
        />
        <motion.div
          className="absolute top-1/2 right-1/4 w-1.5 h-1.5 bg-primary/10 rounded-full"
          animate={{
            scale: [1, 3, 1],
            opacity: [0.1, 0.6, 0.1],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 4,
          }}
        />
      </div>

      {/* Enhanced Navigation Header */}
      <nav className="fixed top-0 w-full z-50 bg-gradient-to-r from-background/95 via-background/90 to-background/95 backdrop-blur-lg border-b border-border/50 shadow-lg shadow-primary/5">
        <div className="absolute inset-0  opacity-50" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="flex justify-between items-center h-16 sm:h-18">
            <motion.div
              className="flex items-center space-x-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <motion.div
                whileHover={{
                  scale: 1.1,
                  rotate: [0, 10, -10, 0],
                  transition: { duration: 0.6 },
                }}
                className="relative"
              >
                <motion.div
                  className="absolute inset-0 bg-primary/20 rounded-full blur-md"
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.6, 0.3],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatType: "reverse",
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
              className="flex items-center space-x-1 xs:space-x-2 sm:space-x-3 lg:space-x-4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <ThemeToggleButton variant="inline" />
              <Link to="/auth/login">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center space-x-1 xs:space-x-1.5 sm:space-x-2 text-xs sm:text-sm font-medium px-2 xs:px-3 sm:px-4 py-1.5 md:py-5 rounded-sm sm:rounded-md hover:bg-secondary/80 transition-all duration-300"
                  >
                    <LogIn className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden md:block">Login</span>
                  </Button>
                </motion.div>
              </Link>
              <Link to="/auth/signup">
                <motion.div
                  whileHover={{ scale: 1.05, y: -1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    size="sm"
                    className="flex items-center justify-center space-x-1 xs:space-x-1.5 sm:space-x-2 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground text-xs sm:text-sm font-semibold px-2 md:px-7 py-1.5 md:py-5 rounded-sm sm:rounded-md shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <UserPlus className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden md:flex">Sign Up</span>
                  </Button>
                </motion.div>
              </Link>
            </motion.div>
          </div>
        </div>
      </nav>

      {/* Enhanced Hero Section */}
      <main className="pt-12 sm:pt-20 relative z-10">
        <div className=" max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-12 md:py-20 lg:py-20">
          <div className="text-center relative">
            {/* Hero background glow */}
            <div className="absolute inset-0  blur-3xl opacity-30 rounded-full transform scale-150" />
            <motion.div
              className="flex justify-center mb-4 sm:mb-8"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                duration: 0.5,
                ease: "easeOut",
              }}
            >
              <div className="relative">
                <motion.div
                  className="absolute inset-0 bg-primary rounded-xl opacity-20"
                  animate={{
                    scale: [1, 1.1, 1],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    repeatType: "reverse",
                  }}
                />
                <motion.div
                  className="absolute inset-0 bg-primary rounded-xl opacity-10"
                  animate={{
                    scale: [1, 1.3, 1],
                  }}
                  transition={{
                    duration: 6,
                    repeat: Infinity,
                    repeatType: "reverse",
                  }}
                />
                <motion.img
                  src="/logo.png"
                  alt="Hero Background"
                  className="h-16 w-16 sm:h-20 sm:w-20 relative z-10"
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    repeatType: "reverse",
                  }}
                />
              </div>
            </motion.div>

            <motion.div
              className="space-y-3 sm:space-y-6 mb-8 sm:mb-12"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.2 }}
            >
              <h1 className="text-3xl xs:text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold text-foreground leading-tight px-1 sm:px-0">
                The Future of{" "}
                <span className="relative inline-block">
                  <motion.span
                    className="bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text text-transparent"
                    animate={{
                      backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                    }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      repeatType: "reverse",
                      ease: "easeInOut",
                    }}
                    style={{
                      backgroundSize: "200% auto",
                    }}
                  >
                    AI Conversations
                  </motion.span>
                </span>
              </h1>

              <motion.p
                className="text-base xs:text-lg sm:text-xl md:text-2xl lg:text-3xl text-muted-foreground max-w-4xl mx-auto leading-relaxed px-2 sm:px-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
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

            {/* Enhanced Feature Pills */}
            <motion.div
              className="flex flex-wrap justify-center gap-2 xs:gap-3 sm:gap-4 mb-8 sm:mb-12 lg:mb-16 px-2 sm:px-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.6 }}
            >
              {/* Floating particles around pills */}
              <div className="absolute inset-0 pointer-events-none">
                {[...Array(6)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-1 h-1 bg-primary/30 rounded-full"
                    style={{
                      left: `${20 + i * 15}%`,
                      top: `${40 + (i % 2) * 20}%`,
                    }}
                    animate={{
                      y: [0, -20, 0],
                      opacity: [0.3, 0.8, 0.3],
                    }}
                    transition={{
                      duration: 3 + i,
                      repeat: Infinity,
                      delay: i * 0.5,
                    }}
                  />
                ))}
              </div>
              <motion.div
                whileHover={{ scale: 1.05, y: -3 }}
                whileTap={{ scale: 0.95 }}
                className="group relative overflow-hidden bg-gradient-to-r from-primary/10 via-primary/15 to-primary/20 hover:from-primary/20 hover:via-primary/25 hover:to-primary/30 text-primary px-3 xs:px-4 sm:px-6 py-2 xs:py-2.5 sm:py-3 rounded-full text-xs sm:text-sm lg:text-base font-semibold border border-primary/30 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/25 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.7 }}
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                  animate={{ x: ["-100%", "100%"] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                />
                <motion.div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-primary/3 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <Zap className="h-3 w-3 sm:h-4 sm:w-4 inline mr-1.5 sm:mr-2 group-hover:animate-pulse relative z-10" />
                <span className="hidden xs:inline relative z-10">10x</span>{" "}
                <span className="relative z-10">Faster Response</span>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05, y: -3 }}
                whileTap={{ scale: 0.95 }}
                className="group relative overflow-hidden bg-gradient-to-r from-secondary/40 via-secondary/50 to-secondary/60 hover:from-secondary/60 hover:via-secondary/70 hover:to-secondary/80 text-foreground px-3 xs:px-4 sm:px-6 py-2 xs:py-2.5 sm:py-3 rounded-full text-xs sm:text-sm lg:text-base font-semibold border border-border hover:border-primary/30 transition-all duration-300 hover:shadow-lg backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.8 }}
              >
                <motion.div className="absolute inset-0 bg-gradient-to-r from-primary/3 to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <Brain className="h-3 w-3 sm:h-4 sm:w-4 inline mr-1.5 sm:mr-2  relative z-10" />
                <span className="relative z-10">Multi-Model AI</span>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05, y: -3 }}
                whileTap={{ scale: 0.95 }}
                className="group relative overflow-hidden bg-gradient-to-r from-secondary/40 via-secondary/50 to-secondary/60 hover:from-secondary/60 hover:via-secondary/70 hover:to-secondary/80 text-foreground px-3 xs:px-4 sm:px-6 py-2 xs:py-2.5 sm:py-3 rounded-full text-xs sm:text-sm lg:text-base font-semibold border border-border hover:border-primary/30 transition-all duration-300 hover:shadow-lg backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.9 }}
              >
                <motion.div className="absolute inset-0 bg-gradient-to-r from-primary/3 to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4 inline mr-1.5 sm:mr-2 group-hover:animate-spin relative z-10" />
                <span className="relative z-10">Real-time Sync</span>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05, y: -3 }}
                whileTap={{ scale: 0.95 }}
                className="group relative overflow-hidden bg-gradient-to-r from-secondary/40 via-secondary/50 to-secondary/60 hover:from-secondary/60 hover:via-secondary/70 hover:to-secondary/80 text-foreground px-3 xs:px-4 sm:px-6 py-2 xs:py-2.5 sm:py-3 rounded-full text-xs sm:text-sm lg:text-base font-semibold border border-border hover:border-primary/30 transition-all duration-300 hover:shadow-lg backdrop-blur-sm"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 1.0 }}
              >
                <motion.div className="absolute inset-0 bg-gradient-to-r from-primary/3 to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <Shield className="h-3 w-3 sm:h-4 sm:w-4 inline mr-1.5 sm:mr-2 group-hover:animate-pulse relative z-10" />
                <span className="relative z-10">Privacy First</span>
              </motion.div>
            </motion.div>

            {/* Enhanced Authentication Buttons */}
            <motion.div
              className="flex flex-col items-center gap-4 sm:gap-6 lg:gap-8 mb-8 sm:mb-12 px-2 sm:px-4 relative"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.8 }}
            >
              {/* Glow effect behind buttons */}
              <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-primary/10 blur-2xl opacity-50 rounded-3xl" />
              {/* Primary CTA Buttons */}
              <div className="flex flex-col md:flex-row gap-3 sm:gap-4 w-full align-middle justify-center max-w-4xl">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-fit sm:w-auto self-center align-middle"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6 }}
                >
                  <Button
                    onClick={handleGoogleLogin}
                    size="lg"
                    className="group relative w-full sm:w-auto sm:min-w-[260px] md:min-w-[280px] lg:min-w-[300px] flex items-center justify-center space-x-2 sm:space-x-3 bg-gradient-to-r from-primary via-primary/95 to-primary/90 hover:from-primary/95 hover:via-primary hover:to-primary text-primary-foreground shadow-xl hover:shadow-2xl hover:shadow-primary/25 transition-all duration-500 transform px-4 sm:px-6 py-4 md:py-7 text-sm sm:text-base lg:text-lg font-semibold rounded-lg sm:rounded-xl md:rounded-2xl overflow-hidden backdrop-blur-sm border border-primary/20"
                    disabled={loading}
                  >
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        repeatDelay: 4,
                      }}
                    />
                    <GoogleIcon className="h-5 w-5 sm:h-6 sm:w-6 relative z-10 flex-shrink-0" />
                    <span className="relative z-10 text-center leading-tight">
                      Google
                    </span>
                    <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 relative z-10 group-hover:translate-x-1 transition-transform duration-300 flex-shrink-0" />
                  </Button>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-fit sm:w-auto self-center align-middle"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6 }}
                >
                  <Button
                    onClick={handleGitHubLogin}
                    size="lg"
                    variant="outline"
                    className="group relative w-full sm:w-auto sm:min-w-[260px] md:min-w-[280px] lg:min-w-[300px] flex items-center justify-center space-x-2 sm:space-x-3 border-2 border-primary/50 hover:border-primary bg-gradient-to-r from-background/80 via-background/90 to-background/80 hover:from-primary/5 hover:via-primary/10 hover:to-primary/5 text-foreground shadow-xl hover:shadow-2xl hover:shadow-primary/15 transition-all duration-500 transform px-4 sm:px-6 py-4 md:py-7 text-sm sm:text-base lg:text-lg font-semibold rounded-lg sm:rounded-xl md:rounded-2xl backdrop-blur-sm"
                    disabled={loading}
                  >
                    <GitHubIcon className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0" />
                    <span className="text-center leading-tight">GitHub</span>
                    <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform duration-300 flex-shrink-0" />
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
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
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
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
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
              className="group relative bg-gradient-to-br from-card/50 to-card/30 backdrop-blur-sm border border-border rounded-3xl p-4 md:p-8 hover:bg-card/80 transition-all duration-500 hover:shadow-2xl hover:scale-105"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
              whileHover={{ y: -5 }}
            >
              {/* Card glow effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl" />
              <div className="bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl h-16 w-16 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
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
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
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
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
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
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
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
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
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
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
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

        <LLMMarquee />

        {/* Comparison Section */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Why Switch to AV<span className="text-primary">Chat</span> ?
            </h2>
            <p className="text-lg text-muted-foreground">
              See how we compare to other AI platforms
            </p>
          </div>

          {/* Table view for desktop/tablet */}
          <div className="hidden sm:block overflow-x-auto bg-accent/20 p-11 rounded-3xl border-[1px] border-border">
            <table className="w-full min-w-[600px] text-xs sm:text-base">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-4 text-foreground font-semibold">
                    Feature
                  </th>
                  <th className="text-center py-4 text-primary font-semibold">
                    AVChat
                  </th>
                  <th className="text-center py-4 text-muted-foreground">
                    ChatGPT
                  </th>
                  <th className="text-center py-4 text-muted-foreground">
                    Claude
                  </th>
                  <th className="text-center py-4 text-muted-foreground">
                    Others
                  </th>
                </tr>
              </thead>
              <tbody className="text-sm">
                <tr className="border-b border-border/50">
                  <td className="py-4 text-foreground">Response Speed</td>
                  <td className="text-center py-4">
                    <div className="flex items-center justify-center">
                      <Zap className="h-4 w-4 text-primary mr-1" />
                      <span className="text-primary font-medium">
                        10x Faster
                      </span>
                    </div>
                  </td>
                  <td className="text-center py-4 text-muted-foreground">
                    Standard
                  </td>
                  <td className="text-center py-4 text-muted-foreground">
                    Slow
                  </td>
                  <td className="text-center py-4 text-muted-foreground">
                    Varies
                  </td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-4 text-foreground">Model Access</td>
                  <td className="text-center py-4">
                    <div className="flex items-center justify-center">
                      <Brain className="h-4 w-4 text-primary mr-1" />
                      <span className="text-primary font-medium">
                        All Models
                      </span>
                    </div>
                  </td>
                  <td className="text-center py-4 text-muted-foreground">
                    GPT Only
                  </td>
                  <td className="text-center py-4 text-muted-foreground">
                    Claude Only
                  </td>
                  <td className="text-center py-4 text-muted-foreground">
                    Limited
                  </td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-4 text-foreground">Device Sync</td>
                  <td className="text-center py-4">
                    <div className="flex items-center justify-center">
                      <RefreshCw className="h-4 w-4 text-primary mr-1" />
                      <span className="text-primary font-medium">
                        Real-time
                      </span>
                    </div>
                  </td>
                  <td className="text-center py-4 text-muted-foreground">
                    Basic
                  </td>
                  <td className="text-center py-4 text-muted-foreground">
                    None
                  </td>
                  <td className="text-center py-4 text-muted-foreground">
                    Limited
                  </td>
                </tr>
                <tr>
                  <td className="py-4 text-foreground">Privacy Level</td>
                  <td className="text-center py-4">
                    <div className="flex items-center justify-center">
                      <Shield className="h-4 w-4 text-primary mr-1" />
                      <span className="text-primary font-medium">Maximum</span>
                    </div>
                  </td>
                  <td className="text-center py-4 text-muted-foreground">
                    Standard
                  </td>
                  <td className="text-center py-4 text-muted-foreground">
                    Good
                  </td>
                  <td className="text-center py-4 text-muted-foreground">
                    Varies
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Card view for mobile */}
          <div className="block sm:hidden space-y-4">
            {/* Response Speed */}
            <div className="bg-card/30 border border-border rounded-2xl p-4 flex flex-col gap-2 shadow">
              <div className="text-foreground font-semibold">
                Response Speed
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium text-primary">AVChat</span>
                <span className="flex items-center text-primary font-medium">
                  <Zap className="h-4 w-4 mr-1" />
                  10x Faster
                </span>
              </div>
              <div className="flex justify-between text-muted-foreground text-sm">
                <span>ChatGPT</span> <span>Standard</span>
              </div>
              <div className="flex justify-between text-muted-foreground text-sm">
                <span>Claude</span> <span>Slow</span>
              </div>
              <div className="flex justify-between text-muted-foreground text-sm">
                <span>Others</span> <span>Varies</span>
              </div>
            </div>
            {/* Model Access */}
            <div className="bg-card/30 border border-border rounded-2xl p-4 flex flex-col gap-2 shadow">
              <div className="text-foreground font-semibold">Model Access</div>
              <div className="flex justify-between items-center">
                <span className="font-medium text-primary">AVChat</span>
                <span className="flex items-center text-primary font-medium">
                  <Brain className="h-4 w-4 mr-1" />
                  All Models
                </span>
              </div>
              <div className="flex justify-between text-muted-foreground text-sm">
                <span>ChatGPT</span> <span>GPT Only</span>
              </div>
              <div className="flex justify-between text-muted-foreground text-sm">
                <span>Claude</span> <span>Claude Only</span>
              </div>
              <div className="flex justify-between text-muted-foreground text-sm">
                <span>Others</span> <span>Limited</span>
              </div>
            </div>
            {/* Device Sync */}
            <div className="bg-card/30 border border-border rounded-2xl p-4 flex flex-col gap-2 shadow">
              <div className="text-foreground font-semibold">Device Sync</div>
              <div className="flex justify-between items-center">
                <span className="font-medium text-primary">AVChat</span>
                <span className="flex items-center text-primary font-medium">
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Real-time
                </span>
              </div>
              <div className="flex justify-between text-muted-foreground text-sm">
                <span>ChatGPT</span> <span>Basic</span>
              </div>
              <div className="flex justify-between text-muted-foreground text-sm">
                <span>Claude</span> <span>None</span>
              </div>
              <div className="flex justify-between text-muted-foreground text-sm">
                <span>Others</span> <span>Limited</span>
              </div>
            </div>
            {/* Privacy Level */}
            <div className="bg-card/30 border border-border rounded-2xl p-4 flex flex-col gap-2 shadow">
              <div className="text-foreground font-semibold">Privacy Level</div>
              <div className="flex justify-between items-center">
                <span className="font-medium text-primary">AVChat</span>
                <span className="flex items-center text-primary font-medium">
                  <Shield className="h-4 w-4 mr-1" />
                  Maximum
                </span>
              </div>
              <div className="flex justify-between text-muted-foreground text-sm">
                <span>ChatGPT</span> <span>Standard</span>
              </div>
              <div className="flex justify-between text-muted-foreground text-sm">
                <span>Claude</span> <span>Good</span>
              </div>
              <div className="flex justify-between text-muted-foreground text-sm">
                <span>Others</span> <span>Varies</span>
              </div>
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

        {/* Demo Preview Section */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 bg-gradient-to-br rounded-2xl from-primary/5 via-transparent to-primary/5">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              See AV<span className="text-primary">Chat</span> in Action
            </h2>
            <p className="text-lg text-muted-foreground">
              Watch how fast and intelligent our AI responses can be
            </p>
          </div>

          <div className="relative bg-card/80 backdrop-blur-md border border-border rounded-3xl p-4 md:p-8 shadow-2xl">
            <div className="absolute top-4 left-4 flex space-x-2">
              <div className="w-3 h-3 bg-red-400 rounded-full"></div>
              <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
              <div className="w-3 h-3 bg-green-400 rounded-full"></div>
            </div>

            <div className="mt-8">
              <div className="space-y-4">
                <div className="flex justify-end">
                  <div className="bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-4 py-3 max-w-xs">
                    How do I optimize this React component for better
                    performance?
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 min-w-8 min-h-8 aspect-square shrink-0 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center">
                    <Brain className="h-4 w-4 text-primary-foreground" />
                  </div>

                  <div className="bg-secondary/50 text-foreground rounded-2xl rounded-tl-sm px-4 py-3 max-w-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-xs font-medium text-primary">
                        GPT-4 • 0.8s
                      </span>
                    </div>
                    <p className="text-sm">
                      Here are 5 key optimizations for your React component: 1)
                      Use React.memo for preventing unnecessary re-renders, 2)
                      Implement useMemo for expensive calculations...
                    </p>
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
                  <span className="text-foreground text-3xl font-bold">
                    $10
                  </span>
                  <span className="text-muted-foreground">/month</span>
                </div>

                <ul className="space-y-4 mb-8 flex-1">
                  <li className="flex items-start">
                    <div className="mr-3 text-green-500 flex-shrink-0 mt-0.5">
                      <Check className="h-5 w-5" />
                    </div>
                    <span className="text-muted-foreground text-sm">
                      <strong className="text-foreground">1500</strong> prompts
                      with free models
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

            <div className="flex flex-col xs:flex-row items-center justify-center gap-3 sm:gap-4">
              <div className="flex justify-center flex-wrap gap-3">
                <Button
                  onClick={handleGoogleLogin}
                  size="lg"
                  className="group px-5 xs:w-auto flex items-center space-x-2 xs:space-x-3 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105  xs:px-5 sm:px-8 py-2.5 xs:py-3 sm:py-5 text-xs xs:text-sm sm:text-base lg:text-lg font-medium rounded-md md:rounded-xl"
                  disabled={loading}
                >
                  <GoogleIcon className="h-4 w-4 xs:h-5 xs:w-5 sm:h-6 sm:w-6" />
                  <span>Get Started Now</span>
                  <ArrowRight className="h-3.5 w-3.5 xs:h-4 xs:w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform duration-200" />
                </Button>

                <Button
                  onClick={handleGitHubLogin}
                  size="lg"
                  variant="outline"
                  className="group px-5 xs:w-auto flex items-center space-x-2 xs:space-x-3 border-2 border-primary/50 hover:bg-primary/5 text-foreground shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105  xs:px-5 sm:px-8 py-2.5 xs:py-3 sm:py-5 text-xs xs:text-sm sm:text-base lg:text-lg font-medium rounded-md md:rounded-xl"
                  disabled={loading}
                >
                  <GitHubIcon className="h-4 w-4 xs:h-5 xs:w-5 sm:h-6 sm:w-6" />
                  <span>Get Started Now</span>
                  <ArrowRight className="h-3.5 w-3.5 xs:h-4 xs:w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform duration-200" />
                </Button>
              </div>

              <div className="w-full flex justify-center items-center">
                <Link
                  to="/auth/signup"
                  className="w-full  flex justify-center items-center xs:w-auto"
                >
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-full  flex justify-center items-center"
                  >
                    <Button
                      variant="outline"
                      size="lg"
                      className="px-5 flex items-center space-x-1.5 xs:space-x-2 border-primary/50 text-primary hover:bg-primary/5 transition-all duration-200 xs:px-5 sm:px-8 py-2.5 xs:py-3 sm:py-4 text-xs xs:text-sm sm:text-base lg:text-lg rounded-xl border-2"
                    >
                      <UserPlus className="h-3.5 w-3.5 xs:h-4 xs:w-4 sm:h-5 sm:w-5" />
                      <span>Create Free Account</span>
                    </Button>
                  </motion.div>
                </Link>
              </div>
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
                <motion.div
                  className="flex justify-center items-center space-x-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <img
                    src="/logo.png"
                    alt="AVChat Logo"
                    className="h-6 w-6 sm:h-8 sm:w-8"
                  />
                  <span className="text-lg sm:text-xl font-bold text-foreground">
                    AV<span className="text-primary">Chat</span>
                  </span>
                </motion.div>

                {/* Social Icons */}
                <motion.div
                  className="flex items-center justify-center space-x-4 sm:space-x-6"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                >
                  <motion.a
                    href="https://github.com/CyberBoyAyush/AVChat"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group p-2 rounded-full bg-secondary/50 hover:bg-primary/10 transition-all duration-300"
                    whileHover={{ scale: 1.1, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <GitHubIcon className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground group-hover:text-primary transition-colors" />
                  </motion.a>

                  <motion.a
                    href="https://x.com/CyberBoyAyush"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group p-2 rounded-full bg-secondary/50 hover:bg-primary/10 transition-all duration-300"
                    whileHover={{ scale: 1.1, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <svg
                      className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground group-hover:text-primary transition-colors"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                  </motion.a>

                  <motion.a
                    href="mailto:connect@ayush-sharma.in"
                    className="group p-2 rounded-full bg-secondary/50 hover:bg-primary/10 transition-all duration-300"
                    whileHover={{ scale: 1.1, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Mail className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground group-hover:text-primary transition-colors" />
                  </motion.a>

                  <motion.a
                    href="mailto:connect@ayush-sharma.in"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group p-2 rounded-full bg-secondary/50 hover:bg-primary/10 transition-all duration-300"
                    whileHover={{ scale: 1.1, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <svg
                      className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground group-hover:text-primary transition-colors"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                      />
                    </svg>
                  </motion.a>

                  {/* <motion.a
                    href="https://github.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group p-2 rounded-full bg-secondary/50 hover:bg-primary/10 transition-all duration-300"
                    whileHover={{ scale: 1.1, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <ExternalLink className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground group-hover:text-primary transition-colors" />
                  </motion.a> */}
                </motion.div>
              </div>

              {/* Copyright */}
              <motion.div
                className="text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <p className="text-xs sm:text-sm text-muted-foreground">
                  © 2025 AVChat. Built with ❤️ for the AI community.
                </p>
                <div className="flex items-center justify-center space-x-2 mt-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-muted-foreground">
                    All systems operational
                  </span>
                </div>
              </motion.div>
            </div>
          </div>
        </footer>
      </main>
    </div>
    </AuthRedirectGuard>
  );
};

export default HomePage;
