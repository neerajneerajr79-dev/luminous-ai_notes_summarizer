import React from 'react';
import { Zap, BookOpen, GraduationCap, Lightbulb, Timer } from 'lucide-react';
import clsx from 'clsx';

export const SUMMARY_OPTIONS = [
  {
    id: 'quick',
    icon: Zap,
    title: 'Quick Summary',
    description: 'Short overview with main ideas and important takeaways.',
  },
  {
    id: 'detailed',
    icon: BookOpen,
    title: 'Detailed Summary',
    description: 'Topic-by-topic explanations, concepts, supporting details and definitions.',
  },
  {
    id: 'exam',
    icon: GraduationCap,
    title: 'Exam Preparation Notes',
    description: 'Likely exam topics, short & long answer questions, definitions and formulas.',
  },
  {
    id: 'simple',
    icon: Lightbulb,
    title: 'Simple Explanation',
    description: 'Beginner-friendly explanations with examples for complex material.',
  },
  {
    id: 'revision',
    icon: Timer,
    title: 'Last-Minute Revision',
    description: 'Highly condensed must-remember points, formulas and definitions.',
  },
];

export default function SummaryTypePicker({ value, onChange, disabled }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {SUMMARY_OPTIONS.map((opt) => {
        const active = value === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            disabled={disabled}
            onClick={() => onChange(opt.id)}
            className={clsx(
              'card flex h-full flex-col items-start gap-2 p-4 text-left transition-all disabled:cursor-not-allowed disabled:opacity-70',
              active
                ? '!border-accent ring-2 ring-accent/20'
                : 'hover:-translate-y-0.5 hover:shadow-lift'
            )}
            aria-pressed={active}
          >
            <span
              className={clsx(
                'flex h-9 w-9 items-center justify-center rounded-xl transition-colors',
                active ? 'bg-accent text-white' : 'bg-accent-lavender text-accent dark:bg-accent/20'
              )}
            >
              <opt.icon size={17} />
            </span>
            <p className={clsx('text-xs font-bold', active && 'text-accent')}>{opt.title}</p>
            <p className="text-2xs leading-relaxed text-ink-soft">{opt.description}</p>
          </button>
        );
      })}
    </div>
  );
}
