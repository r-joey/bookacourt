// Lightweight skeleton primitives for instant loading states.

export function Shimmer({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-slate-200/80 ${className}`} />;
}

export function PageHeaderSkeleton() {
  return (
    <div className="space-y-2">
      <Shimmer className="h-7 w-44" />
      <Shimmer className="h-4 w-64" />
    </div>
  );
}

export function StatCardsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card space-y-3 p-5">
          <Shimmer className="h-3 w-24" />
          <Shimmer className="h-8 w-16" />
          <Shimmer className="h-3 w-20" />
        </div>
      ))}
    </div>
  );
}

export function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="card divide-y divide-slate-100">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center justify-between p-4">
          <div className="space-y-2">
            <Shimmer className="h-4 w-48" />
            <Shimmer className="h-3 w-28" />
          </div>
          <Shimmer className="h-8 w-20" />
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="card overflow-hidden">
      <div className="border-b border-slate-100 bg-slate-50 px-4 py-3">
        <Shimmer className="h-3 w-32" />
      </div>
      <div className="divide-y divide-slate-100">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3.5">
            <Shimmer className="h-4 flex-1" />
            <Shimmer className="hidden h-4 w-24 sm:block" />
            <Shimmer className="hidden h-4 w-20 md:block" />
            <Shimmer className="h-6 w-16 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
