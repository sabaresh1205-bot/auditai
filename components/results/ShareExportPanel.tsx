"use client";

import { useState } from "react";

export function ShareExportPanel({ shareUrl }: { shareUrl: string | null }) {
  const [copied, setCopied] = useState(false);

  async function copyShareLink() {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function exportPdf() {
    // Browsers support "Save as PDF" through the print dialog.
    window.print();
  }

  function emailReport() {
    if (!shareUrl) return;
    const subject = encodeURIComponent("AuditAI report");
    const body = encodeURIComponent(`Here is the AuditAI report:\n\n${shareUrl}`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  }

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
      <h2 className="text-lg font-semibold tracking-tight">Share & export</h2>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
        Shareable report URL is available after report persistence.
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <button
          type="button"
          onClick={copyShareLink}
          disabled={!shareUrl}
          className="inline-flex h-11 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 px-4 text-sm font-medium text-zinc-700 disabled:text-zinc-400 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 dark:disabled:text-zinc-500"
        >
          {copied ? "Copied!" : "Copy share link"}
        </button>
        <button
          type="button"
          onClick={exportPdf}
          className="inline-flex h-11 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 px-4 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10"
        >
          Export PDF
        </button>
        <button
          type="button"
          onClick={emailReport}
          disabled={!shareUrl}
          className="inline-flex h-11 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 px-4 text-sm font-medium text-zinc-700 hover:bg-zinc-100 disabled:text-zinc-400 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10 dark:disabled:text-zinc-500"
        >
          Email report
        </button>
      </div>
    </section>
  );
}

