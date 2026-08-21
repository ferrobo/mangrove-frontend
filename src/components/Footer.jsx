import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { SPRING } from '@/lib/constants';
import { useReducedMotion } from '@/hooks/useReducedMotion';

const footerLinks = [
  { to: '/report', label: 'Report' },
  { to: '/map', label: 'Map' },
  { to: '/review', label: 'Review' },
];

export default function Footer({ onHowItWorks }) {
  const reduced = useReducedMotion();
  return (
    <footer className="relative overflow-hidden border-t border-zinc-800/60 bg-zinc-950">
      {/* Giant background text */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 flex select-none items-end justify-center"
        aria-hidden="true"
      >
        <motion.span
          className="translate-y-[18%] text-center text-[22vw] font-light leading-none tracking-tighter text-zinc-900 sm:text-[20vw] md:text-[18vw]"
          initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.78 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: reduced ? 0.01 : 1.5, ease: SPRING }}
        >
          SIGNAL
        </motion.span>
      </div>

      <div className="container-edge relative z-10 py-16 sm:py-20">
        <div className="flex flex-col gap-12 lg:flex-row lg:justify-between">
          <div className="max-w-md">
            <Link to="/" className="flex items-center gap-2.5">
              <span className="relative flex h-7 w-7 items-center justify-center">
                <span className="absolute inset-0 rounded-full border border-signal-400/40" />
                <span className="absolute inset-1.5 rounded-full border border-signal-400/60" />
                <span className="h-2 w-2 rounded-full bg-signal-400" />
              </span>
              <span className="text-sm font-medium tracking-tight text-zinc-50">
                Mangrove<span className="text-signal-400">Signal</span>
              </span>
            </Link>
            <p className="mt-5 text-lg font-light leading-snug text-zinc-300">
              Ground evidence.
              <br />
              Mapped context.
              <br />
              <span className="italic text-zinc-400">Human judgment.</span>
            </p>
          </div>

          <div className="flex flex-col gap-10 sm:flex-row sm:gap-16">
            <div>
              <p className="label-eyebrow mb-4">Navigate</p>
              <ul className="space-y-3">
                {footerLinks.map((l) => (
                  <li key={l.to}>
                    <Link
                      to={l.to}
                      className="text-sm text-zinc-400 transition-colors duration-300 hover:text-zinc-100"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
                <li>
                  <button
                    onClick={onHowItWorks}
                    className="text-sm text-zinc-400 transition-colors duration-300 hover:text-zinc-100"
                  >
                    How it works
                  </button>
                </li>
              </ul>
            </div>

            <div>
              <p className="label-eyebrow mb-4">Sources & provenance</p>
              <ul className="space-y-3 text-sm text-zinc-400">
                <li>Global Mangrove Watch</li>
                <li>OpenStreetMap</li>
                <li>Google Gemini Developer API</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-3 border-t border-zinc-800/60 pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-zinc-500">
            MangroveSignal — conservation-tech demonstration. Source lanes remain visibly distinct.
          </p>
          <p className="text-xs text-zinc-600">
            Never collapses different sources into one confidence score.
          </p>
        </div>
      </div>
    </footer>
  );
}
