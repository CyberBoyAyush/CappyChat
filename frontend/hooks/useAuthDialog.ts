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
      '🚀 Ready for unlimited AI magic?',
      'Join free: 200 basic + 20 premium + 2 super premium prompts monthly!'
    );
  }, [showSignupDialog]);

  const showPremiumFeatureDialog = useCallback((featureName: string) => {
    showLoginDialog(
      `🔐 ${featureName} awaits!`,
      'Sign in to unlock this feature and more premium tools.'
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
