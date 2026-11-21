import clsx from 'clsx';

export function Skeleton({ className }) {
  return <div className={clsx('animate-shimmer rounded-xl bg-gradient-to-r from-line via-white to-line bg-[length:400px_100%]', className)} />;
}

export function SkeletonCard() {
  return (
    <div className="card p-5">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="mt-3 h-8 w-16" />
    </div>
  );
}

export function SkeletonList({ rows = 3 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="card flex items-center gap-3 p-4">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <div className="flex-1">
            <Skeleton className="h-3.5 w-1/3" />
            <Skeleton className="mt-2 h-3 w-1/5" />
          </div>
        </div>
      ))}
    </div>
  );
}
