import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, X } from 'lucide-react';

const navItems = [
  { to: '/', label: 'Home', end: true },
  { to: '/report', label: 'Report' },
  { to: '/map', label: 'Map' },
  { to: '/review', label: 'Review' },
];

export default function Nav({ onHowItWorks }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-spring ${
        scrolled
          ? 'bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-800/60'
          : 'bg-transparent border-b border-transparent'
      }`}
    >
      <nav
        className={`container-edge flex items-center justify-between transition-all duration-500 ease-spring ${
          scrolled ? 'h-14 lg:h-16' : 'h-16 lg:h-20'
        }`}
      >
        <Link
          to="/"
          className="group flex items-center gap-2.5 text-zinc-50"
          aria-label="MangroveSignal home"
        >
          <span className="relative flex h-7 w-7 items-center justify-center">
            <span className="absolute inset-0 rounded-full border border-signal-400/40" />
            <span className="absolute inset-1.5 rounded-full border border-signal-400/60" />
            <span className="h-2 w-2 rounded-full bg-signal-400 transition-transform duration-500 ease-spring group-hover:scale-125" />
          </span>
          <span className="text-sm font-medium tracking-tight">
            Mangrove<span className="text-signal-400">Signal</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `relative rounded-full px-4 py-2 text-sm font-medium transition-colors duration-300 ${
                  isActive ? 'text-zinc-50' : 'text-zinc-400 hover:text-zinc-100'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {item.label}
                  {isActive && (
                    <motion.span
                      layoutId="nav-active"
                      className="absolute inset-0 -z-10 rounded-full bg-zinc-800/60"
                      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                    />
                  )}
                </>
              )}
            </NavLink>
          ))}
          <button
            onClick={onHowItWorks}
            className="rounded-full px-4 py-2 text-sm font-medium text-zinc-400 transition-colors duration-300 hover:text-zinc-100"
          >
            How it works
          </button>
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="flex h-10 w-10 items-center justify-center rounded-full text-zinc-300 transition-colors hover:bg-zinc-800/60 hover:text-zinc-50 md:hidden"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
            className="overflow-hidden border-t border-zinc-800/60 bg-zinc-950/95 backdrop-blur-xl md:hidden"
          >
            <div className="container-edge flex flex-col gap-1 py-4">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `rounded-xl px-4 py-3 text-base font-medium transition-colors ${
                      isActive
                        ? 'bg-zinc-800/60 text-zinc-50'
                        : 'text-zinc-300 hover:bg-zinc-800/40 hover:text-zinc-50'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onHowItWorks();
                }}
                className="rounded-xl px-4 py-3 text-left text-base font-medium text-zinc-300 transition-colors hover:bg-zinc-800/40 hover:text-zinc-50"
              >
                How it works
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
