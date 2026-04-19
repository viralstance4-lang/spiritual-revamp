export function Skeleton({ className = '' }) {
  return (
    <div className={`animate-pulse bg-white/5 rounded-lg ${className}`} />
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="bg-dark-50/80 rounded-2xl overflow-hidden border border-white/5 p-4">
      <Skeleton className="w-full aspect-square rounded-xl mb-4" />
      <Skeleton className="h-4 w-3/4 mb-2" />
      <Skeleton className="h-3 w-full mb-3" />
      <Skeleton className="h-4 w-1/3 mb-3" />
      <Skeleton className="h-10 w-full rounded-full" />
    </div>
  );
}

export function OrderRowSkeleton() {
  return (
    <div className="flex gap-4 p-4 border-b border-white/5">
      <Skeleton className="w-16 h-16 rounded-xl flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-3 w-1/3" />
      </div>
      <Skeleton className="h-6 w-20 rounded-full" />
    </div>
  );
}
