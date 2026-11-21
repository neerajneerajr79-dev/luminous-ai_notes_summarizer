import clsx from 'clsx';

const accents = {
  accent: 'bg-accent-lavender text-accent dark:bg-accent/20 dark:text-accent-soft',
  success: 'bg-emerald-50 text-success dark:bg-emerald-900/30',
  gray: 'bg-surface-mute text-ink-soft',
  amber: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30',
  red: 'bg-red-50 text-red-600 dark:bg-red-900/30',
};

export default function Badge({ tone = 'accent', className, children }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-2xs font-semibold',
        accents[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
