import clsx from 'clsx';
import { Loader2 } from 'lucide-react';

const variants = {
  primary:
    'bg-accent text-white hover:bg-accent/90 shadow-[0_4px_16px_-6px_rgb(117_107_238_/_0.6)] disabled:bg-accent/60',
  secondary:
    'bg-accent-lavender text-accent hover:bg-accent-lavender/70 disabled:opacity-60 dark:bg-accent/20 dark:text-accent-soft',
  outline:
    'border border-line bg-white text-ink hover:border-accent/40 hover:bg-accent-lavender/40 dark:bg-transparent',
  ghost: 'text-ink-soft hover:bg-surface-mute hover:text-ink',
  danger: 'bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-950/40 dark:text-red-400',
};

const sizes = {
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-11 px-5 text-sm gap-2',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon: Icon,
  className,
  children,
  disabled,
  ...props
}) {
  return (
    <button
      className={clsx(
        'inline-flex select-none items-center justify-center rounded-xl font-semibold transition-all duration-150 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70',
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Loader2 size={16} className="animate-spin" /> : Icon ? <Icon size={16} /> : null}
      {children}
    </button>
  );
}
