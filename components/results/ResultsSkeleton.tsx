"use client";

export function ResultsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-40 animate-pulse rounded-2xl bg-zinc-100 dark:bg-white/10" />
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8 space-y-4">
          <div className="h-40 animate-pulse rounded-2xl bg-zinc-100 dark:bg-white/10" />
          <div className="h-40 animate-pulse rounded-2xl bg-zinc-100 dark:bg-white/10" />
          <div className="h-40 animate-pulse rounded-2xl bg-zinc-100 dark:bg-white/10" />
        </div>
        <div className="lg:col-span-4 space-y-4">
          <div className="h-48 animate-pulse rounded-2xl bg-zinc-100 dark:bg-white/10" />
          <div className="h-48 animate-pulse rounded-2xl bg-zinc-100 dark:bg-white/10" />
        </div>
      </div>
    </div>
  );
}

