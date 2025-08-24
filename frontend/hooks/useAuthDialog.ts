/**
 * Auth Dialog Hook
 * 
 * Manages the state and logic for showing authentication dialogs
 * when guest users hit limits or try to access premium features.
 */

import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

interface AuthDialogState {
  isOpen: boolean;
  mode: 'login' | 'signup';
  title?: string;
  description?: string;
}

export const useAuthDialog = () => {
  const [dialogState, setDialogState] = useState<AuthDialogState>({
    isOpen: false,
    mode: 'login'
  });
  const navigate = useNavigate();

  const showLoginDialog = useCallback((title?: string, description?: string) => {
    setDialogState({
      isOpen: true,
      mode: 'login',
      title,
      description
    });
  }, []);

  const showSignupDialog = useCallback((title?: string, description?: string) => {
    setDialogState({
      isOpen: true,
      mode: 'signup',
      title,
      description
    });
  }, []);

  const closeDialog = useCallback(() => {
    setDialogState(prev => ({ ...prev, isOpen: false }));
  }, []);

  const showGuestLimitDialog = useCallback(() => {
    showSignupDialog(
      '🚀 Ready for unlimited AI magic?',
      'Join free: 80 basic + 10 premium + 2 super premium prompts monthly!'
    );
  }, [showSignupDialog]);

  const showPremiumFeatureDialog = useCallback((featureName: string) => {
    showLoginDialog(
      `🔐 ${featureName} awaits!`,
      'Sign in to unlock this feature and more premium tools.'
    );
  }, [showLoginDialog]);

  // Navigate to dedicated pages (faster alternative to dialogs)
  const navigateToLogin = useCallback((redirectPath?: string) => {
    const loginUrl = redirectPath ? `/login?redirect=${encodeURIComponent(redirectPath)}` : '/login';
    navigate(loginUrl);
  }, [navigate]);

  const navigateToSignup = useCallback((redirectPath?: string) => {
    const signupUrl = redirectPath ? `/signup?redirect=${encodeURIComponent(redirectPath)}` : '/signup';
    navigate(signupUrl);
  }, [navigate]);

  const showGuestLimitPage = useCallback(() => {
    const currentPath = window.location.pathname + window.location.search;
    navigateToSignup(currentPath);
  }, [navigateToSignup]);

  const showPremiumFeaturePage = useCallback((redirectPath?: string) => {
    const currentPath = redirectPath || window.location.pathname + window.location.search;
    navigateToLogin(currentPath);
  }, [navigateToLogin]);

  return {
    ...dialogState,
    showLoginDialog,
    showSignupDialog,
    closeDialog,
    showGuestLimitDialog,
    showPremiumFeatureDialog,
    navigateToLogin,
    navigateToSignup,
    showGuestLimitPage,
    showPremiumFeaturePage
  };
};
