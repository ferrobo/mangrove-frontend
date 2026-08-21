import { motion } from 'motion/react';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { SPRING } from '@/lib/constants';

// Cinematic scroll-reveal wrapper. Slow + atmospheric by default.
// Pass `fast` for application interactions.
export default function ScrollReveal({
  children,
  delay = 0,
  fast = false,
  y = 48,
  className = '',
  as = 'div',
}) {
  const reduced = useReducedMotion();
  const MotionTag = motion[as] || motion.div;

  if (reduced) {
    return <div className={className}>{children}</div>;
  }

  const duration = fast ? 0.5 : 1.0;

  return (
    <MotionTag
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration, delay, ease: SPRING }}
    >
      {children}
    </MotionTag>
  );
}
