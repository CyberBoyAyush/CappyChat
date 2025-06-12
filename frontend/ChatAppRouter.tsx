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
              <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
                <div className="text-center">
                  <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                    404 - Page Not Found
                  </h1>
                  <p className="text-gray-600 dark:text-gray-300 mb-8">
                    The page you're looking for doesn't exist.
                  </p>
                  <a
                    href="/"
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Go Home
                  </a>
                </div>
              </div>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
