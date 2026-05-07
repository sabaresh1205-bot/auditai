import type { StoredAuditV1 } from "@/contexts/AuditReportContext";

const KEY_PREFIX = "auditai:reportPersistedByKey:";

export function buildPersistKey(stored: StoredAuditV1): string {
  // Deterministic key from generated report payload.
  return `${stored.generatedAtIso}:${JSON.stringify(stored.input)}:${JSON.stringify(stored.report)}`;
}

export function getPersistedIdByKey(key: string): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(`${KEY_PREFIX}${key}`);
}

export function setPersistedIdByKey(key: string, id: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(`${KEY_PREFIX}${key}`, id);
}

