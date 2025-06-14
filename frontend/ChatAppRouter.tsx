/**
 * ChatAppRouter Component
 *
 * Used in: app/static-app-shell/page.tsx
 * Purpose: Main application router component that defines all routes and layout structure.
 * Sets up routing for home, chat threads, settings, authentication, and handles 404 pages.
 * Includes authentication protection and providers.
 */

import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import ChatLayoutWrapper from "./ChatLayoutWrapper";
import ChatHomePage from "./routes/ChatHomePage";
import HomePage from "./routes/HomePage";
import LandingPage from "./routes/LandingPage";
import ChatThreadPage from "./routes/ChatThreadPage";
import SettingsPage from "./routes/SettingsPage";
import LoginPage from "./routes/auth/LoginPage";
import SignUpPage from "./routes/auth/SignUpPage";
import AuthCallbackPage from "./routes/auth/AuthCallbackPage";
import AuthErrorPage from "./routes/auth/AuthErrorPage";
import EmailVerificationPage from "./routes/auth/EmailVerificationPage";
import PrivacyPage from "./routes/PrivacyPage";
import ProfilePage from "./routes/ProfilePage";

export default function ChatAppRouter() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/landing" element={<LandingPage />} />

          {/* Auth routes (only accessible when not authenticated) */}
          <Route
            path="/auth/login"
            element={
              <ProtectedRoute requireAuth={false}>
                <LoginPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/auth/signup"
            element={
              <ProtectedRoute requireAuth={false}>
                <SignUpPage />
              </ProtectedRoute>
            }
          />

          {/* Auth callback and error routes (always accessible) */}
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="/auth/error" element={<AuthErrorPage />} />
          <Route path="/auth/verify" element={<EmailVerificationPage />} />

          {/* Protected routes (require authentication) */}
          <Route
            path="chat"
            element={
              <ProtectedRoute>
                <ChatLayoutWrapper />
              </ProtectedRoute>
            }
          >
            <Route index element={<ChatHomePage />} />
            <Route path=":id" element={<ChatThreadPage />} />
          </Route>

          <Route
            path="settings"
            element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="privacy"
            element={
              <ProtectedRoute>
                <PrivacyPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />

          {/* 404 page */}
          <Route
            path="*"
            element={
              <div className="min-h-screen bg-background flex items-center justify-center mobile-padding">
                <div className="text-center mobile-container">
                  <div className="mb-8">
                    <div className="mx-auto w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                      <svg
                        className="w-12 h-12 text-primary"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                        />
                      </svg>
                    </div>
                    <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">
                      404
                    </h1>
                    <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-4">
                      Page Not Found
                    </h2>
                    <p className="text-muted-foreground mobile-text mb-8 max-w-md mx-auto">
                      The page you're looking for doesn't exist. It might have been moved, deleted, or you entered the wrong URL.
                    </p>
                  </div>
                  
                  <div className="space-y-4">
                    <a
                      href="/"
                      className="inline-flex items-center justify-center mobile-touch px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all focus-enhanced mobile-text font-medium shadow-sm"
                    >
                      <svg
                        className="w-4 h-4 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                        />
                      </svg>
                      Go Home
                    </a>
                    
                    <div className="text-center">
                      <button
                        onClick={() => window.history.back()}
                        className="inline-flex items-center justify-center mobile-touch px-4 py-2 text-muted-foreground hover:text-foreground transition-colors focus-enhanced mobile-text"
                      >
                        <svg
                          className="w-4 h-4 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10 19l-7-7m0 0l7-7m-7 7h18"
                          />
                        </svg>
                        Go Back
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
