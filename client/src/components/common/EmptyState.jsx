import clsx from 'clsx';

export default function EmptyState({ icon: Icon, title, description, action, className }) {
  return (
    <div
      className={clsx(
        'flex flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-white/60 px-6 py-14 text-center dark:bg-transparent',
        className
      )}
    >
      {Icon && (
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-lavender dark:bg-accent/20">
          <Icon size={26} className="text-accent" />
        </div>
      )}
      <h3 className="text-base font-bold">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-ink-soft">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
