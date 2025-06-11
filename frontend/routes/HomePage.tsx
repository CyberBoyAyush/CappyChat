/**
 * Home Page Component
 * 
 * Entry point for the application with authentication options.
 * Features modern design with login and signup options.
 */

'use client';

import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/frontend/components/ui/button';
import { useAuth } from '@/frontend/contexts/AuthContext';
import { MessageSquare, Sparkles, Shield, ArrowRight, LogIn, UserPlus, Zap, RefreshCw, Brain, Clock, Users2, Globe, Star, TrendingUp, Cpu, Database, Smartphone, Monitor, CheckCircle, Play, BarChart3, Layers } from 'lucide-react';
import { GoogleIcon } from '@/frontend/components/ui/icons';
import { ThemeToggleButton } from '@/frontend/components/ui/ThemeComponents';

const HomePage: React.FC = () => {
  const { isAuthenticated, loading, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  // Redirect authenticated users to chat
  useEffect(() => {
    if (isAuthenticated && !loading) {
      navigate('/chat');
    }
  }, [isAuthenticated, loading, navigate]);

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
    } catch (error) {
      console.error('Google login failed:', error);
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
    <div className="min-h-screen bg-background">
      {/* Navigation Header */}
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <MessageSquare className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold text-foreground">AtChat</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <ThemeToggleButton variant="inline" />
              <Link to="/auth/login">
                <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                  <LogIn className="h-4 w-4" />
                  <span>Login</span>
                </Button>
              </Link>
              <Link to="/auth/signup">
                <Button size="sm" className="flex items-center space-x-2 bg-primary hover:bg-primary/90 text-primary-foreground">
                  <UserPlus className="h-4 w-4" />
                  <span>Sign Up</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <div className="flex justify-center mb-8">
              <div className="relative">
                <div className="absolute inset-0 bg-primary rounded-full opacity-20 animate-pulse"></div>
                <div className="absolute inset-0 bg-primary rounded-full opacity-10 animate-ping"></div>
                <MessageSquare className="h-20 w-20 text-primary relative z-10 animate-bounce" />
              </div>
            </div>
            
            <div className="space-y-4 mb-8">
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-foreground leading-tight">
                The Future of{' '}
                <span className="bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent animate-pulse">
                  AI Conversations
                </span>
              </h1>
              
              <p className="text-lg md:text-xl lg:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Experience lightning-fast AI interactions with multiple models. 
                <br className="hidden md:block" />
                <span className="text-primary font-medium">10x faster</span> than ChatGPT, 
                <span className="text-primary font-medium"> smarter</span> than Claude, 
                and <span className="text-primary font-medium">synced</span> across all your devices.
              </p>
            </div>

            {/* Feature Pills */}
            <div className="flex flex-wrap justify-center gap-3 mb-12">
              <div className="group bg-primary/10 hover:bg-primary/20 text-primary px-5 py-3 rounded-full text-sm font-medium border border-primary/20 hover:border-primary/40 transition-all duration-300 hover:scale-105 hover:shadow-lg">
                <Zap className="h-4 w-4 inline mr-2 group-hover:animate-pulse" />
                10x Faster Response
              </div>
              <div className="group bg-secondary/50 hover:bg-secondary/70 text-foreground px-5 py-3 rounded-full text-sm font-medium border border-border hover:border-primary/30 transition-all duration-300 hover:scale-105">
                <Brain className="h-4 w-4 inline mr-2 group-hover:animate-bounce" />
                Multi-Model AI
              </div>
              <div className="group bg-secondary/50 hover:bg-secondary/70 text-foreground px-5 py-3 rounded-full text-sm font-medium border border-border hover:border-primary/30 transition-all duration-300 hover:scale-105">
                <RefreshCw className="h-4 w-4 inline mr-2 group-hover:animate-spin" />
                Real-time Sync
              </div>
              <div className="group bg-secondary/50 hover:bg-secondary/70 text-foreground px-5 py-3 rounded-full text-sm font-medium border border-border hover:border-primary/30 transition-all duration-300 hover:scale-105">
                <Shield className="h-4 w-4 inline mr-2 group-hover:animate-pulse" />
                Privacy First
              </div>
            </div>

            {/* Authentication Buttons */}
            <div className="flex flex-col items-center gap-6 mb-12">
              {/* Primary CTA */}
              <Button
                onClick={handleGoogleLogin}
                size="lg"
                className="group w-full sm:w-auto flex items-center space-x-3 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 px-8 py-4 text-lg font-medium rounded-xl"
                disabled={loading}
              >
                <GoogleIcon className="h-6 w-6" />
                <span>Start Chatting with Google</span>
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-200" />
              </Button>
              
              {/* Secondary Options */}
              <div className="flex items-center gap-4">
                <Link to="/auth/login">
                  <Button variant="outline" size="lg" className="flex items-center space-x-2 hover:bg-secondary/80 transition-all duration-200 px-6 py-3 rounded-xl border-2">
                    <LogIn className="h-4 w-4" />
                    <span>Sign In</span>
                  </Button>
                </Link>
                
                <span className="text-muted-foreground text-sm">or</span>
                
                <Link to="/auth/signup">
                  <Button variant="outline" size="lg" className="flex items-center space-x-2 border-primary/50 text-primary hover:bg-primary/5 transition-all duration-200 px-6 py-3 rounded-xl border-2">
                    <UserPlus className="h-4 w-4" />
                    <span>Create Account</span>
                  </Button>
                </Link>
              </div>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-muted-foreground/70">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Free to start</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Trusted by 50K+ users</span>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Performance That Speaks for Itself
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Real metrics from real users. See why AtChat is the fastest AI platform.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {/* Response Time */}
            <div className="text-center p-8 bg-card/50 backdrop-blur-sm border border-border rounded-3xl hover:shadow-lg transition-all duration-300">
              <div className="bg-primary/10 rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-4">
                <Clock className="h-8 w-8 text-primary" />
              </div>
              <div className="text-4xl font-bold text-foreground mb-2">0.8s</div>
              <div className="text-lg font-medium text-primary mb-1">Average Response Time</div>
              <div className="text-sm text-muted-foreground">vs 8.2s on ChatGPT</div>
            </div>

            {/* Accuracy */}
            <div className="text-center p-8 bg-card/50 backdrop-blur-sm border border-border rounded-3xl hover:shadow-lg transition-all duration-300">
              <div className="bg-primary/10 rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="h-8 w-8 text-primary" />
              </div>
              <div className="text-4xl font-bold text-foreground mb-2">98.5%</div>
              <div className="text-lg font-medium text-primary mb-1">Accuracy Score</div>
              <div className="text-sm text-muted-foreground">Consistently high quality</div>
            </div>

            {/* Models Supported */}
            <div className="text-center p-8 bg-card/50 backdrop-blur-sm border border-border rounded-3xl hover:shadow-lg transition-all duration-300">
              <div className="bg-primary/10 rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-4">
                <Layers className="h-8 w-8 text-primary" />
              </div>
              <div className="text-4xl font-bold text-foreground mb-2">15+</div>
              <div className="text-lg font-medium text-primary mb-1">AI Models</div>
              <div className="text-sm text-muted-foreground">GPT-4, Claude, Gemini & more</div>
            </div>
          </div>

          {/* Speed Comparison Chart */}
          <div className="bg-card/30 backdrop-blur-sm border border-border rounded-3xl p-8">
            <h3 className="text-xl font-semibold text-foreground mb-6 text-center">Response Speed Comparison</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-primary rounded-full"></div>
                  <span className="text-foreground font-medium">AtChat</span>
                </div>
                <div className="flex-1 mx-4 bg-secondary rounded-full h-2 relative overflow-hidden">
                  <div className="absolute left-0 top-0 h-full bg-primary rounded-full animate-pulse" style={{ width: '8%' }}></div>
                </div>
                <span className="text-primary font-medium text-sm w-12">0.8s</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-muted-foreground rounded-full"></div>
                  <span className="text-muted-foreground">ChatGPT</span>
                </div>
                <div className="flex-1 mx-4 bg-secondary rounded-full h-2 relative overflow-hidden">
                  <div className="absolute left-0 top-0 h-full bg-muted-foreground rounded-full" style={{ width: '82%' }}></div>
                </div>
                <span className="text-muted-foreground text-sm w-12">8.2s</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-muted-foreground rounded-full"></div>
                  <span className="text-muted-foreground">Claude</span>
                </div>
                <div className="flex-1 mx-4 bg-secondary rounded-full h-2 relative overflow-hidden">
                  <div className="absolute left-0 top-0 h-full bg-muted-foreground rounded-full" style={{ width: '65%' }}></div>
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
              <h3 className="text-xl font-semibold text-foreground mb-3">Lightning Fast Responses</h3>
              <p className="text-muted-foreground mb-4 leading-relaxed">10x faster than ChatGPT with our optimized AI routing system. Get answers in under a second.</p>
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
              <h3 className="text-xl font-semibold text-foreground mb-3">Multi-Model Intelligence</h3>
              <p className="text-muted-foreground mb-4 leading-relaxed">Access GPT-4, Claude-3, Gemini Pro, and 15+ cutting-edge AI models in one unified interface.</p>
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
              <h3 className="text-xl font-semibold text-foreground mb-3">Real-time Sync</h3>
              <p className="text-muted-foreground mb-4 leading-relaxed">Seamless conversation sync across all your devices. Start on mobile, continue on desktop.</p>
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
              <h3 className="text-xl font-semibold text-foreground mb-3">Privacy-First Design</h3>
              <p className="text-muted-foreground mb-4 leading-relaxed">End-to-end encryption, zero data retention policy, and complete control over your conversations.</p>
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
              <h3 className="text-xl font-semibold text-foreground mb-3">Advanced AI Features</h3>
              <p className="text-muted-foreground mb-4 leading-relaxed">Code generation, image analysis, document processing, and intelligent conversation memory.</p>
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
              <h3 className="text-xl font-semibold text-foreground mb-3">Team Collaboration</h3>
              <p className="text-muted-foreground mb-4 leading-relaxed">Share conversations, collaborate on projects, and manage team workspaces with enterprise-grade tools.</p>
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
                    <th className="text-left py-4 text-foreground font-semibold">Feature</th>
                    <th className="text-center py-4 text-primary font-semibold">AtChat</th>
                    <th className="text-center py-4 text-muted-foreground">ChatGPT</th>
                    <th className="text-center py-4 text-muted-foreground">Claude</th>
                    <th className="text-center py-4 text-muted-foreground">Others</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  <tr className="border-b border-border/50">
                    <td className="py-4 text-foreground">Response Speed</td>
                    <td className="text-center py-4">
                      <div className="flex items-center justify-center">
                        <Zap className="h-4 w-4 text-primary mr-1" />
                        <span className="text-primary font-medium">10x Faster</span>
                      </div>
                    </td>
                    <td className="text-center py-4 text-muted-foreground">Standard</td>
                    <td className="text-center py-4 text-muted-foreground">Slow</td>
                    <td className="text-center py-4 text-muted-foreground">Varies</td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-4 text-foreground">Model Access</td>
                    <td className="text-center py-4">
                      <div className="flex items-center justify-center">
                        <Brain className="h-4 w-4 text-primary mr-1" />
                        <span className="text-primary font-medium">All Models</span>
                      </div>
                    </td>
                    <td className="text-center py-4 text-muted-foreground">GPT Only</td>
                    <td className="text-center py-4 text-muted-foreground">Claude Only</td>
                    <td className="text-center py-4 text-muted-foreground">Limited</td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-4 text-foreground">Device Sync</td>
                    <td className="text-center py-4">
                      <div className="flex items-center justify-center">
                        <RefreshCw className="h-4 w-4 text-primary mr-1" />
                        <span className="text-primary font-medium">Real-time</span>
                      </div>
                    </td>
                    <td className="text-center py-4 text-muted-foreground">Basic</td>
                    <td className="text-center py-4 text-muted-foreground">None</td>
                    <td className="text-center py-4 text-muted-foreground">Limited</td>
                  </tr>
                  <tr>
                    <td className="py-4 text-foreground">Privacy Level</td>
                    <td className="text-center py-4">
                      <div className="flex items-center justify-center">
                        <Shield className="h-4 w-4 text-primary mr-1" />
                        <span className="text-primary font-medium">Maximum</span>
                      </div>
                    </td>
                    <td className="text-center py-4 text-muted-foreground">Standard</td>
                    <td className="text-center py-4 text-muted-foreground">Good</td>
                    <td className="text-center py-4 text-muted-foreground">Varies</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Enhanced Social Proof */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Trusted by Professionals Worldwide
            </h2>
            <p className="text-lg text-muted-foreground">
              Join thousands of developers, researchers, and teams already using AtChat
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
            <div className="text-center group">
              <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-6 mb-4 group-hover:scale-105 transition-transform duration-300">
                <div className="text-3xl md:text-4xl font-bold text-primary mb-1">50K+</div>
                <div className="text-sm text-muted-foreground">Active Users</div>
              </div>
            </div>
            
            <div className="text-center group">
              <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-6 mb-4 group-hover:scale-105 transition-transform duration-300">
                <div className="text-3xl md:text-4xl font-bold text-primary mb-1">5M+</div>
                <div className="text-sm text-muted-foreground">Messages Sent</div>
              </div>
            </div>
            
            <div className="text-center group">
              <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-6 mb-4 group-hover:scale-105 transition-transform duration-300">
                <div className="text-3xl md:text-4xl font-bold text-primary mb-1">99.9%</div>
                <div className="text-sm text-muted-foreground">Uptime</div>
              </div>
            </div>
            
            <div className="text-center group">
              <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-6 mb-4 group-hover:scale-105 transition-transform duration-300">
                <div className="text-3xl md:text-4xl font-bold text-primary mb-1">4.9/5</div>
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
                "AtChat is incredibly fast. I can get complex code explanations in seconds, not minutes."
              </p>
              <div className="flex items-center">
                <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center mr-3">
                  <span className="text-primary text-sm font-semibold">AS</span>
                </div>
                <div>
                  <div className="text-foreground font-medium text-sm">Alex Smith</div>
                  <div className="text-muted-foreground text-xs">Senior Developer</div>
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
                "The multi-model approach is game-changing. I can compare responses from different AIs instantly."
              </p>
              <div className="flex items-center">
                <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center mr-3">
                  <span className="text-primary text-sm font-semibold">MJ</span>
                </div>
                <div>
                  <div className="text-foreground font-medium text-sm">Maria Johnson</div>
                  <div className="text-muted-foreground text-xs">AI Researcher</div>
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
                "Privacy-first design with enterprise features. Perfect for our team's sensitive projects."
              </p>
              <div className="flex items-center">
                <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center mr-3">
                  <span className="text-primary text-sm font-semibold">DL</span>
                </div>
                <div>
                  <div className="text-foreground font-medium text-sm">David Lee</div>
                  <div className="text-muted-foreground text-xs">CTO, TechCorp</div>
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
                    How do I optimize this React component for better performance?
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center">
                    <Brain className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <div className="bg-secondary/50 text-foreground rounded-2xl rounded-tl-sm px-4 py-3 max-w-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-xs font-medium text-primary">GPT-4 • 0.8s</span>
                    </div>
                    <p className="text-sm">Here are 5 key optimizations for your React component: 1) Use React.memo for preventing unnecessary re-renders, 2) Implement useMemo for expensive calculations...</p>
                  </div>
                </div>
                
                <div className="text-center">
                  <Button variant="outline" className="flex items-center space-x-2 mx-auto">
                    <Play className="h-4 w-4" />
                    <span>Try Interactive Demo</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Final Call to Action */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 rounded-3xl p-12 border border-primary/20">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Ready to Experience the Future?
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join 50,000+ users who've already made the switch to faster, smarter AI conversations.
              Start your journey today - completely free.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                onClick={handleGoogleLogin}
                size="lg"
                className="group w-full sm:w-auto flex items-center space-x-3 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 px-8 py-4 text-lg font-medium rounded-xl"
                disabled={loading}
              >
                <GoogleIcon className="h-6 w-6" />
                <span>Get Started Now</span>
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-200" />
              </Button>
              
              <Link to="/auth/signup">
                <Button variant="outline" size="lg" className="w-full sm:w-auto flex items-center space-x-2 border-primary/50 text-primary hover:bg-primary/5 transition-all duration-200 px-8 py-4 text-lg rounded-xl border-2">
                  <UserPlus className="h-5 w-5" />
                  <span>Create Free Account</span>
                </Button>
              </Link>
            </div>
            
            <div className="flex items-center justify-center space-x-6 mt-6 text-sm text-muted-foreground">
              <div className="flex items-center space-x-1">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Free forever plan</span>
              </div>
              <div className="flex items-center space-x-1">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Setup in 30 seconds</span>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Footer */}
        <footer className="bg-card/50 backdrop-blur-sm border-t border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
              {/* Brand */}
              <div className="col-span-1 md:col-span-1">
                <div className="flex items-center space-x-2 mb-4">
                  <MessageSquare className="h-8 w-8 text-primary" />
                  <span className="text-xl font-bold text-foreground">AtChat</span>
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  The fastest AI conversation platform. Experience lightning-fast responses with multiple AI models in one unified interface.
                </p>
                <div className="flex items-center space-x-4 mt-4">
                  <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span>All systems operational</span>
                  </div>
                </div>
              </div>

              {/* Product */}
              <div>
                <h3 className="font-semibold text-foreground mb-4">Product</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li><a href="#" className="hover:text-primary transition-colors">Features</a></li>
                  <li><a href="#" className="hover:text-primary transition-colors">Pricing</a></li>
                  <li><a href="#" className="hover:text-primary transition-colors">AI Models</a></li>
                  <li><a href="#" className="hover:text-primary transition-colors">API Access</a></li>
                  <li><a href="#" className="hover:text-primary transition-colors">Enterprise</a></li>
                </ul>
              </div>

              {/* Resources */}
              <div>
                <h3 className="font-semibold text-foreground mb-4">Resources</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li><a href="#" className="hover:text-primary transition-colors">Documentation</a></li>
                  <li><a href="#" className="hover:text-primary transition-colors">Tutorials</a></li>
                  <li><a href="#" className="hover:text-primary transition-colors">Blog</a></li>
                  <li><a href="#" className="hover:text-primary transition-colors">Community</a></li>
                  <li><a href="#" className="hover:text-primary transition-colors">Support</a></li>
                </ul>
              </div>

              {/* Company */}
              <div>
                <h3 className="font-semibold text-foreground mb-4">Company</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li><a href="#" className="hover:text-primary transition-colors">About</a></li>
                  <li><a href="#" className="hover:text-primary transition-colors">Privacy</a></li>
                  <li><a href="#" className="hover:text-primary transition-colors">Terms</a></li>
                  <li><a href="#" className="hover:text-primary transition-colors">Security</a></li>
                  <li><a href="#" className="hover:text-primary transition-colors">Contact</a></li>
                </ul>
              </div>
            </div>

            {/* Bottom Bar */}
            <div className="border-t border-border pt-8">
              <div className="flex flex-col sm:flex-row justify-between items-center">
                <div className="text-sm text-muted-foreground mb-4 sm:mb-0">
                  © 2025 AtChat. All rights reserved. Built with ❤️ for the AI community.
                </div>
                
                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <span>Status: All systems operational</span>
                  <div className="w-1 h-1 bg-muted-foreground rounded-full"></div>
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
