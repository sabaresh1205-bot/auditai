import Link from "next/link";
import { AuditForm } from "@/components/audit/AuditForm";

export default function AuditPage() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-6 py-14">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Audit</h1>
          <p className="mt-3 max-w-2xl text-zinc-700 dark:text-zinc-300">
            Enter your AI tool stack and spend. We’ll run deterministic rules to
            find waste and calculate savings (next step).
          </p>
        </div>
        <Link
          href="/"
          className="inline-flex h-10 items-center justify-center rounded-full border border-zinc-300 px-5 text-sm font-medium text-zinc-900 hover:bg-zinc-50 dark:border-white/15 dark:text-zinc-50 dark:hover:bg-white/5"
        >
          Back to landing
        </Link>
      </div>

      <AuditForm />
    </main>
  );
}

