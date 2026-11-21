import React from 'react';
import { motion } from 'framer-motion';

/** Lumio AI logo mark - L monogram in a rounded accent square. */
export function LogoMark({ size = 36 }) {
  return (
    <motion.div
      whileHover={{ rotate: -4, scale: 1.04 }}
      transition={{ type: 'spring', stiffness: 300, damping: 18 }}
      className="flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-accent-soft text-white shadow-glow"
      style={{ width: size, height: size }}
      aria-hidden
    >
      <svg viewBox="0 0 24 24" width={size * 0.55} height={size * 0.55} fill="none">
        <path
          d="M7 4v13h10M17 4v13"
          stroke="currentColor"
          strokeWidth="2.6"
          strokeLinecap="round"
          className="opacity-0"
        />
        <path d="M7 4v13h9" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
        <circle cx="18" cy="17" r="1.6" fill="currentColor" />
      </svg>
    </motion.div>
  );
}

export default function Logo({ size = 36, showText = true, textSize = 'text-lg' }) {
  return (
    <div className="flex items-center gap-2.5">
      <LogoMark size={size} />
      {showText && (
        <span className={`${textSize} font-extrabold tracking-tight`}>
          Lumio<span className="text-accent"> AI</span>
        </span>
      )}
    </div>
  );
}
