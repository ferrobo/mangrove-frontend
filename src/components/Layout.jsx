import { Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Nav from './Nav';
import Footer from './Footer';
import Tutorial from './Tutorial';
import { useOnboarding } from '@/hooks/useOnboarding';

export default function Layout() {
  const { shouldShowTutorial, completeTutorial, openTutorial, closeForceOpen } = useOnboarding();
  const location = useLocation();

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const handleHowItWorks = () => {
    openTutorial();
  };

  // Tutorial is "complete" from storage but we force-opened it
  const tutorialOpen = shouldShowTutorial;

  const handleCloseTutorial = () => {
    // If it was force-opened (already complete), just close the overlay.
    // If it was a genuine first visit, mark complete.
    completeTutorial();
    closeForceOpen();
  };

  return (
    <div className="flex min-h-screen flex-col bg-zinc-950">
      <Nav onHowItWorks={handleHowItWorks} />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer onHowItWorks={handleHowItWorks} />
      <Tutorial
        open={tutorialOpen}
        onClose={handleCloseTutorial}
        onComplete={handleCloseTutorial}
      />
    </div>
  );
}
