import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-full bg-zinc-50 text-zinc-950 dark:bg-black dark:text-zinc-50">
      <header className="sticky top-0 z-10 border-b border-zinc-200/70 bg-white/90 backdrop-blur dark:border-white/10 dark:bg-black/70">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-6">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-semibold tracking-tight sm:text-base"
            aria-label="AuditAI home"
          >
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 text-xs font-bold text-white dark:bg-white dark:text-black" aria-hidden>
              AI
            </span>
            <span className="text-zinc-900 dark:text-zinc-100">AuditAI</span>
          </Link>
          <nav className="flex items-center gap-3">
            <Link
              href="/audit"
              className="inline-flex h-10 items-center justify-center rounded-xl bg-zinc-900 px-5 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
            >
              Run Free Audit
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-6xl px-5 pb-12 pt-14 sm:px-6 sm:pt-16">
          <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-zinc-950/50 sm:p-10">
            <div className="mx-auto max-w-3xl text-center">
              <p className="inline-flex items-center rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-medium text-zinc-700 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200">
                Deterministic AI spend audit
              </p>
              <h1 className="mt-5 text-balance text-4xl font-semibold tracking-tight sm:text-5xl md:text-6xl">
                Stop overpaying for AI tools.
              </h1>
              <p className="mx-auto mt-5 max-w-2xl text-pretty text-base leading-7 text-zinc-600 dark:text-zinc-300 sm:text-lg">
                AuditAI scores your stack with transparent, rule-based logic: plan fit,
                overlap, seats, and usage signals. You get an exportable savings report in
                minutes, plus an optional AI executive summary—with a deterministic fallback
                if the model isn’t available.
              </p>

              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row sm:items-center">
                <Link
                  href="/audit"
                  className="inline-flex h-12 items-center justify-center rounded-xl bg-zinc-900 px-7 text-sm font-semibold text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
                >
                  Run Free Audit
                </Link>
                <div className="text-sm text-zinc-500 dark:text-zinc-400">
                  No account required
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 pb-12 sm:px-6">
          <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-zinc-950/40 sm:p-8">
            <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">How it works</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50 p-5 dark:border-white/10 dark:bg-black/20">
                <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Input your stack</div>
                <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                  Add tools, plans, monthly spend, seats, team size, and primary use case.
                </p>
              </div>
              <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50 p-5 dark:border-white/10 dark:bg-black/20">
                <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">The audit runs</div>
                <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                  Deterministic rules evaluate plan fit, overlap, seats, efficiency, and credit opportunities—without guessing.
                </p>
              </div>
              <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50 p-5 dark:border-white/10 dark:bg-black/20">
                <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Get savings report</div>
                <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                  Review clear recommendations, savings totals, and a shareable report link.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 pb-16 sm:px-6">
          <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-zinc-950/40 sm:p-8">
            <h3 className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
              Built for teams that need clarity, not hype
            </h3>
            <div className="mt-4 grid gap-3 text-sm text-zinc-600 dark:text-zinc-300 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl bg-zinc-50 px-4 py-3 dark:bg-black/20">Deterministic recommendations</div>
              <div className="rounded-xl bg-zinc-50 px-4 py-3 dark:bg-black/20">No account required</div>
              <div className="rounded-xl bg-zinc-50 px-4 py-3 dark:bg-black/20">Shareable report links</div>
              <div className="rounded-xl bg-zinc-50 px-4 py-3 dark:bg-black/20">AI summary + deterministic fallback</div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-zinc-200/70 dark:border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-5 py-10 text-sm text-zinc-600 dark:text-zinc-400 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>© {new Date().getFullYear()} AuditAI</div>
          <div className="flex gap-4">
            <span className="text-zinc-500 dark:text-zinc-500">
              Built for startups
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
