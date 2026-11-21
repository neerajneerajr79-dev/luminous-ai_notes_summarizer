import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import { Menu, X, Sparkles } from 'lucide-react';
import Logo, { LogoMark } from '../common/Logo';
import Button from '../common/Button';

const LINKS = [
  { href: '#features', label: 'Features' },
  { href: '#how-it-works', label: 'How it works' },
  { href: '#about', label: 'About' },
];

export default function LandingNav({ onOpenMobileNav, mobileOpen, onCloseMobileNav }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const linkCount = 0;
  void linkCount;

  return (
    <>
      <header
        className={clsx(
          'fixed inset-x-0 top-0 z-50 transition-all duration-300',
          scrolled ? 'border-b border-line bg-white/85 shadow-soft backdrop-blur-xl' : 'bg-transparent'
        )}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" aria-label="Lumio AI home">
            <Logo size={34} />
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            {LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="text-sm font-medium text-ink-soft transition-colors hover:text-ink"
              >
                {l.label}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <Link to="/login">
              <Button variant="ghost" size="sm">Log in</Button>
            </Link>
            <Link to="/register">
              <Button size="sm" icon={Sparkles}>Get Started</Button>
            </Link>
          </div>

          <button
            onClick={onOpenMobileNav}
            className="rounded-xl p-2 text-ink-soft hover:bg-surface-mute md:hidden"
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
        </div>
      </header>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[60] bg-white dark:bg-ink md:hidden">
          <div className="flex h-16 items-center justify-between px-4">
            <Logo />
            <button onClick={onCloseMobileNav} className="rounded-xl p-2 text-ink-soft" aria-label="Close menu">
              <X size={20} />
            </button>
          </div>
          <nav className="flex flex-col gap-1 px-4 pt-4">
            {LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={onCloseMobileNav}
                className="rounded-xl px-3 py-3 text-base font-semibold hover:bg-surface-mute"
              >
                {l.label}
              </a>
            ))}
            <div className="mt-4 flex flex-col gap-2">
              <Link to="/login" onClick={onCloseMobileNav}>
                <Button variant="outline" className="w-full">Log in</Button>
              </Link>
              <Link to="/register" onClick={onCloseMobileNav}>
                <Button className="w-full">Get Started</Button>
              </Link>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
