import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Sparkles, Zap, Layers, MessageSquareText } from 'lucide-react';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { LogoMark } from '../components/common/Logo';

/** Shared split-screen shell for auth pages. */
export default function AuthLayout({ title, subtitle, children, cta }) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="grid min-h-screen bg-surface-mute lg:grid-cols-[1.1fr_1fr]">
      {/* Form side */}
      <div className="relative flex flex-col px-6 py-6 sm:px-10 lg:px-16">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1.5 self-start rounded-lg px-2 py-1.5 text-sm font-medium text-ink-soft transition-colors hover:text-ink"
        >
          <ArrowLeft size={16} /> Back to home
        </button>
        <div className="flex flex-1 items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-sm"
          >
            <div className="mb-8 lg:hidden">
              <LogoMark size={40} />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{title}</h1>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">{subtitle}</p>
            <div className="mt-8">{children}</div>
            {cta && <div className="mt-7 text-sm text-ink-soft">{cta}</div>}
          </motion.div>
        </div>
      </div>

      {/* Visual side */}
      <div className="relative hidden overflow-hidden bg-ink lg:flex lg:flex-col lg:justify-center lg:px-14">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(500px 320px at 80% 15%, rgb(117 107 238 / 0.5), transparent), radial-gradient(400px 260px at 10% 85%, rgb(74 60 205 / 0.35), transparent)',
          }}
        />
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative text-white"
        >
          <h2 className="max-w-md text-3xl font-extrabold leading-snug tracking-tight">
            Turn your notes into knowledge.
          </h2>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/60">
            Summaries, flashcards and quizzes generated from your own study material — grounded in
            your pages, not made up.
          </p>
          <div className="mt-10 space-y-4">
            {[
              { icon: Sparkles, label: 'Summarize PDFs, DOCX and slides' },
              { icon: Zap, label: 'Auto-generate flashcards & quizzes' },
              { icon: MessageSquareText, label: 'Ask questions with page references' },
              { icon: Layers, label: 'Revise with spaced repetition' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-3 text-sm font-medium text-white/80">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
                  <Icon size={15} />
                </span>
                {label}
              </div>
            ))}
          </div>
          <Link
            to="/"
            className="mt-12 inline-flex items-center gap-2 text-xs font-semibold text-white/40 transition-colors hover:text-white/80"
          >
            <Sparkles size={13} /> lumio.ai
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
