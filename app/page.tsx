import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-full bg-white text-zinc-950 dark:bg-black dark:text-zinc-50">
      <header className="sticky top-0 z-10 border-b border-zinc-200/60 bg-white/80 backdrop-blur dark:border-white/10 dark:bg-black/60">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2 font-semibold tracking-tight">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 text-white dark:bg-white dark:text-black">
              AI
            </span>
            <span>AuditAI</span>
          </div>
          <nav className="flex items-center gap-3">
            <Link
              href="/audit"
              className="inline-flex h-10 items-center justify-center rounded-full bg-zinc-900 px-5 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
            >
              Run a free audit
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-6xl px-6 pb-14 pt-16">
          <div className="grid gap-10 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-7">
              <p className="inline-flex items-center rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-medium text-zinc-700 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200">
                Rule-based spend audit • No login required
              </p>
              <h1 className="mt-5 text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
                Audit and optimize your AI tool spend in minutes.
              </h1>
              <p className="mt-4 max-w-2xl text-pretty text-lg leading-8 text-zinc-700 dark:text-zinc-300">
                Enter your tools, plans, seats, and monthly spend. AuditAI flags
                overkill plans, redundant subscriptions, and credit-based savings
                opportunities—then estimates what you can save.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link
                  href="/audit"
                  className="inline-flex h-12 items-center justify-center rounded-full bg-zinc-900 px-6 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
                >
                  Start the audit
                </Link>
                <div className="text-sm text-zinc-600 dark:text-zinc-400">
                  Get recommendations and savings first. Email comes after.
                </div>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
                <div className="text-sm font-semibold">What you’ll get</div>
                <dl className="mt-4 grid gap-4">
                  <div className="rounded-xl bg-zinc-50 p-4 dark:bg-black/30">
                    <dt className="text-sm font-medium">Per-tool actions</dt>
                    <dd className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                      Concrete changes with numeric savings and a clear reason.
                    </dd>
                  </div>
                  <div className="rounded-xl bg-zinc-50 p-4 dark:bg-black/30">
                    <dt className="text-sm font-medium">Savings math</dt>
                    <dd className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                      Monthly and yearly savings totals, plus cost-per-seat.
                    </dd>
                  </div>
                  <div className="rounded-xl bg-zinc-50 p-4 dark:bg-black/30">
                    <dt className="text-sm font-medium">Shareable report</dt>
                    <dd className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                      A public URL you can send to your cofounder or finance.
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-zinc-200/70 bg-zinc-50 dark:border-white/10 dark:bg-white/5">
          <div className="mx-auto max-w-6xl px-6 py-14">
            <h2 className="text-xl font-semibold tracking-tight">
              How it works
            </h2>
            <div className="mt-6 grid gap-6 md:grid-cols-3">
              <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-white/10 dark:bg-black/20">
                <div className="text-sm font-semibold">1) Input your stack</div>
                <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                  Tools, plan types, monthly spend, seats, team size, and use
                  case.
                </p>
              </div>
              <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-white/10 dark:bg-black/20">
                <div className="text-sm font-semibold">2) Rules run</div>
                <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                  Deterministic checks for plan optimization, redundancy, and
                  credits/usage mismatches.
                </p>
              </div>
              <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-white/10 dark:bg-black/20">
                <div className="text-sm font-semibold">3) See savings</div>
                <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                  Actionable recommendations with numeric savings and a clear
                  reason.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-zinc-200/70 dark:border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 py-10 text-sm text-zinc-600 dark:text-zinc-400 sm:flex-row sm:items-center sm:justify-between">
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
