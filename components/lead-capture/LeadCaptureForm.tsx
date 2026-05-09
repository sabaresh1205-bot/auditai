"use client";

import { useState } from "react";

const SESSION_KEY_PREFIX = "auditai:leadSubmitted:";

const SUCCESS_COPY = "✓ Thanks — your audit confirmation email has been sent.";

type LeadCaptureFormProps = {
  reportId: string | null;
  defaultTeamSize?: number;
  /** Efficient / low-savings audit: emphasize future optimization alerts. */
  optimizedStack?: boolean;
};

export function LeadCaptureForm({
  reportId,
  defaultTeamSize,
  optimizedStack = false,
}: LeadCaptureFormProps) {
  const [email, setEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [role, setRole] = useState("");
  const [teamSize, setTeamSize] = useState(defaultTeamSize ? String(defaultTeamSize) : "");
  const [honey, setHoney] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [lastAttemptAt, setLastAttemptAt] = useState<number | null>(null);

  const alreadySubmitted =
    Boolean(reportId) &&
    typeof window !== "undefined" &&
    window.sessionStorage.getItem(`${SESSION_KEY_PREFIX}${reportId}`) === "1";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === "loading" || alreadySubmitted) return;
    if (!reportId) {
      setStatus("error");
      setMessage("Finish saving your report, then submit your email.");
      return;
    }
    if (!email.includes("@")) {
      setStatus("error");
      setMessage("Please enter a valid email.");
      return;
    }
    if (lastAttemptAt && Date.now() - lastAttemptAt < 8_000) {
      setStatus("error");
      setMessage("Please wait a few seconds before retrying.");
      return;
    }

    setStatus("loading");
    setMessage("");
    const now = Date.now();
    setLastAttemptAt(now);

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          companyName: companyName || undefined,
          role: role || undefined,
          teamSize: teamSize ? Number(teamSize) : undefined,
          honey,
          // Send the *previous* attempt time (if any). Sending "now" would
          // incorrectly trip the server-side cooldown on first submit.
          cooldownAt: lastAttemptAt ?? undefined,
          reportId,
        }),
      });
      const data = (await res.json()) as { error?: { message?: string } | string };
      if (!res.ok) {
        const errMsg =
          typeof data.error === "string"
            ? data.error
            : data.error?.message || "Failed to submit.";
        throw new Error(errMsg);
      }

      window.sessionStorage.setItem(`${SESSION_KEY_PREFIX}${reportId}`, "1");
      setEmail("");
      setCompanyName("");
      setRole("");
      setTeamSize("");
      setHoney("");
      setStatus("success");
      setMessage("");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Submission failed.");
    }
  }

  return (
    <section className="no-print rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
      <h2 className="text-lg font-semibold tracking-tight">Optional follow-up</h2>
      <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
        {optimizedStack ? (
          <>
            <span className="font-medium text-zinc-800 dark:text-zinc-200">
              Notify me about future optimization opportunities.
            </span>{" "}
            Add your work email below—we’ll only reach out when new pricing or tooling shifts might
            help your stack.
          </>
        ) : (
          <>Your audit is complete—add email only if you want us to reach out with updates.</>
        )}
      </p>

      {alreadySubmitted ? (
        <p
          role="status"
          aria-live="polite"
          className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-200"
        >
          {SUCCESS_COPY}
        </p>
      ) : (
        <form className="mt-4 grid gap-3" onSubmit={onSubmit}>
          <label className="grid gap-1 text-left text-sm">
            <span className="font-medium">Work email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="h-11 rounded-xl border border-zinc-300 bg-white px-3 text-sm dark:border-white/15 dark:bg-black/20"
            />
          </label>
          <label className="grid gap-1 text-left text-sm">
            <span className="font-medium">Company (optional)</span>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="company name"
              className="h-11 rounded-xl border border-zinc-300 bg-white px-3 text-sm dark:border-white/15 dark:bg-black/20"
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1 text-left text-sm">
              <span className="font-medium">Role (optional)</span>
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g. CTO, founder"
                className="h-11 rounded-xl border border-zinc-300 bg-white px-3 text-sm dark:border-white/15 dark:bg-black/20"
              />
            </label>
            <label className="grid gap-1 text-left text-sm">
              <span className="font-medium">Team size (optional)</span>
              <input
                type="number"
                min={1}
                value={teamSize}
                onChange={(e) => setTeamSize(e.target.value)}
                placeholder="e.g. 10"
                className="h-11 rounded-xl border border-zinc-300 bg-white px-3 text-sm dark:border-white/15 dark:bg-black/20"
              />
            </label>
          </div>
          <input
            aria-hidden
            tabIndex={-1}
            autoComplete="off"
            value={honey}
            onChange={(e) => setHoney(e.target.value)}
            className="hidden"
            name="website"
          />
          <button
            type="submit"
            disabled={status === "loading"}
            className="inline-flex w-full items-center justify-center rounded-xl bg-zinc-900 px-4 py-3 text-center text-sm font-medium leading-snug text-white hover:bg-zinc-800 disabled:opacity-60 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          >
            {status === "loading" ? (
              "Submitting…"
            ) : optimizedStack ? (
              "Notify me about future optimization opportunities"
            ) : (
              "Submit"
            )}
          </button>
        </form>
      )}

      {message && !alreadySubmitted ? (
        <p
          role="status"
          aria-live="polite"
          className={`mt-3 text-sm ${
            status === "success"
              ? "text-emerald-700 dark:text-emerald-300"
              : "text-red-600 dark:text-red-300"
          }`}
        >
          {message}
        </p>
      ) : null}
    </section>
  );
}
