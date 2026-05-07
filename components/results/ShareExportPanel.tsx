"use client";

export function ShareExportPanel() {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
      <h2 className="text-lg font-semibold tracking-tight">Share & export</h2>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
        Coming next: generate a public report URL and exports.
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <button
          type="button"
          disabled
          className="inline-flex h-11 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 px-4 text-sm font-medium text-zinc-500 dark:border-white/10 dark:bg-white/5 dark:text-zinc-400"
        >
          Copy share link
        </button>
        <button
          type="button"
          disabled
          className="inline-flex h-11 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 px-4 text-sm font-medium text-zinc-500 dark:border-white/10 dark:bg-white/5 dark:text-zinc-400"
        >
          Export PDF
        </button>
        <button
          type="button"
          disabled
          className="inline-flex h-11 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 px-4 text-sm font-medium text-zinc-500 dark:border-white/10 dark:bg-white/5 dark:text-zinc-400"
        >
          Email report
        </button>
      </div>
    </section>
  );
}

