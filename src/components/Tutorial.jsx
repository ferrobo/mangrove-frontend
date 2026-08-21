import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, ArrowRight, X } from 'lucide-react';
import { TUTORIAL_STEPS, SPRING } from '@/lib/constants';
import { useReducedMotion } from '@/hooks/useReducedMotion';

export default function Tutorial({ open, onClose, onComplete }) {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const reduced = useReducedMotion();
  const dialogRef = useRef(null);
  const firstButtonRef = useRef(null);

  const total = TUTORIAL_STEPS.length;
  const isLast = step === total - 1;

  useEffect(() => {
    if (open) {
      setStep(0);
      setDirection(1);
      // Focus first button after mount
      const t = setTimeout(() => firstButtonRef.current?.focus(), 100);
      return () => clearTimeout(t);
    }
  }, [open]);

  // Escape closes
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') {
        handleSkip();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handleBack();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, step]);

  // Body scroll lock
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  const handleNext = () => {
    if (isLast) {
      onComplete();
    } else {
      setDirection(1);
      setStep((s) => Math.min(s + 1, total - 1));
    }
  };

  const handleBack = () => {
    if (step === 0) return;
    setDirection(-1);
    setStep((s) => Math.max(s - 1, 0));
  };

  const handleSkip = () => {
    onComplete();
  };

  const current = TUTORIAL_STEPS[step];
  const ease = reduced ? undefined : SPRING;
  const modalDuration = reduced ? 0.01 : 0.5;
  const stepVariants = {
    enter: (travel) => ({
      opacity: 0,
      y: reduced ? 0 : travel > 0 ? 14 : -14,
    }),
    center: { opacity: 1, y: 0 },
    exit: (travel) => ({
      opacity: 0,
      y: reduced ? 0 : travel > 0 ? -10 : 10,
    }),
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: modalDuration }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-zinc-950/90 backdrop-blur-md"
            onClick={handleSkip}
            aria-hidden="true"
          />

          {/* Modal */}
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="tutorial-title"
            className="relative z-10 mx-4 flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950 shadow-2xl"
            initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 20 }}
            animate={reduced ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 20 }}
            transition={{ duration: modalDuration, ease }}
          >
            {/* Close button */}
            <button
              onClick={handleSkip}
              className="absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-zinc-800/60 hover:text-zinc-200"
              aria-label="Skip tutorial"
            >
              <X size={20} />
            </button>

            {/* Content */}
            <div className="flex flex-1 flex-col px-6 pb-8 pt-16 sm:px-12 sm:pt-20">
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={step}
                  custom={direction}
                  variants={stepVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{
                    ease,
                    opacity: { duration: reduced ? 0.01 : 0.2 },
                    y: { duration: reduced ? 0.01 : 0.4, ease },
                  }}
                  className="flex flex-1 flex-col"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-light text-5xl leading-none text-signal-400 sm:text-7xl">
                      {current.number}
                    </span>
                    <span className="label-lane">{current.label}</span>
                  </div>

                  <h2
                    id="tutorial-title"
                    className="mt-6 text-3xl font-light tracking-tight text-zinc-50 sm:text-4xl"
                  >
                    {current.title}
                  </h2>

                  <p className="mt-5 max-w-md text-base leading-relaxed text-zinc-400">
                    {current.body}
                  </p>
                </motion.div>
              </AnimatePresence>

              {/* Progress dots */}
              <div className="mt-10 flex items-center gap-2">
                {TUTORIAL_STEPS.map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{
                      width: i === step ? 32 : 8,
                      backgroundColor: i === step ? '#42ad98' : '#3f3f46',
                    }}
                    transition={{ duration: reduced ? 0.01 : 0.35, ease: SPRING }}
                    className="h-1 rounded-full"
                  />
                ))}
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between gap-3 border-t border-zinc-800 px-6 py-5 sm:px-12">
              <button
                onClick={handleBack}
                disabled={step === 0}
                className="btn-ghost disabled:opacity-30"
                aria-label="Previous step"
              >
                <ArrowLeft size={16} />
                Back
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleSkip}
                  className="btn-ghost"
                >
                  Skip
                </button>
                <button
                  ref={firstButtonRef}
                  onClick={handleNext}
                  className="btn-primary"
                >
                  {isLast ? 'Start exploring' : 'Next'}
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
