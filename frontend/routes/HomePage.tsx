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
import { Moon } from "lucide-react";
import { Check } from "lucide-react";
import { Building2, Mail } from "lucide-react";
import {
  MessageSquare,
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
  Database,
  Smartphone,
  Monitor,
  CheckCircle,
  Play,
  BarChart3,
  Layers,
  Bot,
  Laptop,
  CloudLightning,
  Code,
  MessagesSquare,
  Command,
} from "lucide-react";
import { GoogleIcon } from "@/frontend/components/ui/icons";
import { ThemeToggleButton } from "@/frontend/components/ui/ThemeComponents";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const HomePage: React.FC = () => {
  const { isAuthenticated, loading, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // For animated background blobs
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Handle mouse movement for interactive gradients
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight,
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Floating icons properties
  const floatingIcons = [
    {
      icon: <Bot className="w-full h-full" />,
      size: "5rem",
      opacity: 0.05,
      animationDuration: 20,
    },
    {
      icon: <MessageSquare className="w-full h-full" />,
      size: "4rem",
      opacity: 0.04,
      animationDuration: 15,
    },
    {
      icon: <Brain className="w-full h-full" />,
      size: "6rem",
      opacity: 0.03,
      animationDuration: 25,
    },
    {
      icon: <Laptop className="w-full h-full" />,
      size: "3.5rem",
      opacity: 0.06,
      animationDuration: 18,
    },
    {
      icon: <CloudLightning className="w-full h-full" />,
      size: "4.5rem",
      opacity: 0.04,
      animationDuration: 22,
    },
    {
      icon: <Code className="w-full h-full" />,
      size: "3rem",
      opacity: 0.05,
      animationDuration: 17,
    },
    {
      icon: <MessagesSquare className="w-full h-full" />,
      size: "5.5rem",
      opacity: 0.03,
      animationDuration: 23,
    },
    {
      icon: <Command className="w-full h-full" />,
      size: "4rem",
      opacity: 0.05,
      animationDuration: 19,
    },
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
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
              }%, rgba(30, 64, 175, 0.1) 0%, rgba(0, 0, 0, 0) 50%)`
            : `radial-gradient(circle at ${mousePosition.x * 100}% ${
                mousePosition.y * 100
              }%, rgba(247, 111, 82, 0.2) 0%, rgba(0, 0, 0, 0) 60%),
               radial-gradient(circle at ${100 - mousePosition.x * 100}% ${
                100 - mousePosition.y * 100
              }%, rgba(79, 70, 229, 0.15) 0%, rgba(0, 0, 0, 0) 50%)`,
        }}
      />

      {/* Fixed gradient elements */}
      <div className="absolute top-0 left-0 w-full h-full z-0">
        <div className="absolute top-0 left-1/4 w-[30rem] h-[30rem] rounded-full bg-primary/5 blur-[8rem] -translate-y-1/2" />
        <div className="absolute bottom-0 right-1/4 w-[30rem] h-[30rem] rounded-full bg-blue-500/5 blur-[8rem] translate-y-1/3" />
      </div>

      {/* Floating icons background
      <div className="absolute inset-0 z-0 overflow-hidden">
        {floatingIcons.map((item, index) => (
          <motion.div
            key={index}
            className={cn(
              "absolute text-primary dark:text-primary/70",
              isDark ? "opacity-20" : "opacity-10"
            )}
            style={{
              width: item.size,
              height: item.size,
            }}
            initial={{
              x: `${Math.random() * 100}%`,
              y: `${Math.random() * 100}%`,
              opacity: item.opacity,
              rotate: Math.random() * 360,
            }}
            animate={{
              x: [
                `${Math.random() * 100}%`,
                `${Math.random() * 100}%`,
                `${Math.random() * 100}%`,
              ],
              y: [
                `${Math.random() * 100}%`,
                `${Math.random() * 100}%`,
                `${Math.random() * 100}%`,
              ],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: item.animationDuration,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "easeInOut",
            }}
          >
            {item.icon}
          </motion.div>
        ))}
      </div> */}

      {/* Navigation Header - Improved responsiveness */}
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <motion.div
              className="flex items-center space-x-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <motion.div
                whileHover={{
                  scale: 1.1,
                  rotate: [0, 5, -5, 0],
                  transition: { duration: 0.5 },
                }}
              >
                <img
                  src="/logo.png"
                  alt="Logo"
                  className="h-7 w-7 sm:h-8 sm:w-8"
                />
              </motion.div>
              <span className="text-lg sm:text-xl font-bold text-foreground">
                AtChat
              </span>
            </motion.div>

            <motion.div
              className="flex items-center space-x-1.5 sm:space-x-4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <ThemeToggleButton variant="inline" />
              <Link to="/auth/login">
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm p-2 sm:p-2.5"
                >
                  <LogIn className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="hidden md:block">Login</span>
                </Button>
              </Link>
              <Link to="/auth/signup">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    size="sm"
                    className="flex items-center space-x-1 sm:space-x-2 bg-primary hover:bg-primary/90 text-primary-foreground text-xs sm:text-sm p-2 sm:p-2.5"
                  >
                    <UserPlus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span className="hidden md:block">Sign Up</span>
                  </Button>
                </motion.div>
              </Link>
            </motion.div>
          </div>
        </div>
      </nav>

      {/* Hero Section - Enhanced responsiveness */}
      <main className="pt-14 sm:pt-16 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 md:py-20">
          <div className="text-center">
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
              className="space-y-2 sm:space-y-4 mb-6 sm:mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
            >
              <h1 className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-foreground leading-tight px-1 sm:px-0">
                The Future of{" "}
                <span className="bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent inline-block">
                  <motion.span
                    animate={{
                      backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                    }}
                    transition={{
                      duration: 5,
                      repeat: Infinity,
                      repeatType: "reverse",
                    }}
                    style={{
                      display: "inline-block",
                      backgroundSize: "200% auto",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundImage:
                        "linear-gradient(90deg, var(--primary) 30%, var(--primary-foreground) 50%, var(--primary) 100%)",
                    }}
                  >
                    AI Conversations
                  </motion.span>
                </span>
              </h1>

              <p className="text-sm xs:text-base sm:text-lg md:text-xl lg:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed px-2 sm:px-4">
                Experience lightning-fast AI interactions with multiple models.
                <br className="hidden md:block" />
                <span className="text-primary font-medium">
                  10x faster
                </span>{" "}
                than ChatGPT,{" "}
                <span className="text-primary font-medium">smarter</span> than
                Claude, and{" "}
                <span className="text-primary font-medium">synced</span> across
                all your devices.
              </p>
            </motion.div>

            {/* Feature Pills - Better spacing and sizing */}
            <motion.div
              className="flex flex-wrap justify-center gap-1.5 xs:gap-2 sm:gap-3 mb-6 sm:mb-8 lg:mb-12 px-1 sm:px-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.4 }}
            >
              <motion.div
                whileHover={{ scale: 1.1, y: -5 }}
                className="group bg-primary/10 hover:bg-primary/20 text-primary px-2 xs:px-3 sm:px-5 py-1.5 xs:py-2 sm:py-3 rounded-full text-xs sm:text-sm font-medium border border-primary/20 hover:border-primary/40 transition-all duration-300 hover:shadow-lg"
              >
                <Zap className="h-3 w-3 sm:h-4 sm:w-4 inline mr-1 sm:mr-2 group-hover:animate-pulse" />
                <span className="hidden xs:inline">10x</span> Faster Response
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.1, y: -5 }}
                className="group bg-secondary/50 hover:bg-secondary/70 text-foreground px-2 xs:px-3 sm:px-5 py-1.5 xs:py-2 sm:py-3 rounded-full text-xs sm:text-sm font-medium border border-border hover:border-primary/30 transition-all duration-300"
              >
                <Brain className="h-3 w-3 sm:h-4 sm:w-4 inline mr-1 sm:mr-2 group-hover:animate-bounce" />
                Multi-Model AI
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.1, y: -5 }}
                className="group bg-secondary/50 hover:bg-secondary/70 text-foreground px-2 xs:px-3 sm:px-5 py-1.5 xs:py-2 sm:py-3 rounded-full text-xs sm:text-sm font-medium border border-border hover:border-primary/30 transition-all duration-300"
              >
                <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4 inline mr-1 sm:mr-2 group-hover:animate-spin" />
                Real-time Sync
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.1, y: -5 }}
                className="group bg-secondary/50 hover:bg-secondary/70 text-foreground px-2 xs:px-3 sm:px-5 py-1.5 xs:py-2 sm:py-3 rounded-full text-xs sm:text-sm font-medium border border-border hover:border-primary/30 transition-all duration-300"
              >
                <Shield className="h-3 w-3 sm:h-4 sm:w-4 inline mr-1 sm:mr-2 group-hover:animate-pulse" />
                Privacy First
              </motion.div>
            </motion.div>

            {/* Authentication Buttons - Improved responsiveness */}
            <motion.div
              className="flex flex-col items-center gap-3 sm:gap-6 mb-6 sm:mb-10 px-2 sm:px-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.6 }}
            >
              {/* Primary CTA */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-full flex justify-center xs:w-auto"
              >
                <Button
                  onClick={handleGoogleLogin}
                  size="lg"
                  className="group w-full xs:w-auto max-w-xs flex items-center space-x-2 sm:space-x-3 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300 transform px-3 xs:px-4 sm:px-8 py-2.5 xs:py-3 sm:py-4 text-xs xs:text-sm sm:text-base lg:text-lg font-medium rounded-xl relative overflow-hidden"
                  disabled={loading}
                >
                  <motion.span
                    className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-primary-foreground/10 to-transparent"
                    animate={{
                      x: ["-100%", "100%"],
                    }}
                    transition={{
                      repeat: Infinity,
                      duration: 1.5,
                      ease: "linear",
                    }}
                  />
                  <GoogleIcon className="h-4 w-4 xs:h-5 xs:w-5 sm:h-6 sm:w-6" />
                  <span className="truncate">
                    <span className="hidden xs:inline">Start Chatting</span>
                    <span className="xs:hidden">Chat</span> with Google
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 xs:h-4 xs:w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform duration-200" />
                </Button>
              </motion.div>

              {/* Secondary Options */}
              <div className="flex items-center gap-2 xs:gap-3 sm:gap-4">
                <Link to="/auth/login">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      variant="outline"
                      className="flex items-center space-x-1.5 sm:space-x-2 hover:bg-secondary/80 transition-all duration-200 px-2.5 xs:px-3 sm:px-6 py-1.5 xs:py-2 sm:py-3 rounded-xl border-2 text-xs xs:text-sm sm:text-base"
                    >
                      <LogIn className="h-3.5 w-3.5 xs:h-4 xs:w-4" />
                      <span>Sign In</span>
                    </Button>
                  </motion.div>
                </Link>

                <span className="text-muted-foreground text-xs xs:text-sm">
                  or
                </span>

                <Link to="/auth/signup">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      variant="outline"
                      className="flex items-center space-x-1.5 sm:space-x-2 border-primary/50 text-primary hover:bg-primary/5 transition-all duration-200 px-2.5 xs:px-3 sm:px-6 py-1.5 xs:py-2 sm:py-3 rounded-xl border-2 text-xs xs:text-sm sm:text-base"
                    >
                      <UserPlus className="h-3.5 w-3.5 xs:h-4 xs:w-4" />
                      <span>Create Account</span>
                    </Button>
                  </motion.div>
                </Link>
              </div>
            </motion.div>

            {/* Trust Indicators - Better alignment */}
            <motion.div
              className="flex flex-col xs:flex-row items-center justify-center gap-1.5 xs:gap-2 sm:gap-6 text-[10px] xs:text-xs sm:text-sm text-muted-foreground/70"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.8 }}
            >
              <div className="flex items-center space-x-1.5">
                <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
                <span>Free to start</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
                <span>Trusted by 50K+ users</span>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Performance That Speaks for Itself
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Real metrics from real users. See why AtChat is the fastest AI
              platform.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {/* Response Time */}
            <div className="text-center p-8 bg-card/50 backdrop-blur-sm border border-border rounded-3xl hover:shadow-lg transition-all duration-300">
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
            <div className="text-center p-8 bg-card/50 backdrop-blur-sm border border-border rounded-3xl hover:shadow-lg transition-all duration-300">
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
            <div className="text-center p-8 bg-card/50 backdrop-blur-sm border border-border rounded-3xl hover:shadow-lg transition-all duration-300">
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
          <div className="bg-card/30 backdrop-blur-sm border border-border rounded-3xl p-8">
            <h3 className="text-xl font-semibold text-foreground mb-6 text-center">
              Response Speed Comparison
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-primary rounded-full"></div>
                  <span className="text-foreground font-medium">AtChat</span>
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
                <span className="text-muted-foreground text-sm w-12">8.2s</span>
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
                <span className="text-muted-foreground text-sm w-12">6.5s</span>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Key Features Grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Everything You Need in One Platform
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Powerful features designed for the future of AI conversations
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Speed */}
            <div className="group relative bg-gradient-to-br from-card/50 to-card/30 backdrop-blur-sm border border-border rounded-3xl p-8 hover:bg-card/80 transition-all duration-500 hover:shadow-2xl hover:scale-105">
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
            </div>

            {/* Multi-Model */}
            <div className="group relative bg-gradient-to-br from-card/50 to-card/30 backdrop-blur-sm border border-border rounded-3xl p-8 hover:bg-card/80 transition-all duration-500 hover:shadow-2xl hover:scale-105">
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
            </div>

            {/* Sync */}
            <div className="group relative bg-gradient-to-br from-card/50 to-card/30 backdrop-blur-sm border border-border rounded-3xl p-8 hover:bg-card/80 transition-all duration-500 hover:shadow-2xl hover:scale-105">
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
            </div>

            {/* Privacy */}
            <div className="group relative bg-gradient-to-br from-card/50 to-card/30 backdrop-blur-sm border border-border rounded-3xl p-8 hover:bg-card/80 transition-all duration-500 hover:shadow-2xl hover:scale-105">
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
            </div>

            {/* Advanced Features */}
            <div className="group relative bg-gradient-to-br from-card/50 to-card/30 backdrop-blur-sm border border-border rounded-3xl p-8 hover:bg-card/80 transition-all duration-500 hover:shadow-2xl hover:scale-105">
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
            </div>

            {/* Team Collaboration */}
            <div className="group relative bg-gradient-to-br from-card/50 to-card/30 backdrop-blur-sm border border-border rounded-3xl p-8 hover:bg-card/80 transition-all duration-500 hover:shadow-2xl hover:scale-105">
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
            </div>
          </div>
        </div>

        {/* Comparison Section */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Why Switch to AtChat?
            </h2>
            <p className="text-lg text-muted-foreground">
              See how we compare to other AI platforms
            </p>
          </div>

          <div className="bg-card/30 backdrop-blur-sm border border-border rounded-3xl p-8 shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-4 text-foreground font-semibold">
                      Feature
                    </th>
                    <th className="text-center py-4 text-primary font-semibold">
                      AtChat
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
                        <span className="text-primary font-medium">
                          Maximum
                        </span>
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
              AtChat
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
                "AtChat is incredibly fast. I can get complex code explanations
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
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 bg-gradient-to-br from-primary/5 via-transparent to-primary/5">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              See AtChat in Action
            </h2>
            <p className="text-lg text-muted-foreground">
              Watch how fast and intelligent our AI responses can be
            </p>
          </div>

          <div className="relative bg-card/80 backdrop-blur-md border border-border rounded-3xl p-8 shadow-2xl">
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
                  <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center">
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

                <div className="text-center">
                  <Button
                    variant="outline"
                    className="flex items-center space-x-2 mx-auto"
                  >
                    <Play className="h-4 w-4" />
                    <span>Try Interactive Demo</span>
                  </Button>
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
                      Perfect for trying out AtChat
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
                      <strong className="text-foreground">40</strong> premium
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
                      <strong className="text-foreground">5</strong> super
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
                  <span className="text-foreground text-3xl font-bold">$8</span>
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
                      <strong className="text-foreground">1500</strong> premium
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
                      <strong className="text-foreground">100</strong> super
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
              <div className="bg-card/50 border border-border rounded-xl p-6">
                <h4 className="text-foreground font-medium mb-2">
                  How do model credits work?
                </h4>
                <p className="text-muted-foreground text-sm">
                  Each interaction with premium models consumes one credit. Free
                  models don't consume credits and are only limited by monthly
                  prompt caps on free plans.
                </p>
              </div>

              <div className="bg-card/50 border border-border rounded-xl p-6">
                <h4 className="text-foreground font-medium mb-2">
                  Can I upgrade or downgrade my plan?
                </h4>
                <p className="text-muted-foreground text-sm">
                  Yes, you can upgrade or downgrade your plan at any time.
                  Changes will be applied at the start of the next billing
                  cycle.
                </p>
              </div>

              <div className="bg-card/50 border border-border rounded-xl p-6">
                <h4 className="text-foreground font-medium mb-2">
                  Do credits roll over to the next month?
                </h4>
                <p className="text-muted-foreground text-sm">
                  No, unused credits don't roll over. Each month your account is
                  refreshed with new credits according to your plan.
                </p>
              </div>

              <div className="bg-card/50 border border-border rounded-xl p-6">
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
              <Button
                onClick={handleGoogleLogin}
                size="lg"
                className="group w-full xs:w-auto flex items-center space-x-2 xs:space-x-3 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 px-4 xs:px-5 sm:px-8 py-2.5 xs:py-3 sm:py-4 text-xs xs:text-sm sm:text-base lg:text-lg font-medium rounded-xl"
                disabled={loading}
              >
                <GoogleIcon className="h-4 w-4 xs:h-5 xs:w-5 sm:h-6 sm:w-6" />
                <span>Get Started Now</span>
                <ArrowRight className="h-3.5 w-3.5 xs:h-4 xs:w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform duration-200" />
              </Button>

              <Link to="/auth/signup" className="w-full xs:w-auto">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full"
                >
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full xs:w-auto flex items-center space-x-1.5 xs:space-x-2 border-primary/50 text-primary hover:bg-primary/5 transition-all duration-200 px-4 xs:px-5 sm:px-8 py-2.5 xs:py-3 sm:py-4 text-xs xs:text-sm sm:text-base lg:text-lg rounded-xl border-2"
                  >
                    <UserPlus className="h-3.5 w-3.5 xs:h-4 xs:w-4 sm:h-5 sm:w-5" />
                    <span>Create Free Account</span>
                  </Button>
                </motion.div>
              </Link>
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

        {/* Footer - Enhanced responsiveness */}
        <footer className="bg-card/50 backdrop-blur-sm border-t border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-5 md:gap-8 mb-6 sm:mb-8">
              {/* Brand */}
              <div className="col-span-2 sm:col-span-2 md:col-span-1">
                <div className="flex items-center space-x-2 mb-3 sm:mb-4">
                  <img
                    src="/logo.png"
                    alt="AtChat Logo"
                    className="h-5 w-5 xs:h-6 xs:w-6 sm:h-8 sm:w-8"
                  />
                  <span className="text-base xs:text-lg sm:text-xl font-bold text-foreground">
                    AtChat
                  </span>
                </div>
                <p className="text-[10px] xs:text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  The fastest AI conversation platform. Experience
                  lightning-fast responses with multiple AI models in one
                  unified interface.
                </p>
                <div className="flex items-center space-x-4 mt-3 xs:mt-4">
                  <div className="flex items-center space-x-1 text-[9px] xs:text-xs text-muted-foreground">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span>All systems operational</span>
                  </div>
                </div>
              </div>

              {/* Footer link columns - Better sizing */}
              <div>
                <h3 className="font-semibold text-foreground mb-3 sm:mb-4 text-sm sm:text-base">
                  Product
                </h3>
                <ul className="space-y-1 sm:space-y-2 text-xs sm:text-sm text-muted-foreground">
                  <li>
                    <a
                      href="#"
                      className="hover:text-primary transition-colors"
                    >
                      Features
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="hover:text-primary transition-colors"
                    >
                      Pricing
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="hover:text-primary transition-colors"
                    >
                      AI Models
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="hover:text-primary transition-colors"
                    >
                      API Access
                    </a>
                  </li>
                </ul>
              </div>

              {/* Resources (Combined for mobile layout) */}
              <div>
                <h3 className="font-semibold text-foreground mb-3 sm:mb-4 text-sm sm:text-base">
                  Resources
                </h3>
                <ul className="space-y-1 sm:space-y-2 text-xs sm:text-sm text-muted-foreground">
                  <li>
                    <a
                      href="#"
                      className="hover:text-primary transition-colors"
                    >
                      Documentation
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="hover:text-primary transition-colors"
                    >
                      Tutorials
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="hover:text-primary transition-colors"
                    >
                      Blog
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="hover:text-primary transition-colors"
                    >
                      Support
                    </a>
                  </li>
                </ul>
              </div>

              {/* Company (Hidden on smallest screens) */}
              <div className="hidden sm:block">
                <h3 className="font-semibold text-foreground mb-3 sm:mb-4 text-sm sm:text-base">
                  Company
                </h3>
                <ul className="space-y-1 sm:space-y-2 text-xs sm:text-sm text-muted-foreground">
                  <li>
                    <a
                      href="#"
                      className="hover:text-primary transition-colors"
                    >
                      About
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="hover:text-primary transition-colors"
                    >
                      Privacy
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="hover:text-primary transition-colors"
                    >
                      Terms
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="hover:text-primary transition-colors"
                    >
                      Contact
                    </a>
                  </li>
                </ul>
              </div>
            </div>

            {/* Bottom Bar */}
            <div className="border-t border-border pt-3 sm:pt-6">
              <div className="flex flex-col sm:flex-row justify-between items-center">
                <div className="text-[9px] xs:text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-0 text-center sm:text-left">
                  © 2025 AtChat. All rights reserved. Built with ❤️ for the AI
                  community.
                </div>

                <div className="flex items-center space-x-2 sm:space-x-4 text-[9px] xs:text-xs text-muted-foreground">
                  <span className="hidden xs:inline">
                    Status: All systems operational
                  </span>
                  <div className="hidden xs:block w-1 h-1 bg-muted-foreground rounded-full"></div>
                  <span>Version 2.1.0</span>
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
