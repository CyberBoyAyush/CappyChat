/**
 * LandingPage Route Component
 *
 * Used in: frontend/ChatAppRouter.tsx (as root "/" route)
 * Purpose: Landing page for new users with authentication options.
 * Features modern design with login/signup options and app overview.
 */

'use client';

import React from 'react';
import { Link } from 'react-router';
import { Button } from '@/frontend/components/ui/button';
import { useAuth } from '@/frontend/contexts/AuthContext';
import { MessageSquare, Sparkles, Zap, Shield, ArrowRight, Github, Twitter } from 'lucide-react';
import { GoogleIcon } from '@/frontend/components/ui/icons';
import ThemeToggleButton from '@/frontend/components/ui/ThemeComponents';

const LandingPage: React.FC = () => {
  const { isAuthenticated, loginWithGoogle, loading } = useAuth();

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
    } catch (error) {
      console.error('Google login failed:', error);
    }
  };

  // If user is authenticated, redirect to chat
  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <MessageSquare className="h-16 w-16 mx-auto text-primary" />
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">Welcome back!</h2>
            <p className="text-muted-foreground">Redirecting you to your chats...</p>
          </div>
          <Button asChild>
            <Link to="/chat">Continue to Chat</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Navigation */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
                <MessageSquare className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">AtChat</span>
            </div>

            <div className="flex items-center gap-3">
              <ThemeToggleButton variant="inline" />
              <Button variant="ghost" asChild>
                <Link to="/auth/login">Sign in</Link>
              </Button>
              <Button asChild>
                <Link to="/auth/signup">Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center space-y-8 max-w-4xl mx-auto">
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight">
              Chat with{' '}
              <span className="bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                AI Models
              </span>
              <br />
              Like Never Before
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Experience the future of AI conversation with AtChat. Access multiple AI models, 
              create unlimited conversations, and get intelligent responses instantly.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              size="lg" 
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full sm:w-auto"
            >
              <GoogleIcon className="h-5 w-5 mr-2" />
              Continue with Google
            </Button>
            <Button variant="outline" size="lg" asChild className="w-full sm:w-auto">
              <Link to="/auth/signup">
                Create Account
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </div>

          <p className="text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link to="/auth/login" className="text-primary hover:underline">
              Sign in here
            </Link>
          </p>
        </div>

        {/* Features */}
        <div className="mt-32 grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">Multiple AI Models</h3>
            <p className="text-muted-foreground">
              Access various AI models including GPT, Claude, and Gemini all in one place.
            </p>
          </div>

          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto">
              <Zap className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">Lightning Fast</h3>
            <p className="text-muted-foreground">
              Get instant responses with our optimized infrastructure and real-time streaming.
            </p>
          </div>

          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">Privacy First</h3>
            <p className="text-muted-foreground">
              Your conversations are secure and private. We never store or analyze your data.
            </p>
          </div>
        </div>

        {/* Demo Section */}
        <div className="mt-32 max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">See AtChat in Action</h2>
            <p className="text-muted-foreground">
              Experience the power of AI conversation with our intuitive interface
            </p>
          </div>

          <div className="bg-card border rounded-2xl p-8 shadow-lg">
            <div className="space-y-6">
              {/* Mock Chat Interface */}
              <div className="space-y-4">
                <div className="flex justify-end">
                  <div className="bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-4 py-3 max-w-sm">
                    Explain quantum computing in simple terms
                  </div>
                </div>
                <div className="flex justify-start">
                  <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3 max-w-lg">
                    <div className="space-y-2">
                      <p>Quantum computing is like having a super-powered calculator that can explore multiple solutions simultaneously...</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        Gemini 2.5 Flash
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
                  <MessageSquare className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="text-xl font-bold">AtChat</span>
              </div>
              <p className="text-muted-foreground">
                The next generation AI chat platform for everyone.
              </p>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold">Product</h4>
              <div className="space-y-2 text-sm">
                <Link to="/features" className="block text-muted-foreground hover:text-foreground">
                  Features
                </Link>
                <Link to="/pricing" className="block text-muted-foreground hover:text-foreground">
                  Pricing
                </Link>
                <Link to="/models" className="block text-muted-foreground hover:text-foreground">
                  AI Models
                </Link>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold">Company</h4>
              <div className="space-y-2 text-sm">
                <Link to="/about" className="block text-muted-foreground hover:text-foreground">
                  About
                </Link>
                <Link to="/blog" className="block text-muted-foreground hover:text-foreground">
                  Blog
                </Link>
                <Link to="/support" className="block text-muted-foreground hover:text-foreground">
                  Support
                </Link>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold">Legal</h4>
              <div className="space-y-2 text-sm">
                <Link to="/privacy" className="block text-muted-foreground hover:text-foreground">
                  Privacy Policy
                </Link>
                <Link to="/terms" className="block text-muted-foreground hover:text-foreground">
                  Terms of Service
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © 2025 AtChat. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <Link to="#" className="text-muted-foreground hover:text-foreground">
                <Github className="h-5 w-5" />
              </Link>
              <Link to="#" className="text-muted-foreground hover:text-foreground">
                <Twitter className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
