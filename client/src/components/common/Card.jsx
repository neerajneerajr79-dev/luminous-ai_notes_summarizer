import clsx from 'clsx';

export default function Card({ className, hover = false, children, ...props }) {
  return (
    <div
      className={clsx(
        'card',
        hover && 'transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
