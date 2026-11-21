import React from 'react';
import { Link } from 'react-router-dom';
import Logo from '../common/Logo';

const COLUMNS = [
  {
    heading: 'Product',
    links: [
      { label: 'Features', href: '/#features' },
      { label: 'How it works', href: '/#how-it-works' },
      { label: 'Pricing', href: '/#about' },
      { label: 'Get started', href: '/register' },
    ],
  },
  {
    heading: 'Learn',
    links: [
      { label: 'AI Summarizer', href: '/summarizer' },
      { label: 'Flashcards', href: '/flashcards' },
      { label: 'Quizzes', href: '/quizzes' },
      { label: 'Ask Lumio', href: '/ask' },
    ],
  },
  {
    heading: 'Account',
    links: [
      { label: 'Log in', href: '/login' },
      { label: 'Sign up', href: '/register' },
      { label: 'Dashboard', href: '/dashboard' },
    ],
  },
];

export default function LandingFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-line bg-white dark:border-white/10 dark:bg-ink-secondary">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-ink-soft">
              Your personal AI learning assistant. Summarize notes, understand complex concepts,
              create flashcards, and prepare smarter for every exam.
            </p>
          </div>
          {COLUMNS.map((col) => (
            <div key={col.heading}>
              <h4 className="text-xs font-bold uppercase tracking-widest text-ink-soft">{col.heading}</h4>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link to={l.href} className="text-sm text-ink-soft transition-colors hover:text-accent">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-line pt-6 text-xs text-ink-soft sm:flex-row dark:border-white/10">
          <p>© {year} Lumio AI. Built for students, by design.</p>
          <p>Study smarter — not longer.</p>
        </div>
      </div>
    </footer>
  );
}
