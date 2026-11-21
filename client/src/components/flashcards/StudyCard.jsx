import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, RotateCcw } from 'lucide-react';
import Badge from '../common/Badge';

/** 3D flip flashcard. rating buttons are rendered by the parent below the card. */
export default function StudyCard({ card, flipped, onFlip, index, total }) {
  return (
    <div className="flex flex-col items-center">
      <div style={{ perspective: 1200 }} className="w-full max-w-xl">
        <motion.div
          className="relative w-full select-none"
          style={{ transformStyle: 'preserve-3d' }}
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          onClick={onFlip}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onFlip()}
          aria-label="Flashcard, click to flip"
        >
          {/* Front */}
          <div
            className="card flex min-h-[260px] cursor-pointer flex-col items-center justify-center gap-3 p-8 text-center [backface-visibility:hidden]"
            style={{ transform: 'rotateY(0deg)' }}
          >
            <Badge tone="gray">Question</Badge>
            <p className="text-base font-semibold leading-relaxed" style={{ overflowWrap: 'anywhere' }}>
              {card.question}
            </p>
            <span className="absolute bottom-4 right-5 flex items-center gap-1 text-2xs text-ink-soft">
              <Eye size={11} /> click to flip
            </span>
          </div>
          {/* Back */}
          <div
            className="absolute inset-0 flex min-h-[260px] cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border border-accent/30 bg-gradient-to-br from-accent-lavender to-white p-8 text-center shadow-glow [backface-visibility:hidden] dark:from-accent/20 dark:to-transparent"
            style={{ transform: 'rotateY(180deg)' }}
          >
            <Badge>Answer</Badge>
            <p className="text-sm leading-relaxed" style={{ overflowWrap: 'anywhere' }}>
              {card.answer}
            </p>
            <span className="absolute bottom-4 right-5 flex items-center gap-1 text-2xs text-ink-soft">
              <RotateCcw size={11} /> click to flip back
            </span>
          </div>
        </motion.div>
      </div>
      <p className="mt-4 text-xs text-ink-soft">
        Card {index + 1} of {total}
      </p>
    </div>
  );
}
