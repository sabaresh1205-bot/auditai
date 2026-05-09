"use client";

export function ResultsSkeleton() {
  return (
    <div
      className="space-y-6"
      role="status"
      aria-busy="true"
      aria-label="Loading audit results"
    >
      <div className="h-44 animate-pulse rounded-3xl bg-zinc-100 dark:bg-white/10" />
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8 space-y-4">
          <div className="h-24 animate-pulse rounded-3xl bg-zinc-100 dark:bg-white/10" />
          <div className="h-44 animate-pulse rounded-3xl bg-zinc-100 dark:bg-white/10" />
          <div className="h-44 animate-pulse rounded-3xl bg-zinc-100 dark:bg-white/10" />
        </div>
        <div className="lg:col-span-4 space-y-4">
          <div className="h-52 animate-pulse rounded-3xl bg-zinc-100 dark:bg-white/10" />
          <div className="h-52 animate-pulse rounded-3xl bg-zinc-100 dark:bg-white/10" />
        </div>
      </div>
    </div>
  );
}

