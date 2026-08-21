import { useCallback, useEffect, useState } from 'react';
import { ONBOARDING_KEY } from '@/lib/constants';

// Tracks whether the first-visit tutorial has been completed.
// openTutorial lets the "How it works" nav link reopen it without clearing storage.
export function useOnboarding() {
  const [complete, setComplete] = useState(true);
  const [forceOpen, setForceOpen] = useState(false);

  useEffect(() => {
    try {
      const v = localStorage.getItem(ONBOARDING_KEY);
      setComplete(v === 'true');
    } catch {
      setComplete(false);
    }
  }, []);

  const completeTutorial = useCallback(() => {
    try {
      localStorage.setItem(ONBOARDING_KEY, 'true');
    } catch {
      /* ignore */
    }
    setComplete(true);
    setForceOpen(false);
  }, []);

  const openTutorial = useCallback(() => {
    setForceOpen(true);
  }, []);

  const closeForceOpen = useCallback(() => {
    setForceOpen(false);
  }, []);

  const shouldShowTutorial = !complete || forceOpen;

  return { complete, shouldShowTutorial, forceOpen, completeTutorial, openTutorial, closeForceOpen };
}
