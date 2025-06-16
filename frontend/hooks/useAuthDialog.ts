/**
 * Auth Dialog Hook
 * 
 * Manages the state and logic for showing authentication dialogs
 * when guest users hit limits or try to access premium features.
 */

import { useState, useCallback } from 'react';

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
      '🎉 Hey there, superstar! Ready to unlock the magic? Sign up and get 200 basic prompts, 20 premium prompts, and 2 super premium prompts every month - totally FREE! 🚀',
      'Takes just 30 seconds, and your future self will thank you! ✨'
    );
  }, [showSignupDialog]);

  const showPremiumFeatureDialog = useCallback((featureName: string) => {
    showLoginDialog(
      `🔐 ${featureName} is waiting for you!`,
      'Join the club (it\'s free!) and unlock this awesome feature plus so much more! 🎯'
    );
  }, [showLoginDialog]);

  return {
    ...dialogState,
    showLoginDialog,
    showSignupDialog,
    closeDialog,
    showGuestLimitDialog,
    showPremiumFeatureDialog
  };
};
