import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowRight, ArrowDown } from 'lucide-react';
import ScrollReveal from '@/components/ScrollReveal';
import { SOURCE_LANES, SIGNAL_FLOW, SPRING } from '@/lib/constants';
import { useReducedMotion } from '@/hooks/useReducedMotion';

const HERO_IMG =
  'https://images.pexels.com/photos/15285303/pexels-photo-15285303.jpeg?auto=compress&cs=tinysrgb&w=1920';
const ETHOS_IMG =
  'https://images.pexels.com/photos/30004134/pexels-photo-30004134.jpeg?auto=compress&cs=tinysrgb&w=1920';
const IMPACT_IMG =
  'https://images.pexels.com/photos/12871825/pexels-photo-12871825.jpeg?auto=compress&cs=tinysrgb&w=1920';

const SEPARATION_POINTS = [
  {
    title: 'A ground photo is not satellite data.',
    desc: 'A community-submitted photo shows one place at one moment. It does not become satellite data by being uploaded.',
  },
  {
    title: 'Mapped mangrove extent is not proof of a ground event.',
    desc: 'Global Mangrove Watch shows where mangroves are mapped to exist. It does not confirm what happened on the ground.',
  },
  {
    title: 'AI suggestions are not confirmed evidence.',
    desc: 'A vision draft can describe visible observations. It remains unconfirmed until a human edits, removes, or accepts it.',
  },
  {
    title: 'Human review controls publication.',
    desc: 'Submitted reports stay private first. A human reviewer decides when a report enters the public workflow.',
  },
];

const heroEase = [0.23, 1, 0.32, 1];

export default function Home() {
  const reduced = useReducedMotion();

  return (
    <div className="overflow-hidden">
      {/* ===== HERO ===== */}
      <section className="relative flex min-h-[100svh] items-center justify-center overflow-hidden">
        {/* Background image */}
        <div className="absolute inset-0 z-0">
          <motion.img
            src={HERO_IMG}
            alt=""
            aria-hidden="true"
            className="h-full w-full object-cover opacity-40"
            initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 1.09 }}
            animate={reduced ? { opacity: 0.4 } : { opacity: 0.4, scale: 1 }}
            transition={{ duration: reduced ? 0.01 : 1.9, ease: heroEase }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/70 via-zinc-950/50 to-zinc-950" />
          <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/60 via-transparent to-zinc-950/60" />
        </div>

        {/* Content */}
        <div className="container-edge relative z-10 flex flex-col items-center pt-20 text-center">
          <motion.p
            className="label-eyebrow mb-8"
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduced ? 0.01 : 0.8, ease: heroEase, delay: 0.3 }}
          >
            MangroveSignal
          </motion.p>

          <h1 className="display-text max-w-5xl text-[clamp(2.5rem,9vw,7rem)] text-zinc-50">
            {['Ground evidence.', 'Mapped context.'].map((line, i) => (
              <motion.span
                key={i}
                className="block"
                initial={reduced ? { opacity: 0 } : { opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: reduced ? 0.01 : 1.1, ease: heroEase, delay: 0.5 + i * 0.15 }}
              >
                {line}
              </motion.span>
            ))}
            <motion.span
              className="block font-light italic text-zinc-400"
              initial={reduced ? { opacity: 0 } : { opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reduced ? 0.01 : 1.1, ease: heroEase, delay: 0.8 }}
            >
              Human judgment.
            </motion.span>
          </h1>

          <motion.p
            className="mt-8 max-w-xl text-base leading-relaxed text-zinc-400 sm:text-lg"
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduced ? 0.01 : 0.9, ease: heroEase, delay: 1.0 }}
          >
            Community coastal observations become source-separated Review Packets
            before human review controls what becomes public.
          </motion.p>

          <motion.div
            className="mt-10 flex flex-col items-center gap-3 sm:flex-row"
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduced ? 0.01 : 0.9, ease: heroEase, delay: 1.2 }}
          >
            <Link to="/report" className="btn-primary group">
              Report an observation
              <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
            <Link to="/map" className="btn-secondary">
              Explore reviewed reports
            </Link>
          </motion.div>
        </div>

        {/* Scroll indicator — absolutely positioned bottom-center, never overlaps CTAs */}
        <motion.div
          className="pointer-events-none absolute bottom-2 left-1/2 z-10 -translate-x-1/2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.6, duration: 0.8 }}
          aria-hidden="true"
        >
          <div className="flex h-10 w-6 items-start justify-center overflow-hidden rounded-full border border-zinc-600 p-1.5">
            <span className="h-2 w-1 rounded-full bg-zinc-400 animate-scroll-down" />
          </div>
        </motion.div>
      </section>

      {/* ===== WHY SOURCE SEPARATION MATTERS ===== */}
      <section className="relative py-24 sm:py-32 lg:py-40">
        <div className="container-edge">
          <ScrollReveal>
            <p className="label-eyebrow mb-6">The principle</p>
            <h2 className="display-text max-w-3xl text-[clamp(2rem,5vw,4rem)] text-zinc-50">
              Why source separation matters
            </h2>
          </ScrollReveal>

          <div className="mt-16 grid gap-12 lg:grid-cols-2 lg:gap-20">
            {/* Image reveal with mask wipe */}
            <ScrollReveal className="order-2 lg:order-1" y={50}>
              <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-zinc-800">
                <motion.img
                  src={ETHOS_IMG}
                  alt="Atmospheric mangrove roots at low tide"
                  className="h-full w-full object-cover"
                  initial={reduced ? { opacity: 1 } : { opacity: 0, scale: 1.04 }}
                  whileInView={reduced ? { opacity: 1 } : { opacity: 1, scale: 1 }}
                  viewport={{ once: true, margin: '-80px' }}
                  transition={{ duration: reduced ? 0.01 : 1.4, ease: SPRING }}
                />
                {/* Mask overlay — scales away vertically */}
                <motion.div
                  className="absolute inset-0 bg-zinc-950 origin-bottom"
                  initial={reduced ? { scaleY: 0 } : { scaleY: 1 }}
                  whileInView={{ scaleY: 0 }}
                  viewport={{ once: true, margin: '-80px' }}
                  transition={{ duration: reduced ? 0.01 : 1.3, ease: SPRING }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/60 via-transparent to-transparent" />
              </div>
            </ScrollReveal>

            {/* Text */}
            <div className="order-1 flex flex-col justify-center lg:order-2">
              {SEPARATION_POINTS.map((point, i) => (
                <ScrollReveal key={i} delay={i * 0.1} y={40}>
                  <div className="border-l border-zinc-800 py-6 pl-6 first:pt-0 last:pb-0">
                    <h3 className="text-lg font-medium text-zinc-100 sm:text-xl">
                      {point.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-zinc-400 sm:text-base">
                      {point.desc}
                    </p>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== FOUR SOURCE LANES ===== */}
      <section className="relative py-24 sm:py-32 lg:py-40">
        <div className="container-edge">
          <ScrollReveal>
            <p className="label-eyebrow mb-6">Four source lanes</p>
            <h2 className="display-text max-w-3xl text-[clamp(2rem,5vw,4rem)] text-zinc-50">
              Never collapsed into
              <br />
              <span className="italic text-zinc-400">one score.</span>
            </h2>
          </ScrollReveal>

          <div className="mt-16 grid gap-4 sm:gap-5 md:grid-cols-2">
            {SOURCE_LANES.map((lane, i) => (
              <ScrollReveal key={lane.id} delay={i * 0.1} y={50}>
                <motion.article
                  className="group relative h-full overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/30 p-8 transition-colors duration-500 ease-spring hover:border-zinc-700 hover:bg-zinc-900/50 sm:p-10"
                  whileHover={reduced ? undefined : { y: -4 }}
                      transition={{ duration: 0.4, ease: SPRING }}
                >
                  <div className="flex items-start justify-between">
                    <motion.span
                      className="font-light text-4xl text-signal-400/80 sm:text-5xl"
                      initial={reduced ? { opacity: 1 } : { opacity: 0, y: 12 }}
                      whileInView={reduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: '-80px' }}
                      transition={{ duration: reduced ? 0.01 : 0.8, delay: i * 0.1 + 0.1, ease: SPRING }}
                    >
                      {lane.number}
                    </motion.span>
                    <span className="label-lane">{lane.sublabel}</span>
                  </div>
                  <h3 className="mt-8 text-xl font-medium tracking-tight text-zinc-50 sm:text-2xl">
                    {lane.label}
                  </h3>
                  <p className="mt-4 text-sm leading-relaxed text-zinc-400 sm:text-base">
                    {lane.description}
                  </p>
                  <div className="mt-8 h-px w-full bg-zinc-800 transition-all duration-500 ease-spring group-hover:bg-signal-400/40" />
                </motion.article>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CINEMATIC IMPACT ===== */}
      <section className="relative flex min-h-[80vh] items-center overflow-hidden py-24 sm:py-32">
        <div className="absolute inset-0 z-0">
          <img
            src={IMPACT_IMG}
            alt=""
            aria-hidden="true"
            className="h-full w-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/60 to-zinc-950/30" />
        </div>

        <div className="container-edge relative z-10">
          <ScrollReveal y={50}>
            <h2 className="display-text max-w-3xl text-[clamp(2rem,6vw,5rem)] text-zinc-50">
              Observe locally.
              <br />
              <span className="italic text-zinc-400">Review responsibly.</span>
            </h2>
          </ScrollReveal>
          <ScrollReveal delay={0.15} y={40}>
            <p className="mt-8 max-w-lg text-base leading-relaxed text-zinc-300 sm:text-lg">
              Reports remain private before entering the public workflow. A human
              reviewer controls whether a report is allowed through — not an
              algorithm, and never a single score.
            </p>
          </ScrollReveal>
          <ScrollReveal delay={0.25} y={30}>
            <Link to="/report" className="btn-primary mt-10 group">
              Report an observation
              <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </ScrollReveal>
        </div>
      </section>

      {/* ===== HOW A SIGNAL BECOMES PUBLIC ===== */}
      <section className="relative py-24 sm:py-32 lg:py-40">
        <div className="container-edge">
          <ScrollReveal>
            <p className="label-eyebrow mb-6">The journey</p>
            <h2 className="display-text max-w-3xl text-[clamp(2rem,5vw,4rem)] text-zinc-50">
              How a signal
              <br />
              <span className="italic text-zinc-400">becomes public.</span>
            </h2>
          </ScrollReveal>

          <div className="mt-16">
            {SIGNAL_FLOW.map((item, i) => (
              <ScrollReveal key={i} delay={i * 0.08} y={40}>
                <div className="group flex items-start gap-6 border-t border-zinc-800 py-8 transition-colors duration-500 hover:border-zinc-700 last:border-b">
                  <span className="mt-1 font-light text-2xl text-zinc-600 transition-colors duration-500 group-hover:text-signal-400 sm:text-3xl">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-zinc-100 sm:text-xl">
                      {item.step}
                    </h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-zinc-400 sm:text-base">
                      {item.desc}
                    </p>
                  </div>
                  {i < SIGNAL_FLOW.length - 1 && (
                    <ArrowDown
                      size={18}
                      className="mt-2 hidden text-zinc-700 sm:block"
                      aria-hidden="true"
                    />
                  )}
                </div>
              </ScrollReveal>
            ))}
          </div>

          <ScrollReveal delay={0.1} y={30}>
            <p className="mt-12 max-w-lg text-sm leading-relaxed text-zinc-500">
              No step in this flow implies verification. Source lanes remain
              visibly distinct from photo to publication.
            </p>
          </ScrollReveal>
        </div>
      </section>
    </div>
  );
}
